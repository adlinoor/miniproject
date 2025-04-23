import { prisma } from "../app";
import { z } from "zod";
import { TransactionStatus } from "@prisma/client";
import { sendEmail } from "./email.service";
import { uploadToCloudinary } from "./cloudinary.service";

// Zod validation schemas
export const createTransactionSchema = z.object({
  eventId: z.string(),
  ticketId: z.string(),
  quantity: z.number().min(1),
  voucherCode: z.string().optional(),
  usePoints: z.boolean().optional(),
});

export const createTransaction = async (
  data: z.infer<typeof createTransactionSchema>,
  userId: string
) => {
  const { eventId, ticketId, quantity, voucherCode, usePoints } = data;

  // Get event and ticket
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    throw new Error("Event not found");
  }

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket || ticket.eventId !== eventId) {
    throw new Error("Ticket not found");
  }

  // Check available seats
  if (ticket.quantity < quantity) {
    throw new Error("Not enough available seats");
  }

  // Calculate total price
  let totalPrice = ticket.price * quantity;
  let discount = 0;
  let pointsUsed = 0;

  // Apply voucher if provided
  if (voucherCode) {
    const voucher = await prisma.promotion.findUnique({
      where: { code: voucherCode },
    });

    if (!voucher || voucher.eventId !== eventId) {
      throw new Error("Invalid voucher code");
    }

    if (voucher.startDate > new Date() || voucher.endDate < new Date()) {
      throw new Error("Voucher is not valid at this time");
    }

    if (voucher.maxUses && voucher.uses >= voucher.maxUses) {
      throw new Error("Voucher has reached its usage limit");
    }

    discount = voucher.discount;
    totalPrice = totalPrice * (1 - discount / 100);
  }

  // Apply points if requested
  if (usePoints) {
    const userPoints = await prisma.point.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { expiresAt: "asc" }, // Use oldest points first
    });

    const totalAvailablePoints = userPoints.reduce(
      (sum, point) => sum + point.amount,
      0
    );
    const maxPointsToUse = Math.min(totalAvailablePoints, totalPrice);

    if (maxPointsToUse > 0) {
      pointsUsed = maxPointsToUse;
      totalPrice -= pointsUsed;

      // Mark points as used (we'll actually deduct them when transaction is confirmed)
    }
  }

  // Set expiration time (2 hours from now)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 2);

  // Create transaction
  const transaction = await prisma.transaction.create({
    data: {
      eventId,
      userId,
      quantity,
      totalPrice: Math.max(0, totalPrice), // Ensure price doesn't go negative
      status: "WAITING_PAYMENT",
      expiresAt,
      voucherCode,
      pointsUsed,
    },
  });

  // Update ticket quantity
  await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      quantity: ticket.quantity - quantity,
    },
  });

  return transaction;
};

export const uploadPaymentProof = async (
  transactionId: string,
  userId: string,
  file: Express.Multer.File
) => {
  // Verify transaction belongs to user
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
  });

  if (!transaction || transaction.userId !== userId) {
    throw new Error("Transaction not found");
  }

  if (transaction.status !== "WAITING_PAYMENT") {
    throw new Error(
      "Payment proof can only be uploaded for waiting payment transactions"
    );
  }

  // Upload proof to Cloudinary
  const proofUrl = await uploadToCloudinary(file);

  // Update transaction
  const updatedTransaction = await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      paymentProof: proofUrl,
      status: "WAITING_CONFIRMATION",
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // New expiration in 3 days
    },
  });

  return updatedTransaction;
};

export const confirmTransaction = async (
  transactionId: string,
  organizerId: string,
  accept: boolean
) => {
  // Verify transaction belongs to organizer's event
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { event: true },
  });

  if (!transaction || transaction.event.organizerId !== organizerId) {
    throw new Error("Transaction not found");
  }

  if (transaction.status !== "WAITING_CONFIRMATION") {
    throw new Error("Only waiting confirmation transactions can be confirmed");
  }

  let updatedTransaction;

  if (accept) {
    // Mark transaction as done
    updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: "DONE",
      },
    });

    // Mark voucher as used if applicable
    if (transaction.voucherCode) {
      await prisma.promotion.update({
        where: { code: transaction.voucherCode },
        data: {
          uses: { increment: 1 },
        },
      });
    }

    // Deduct points if used
    if (transaction.pointsUsed > 0) {
      await deductPoints(transaction.userId, transaction.pointsUsed);
    }

    // Send confirmation email
    await sendConfirmationEmail(transactionId, true);
  } else {
    // Reject transaction and restore seats
    await prisma.$transaction(async (prisma) => {
      // Restore ticket quantity
      const ticket = await prisma.ticket.findFirst({
        where: { eventId: transaction.eventId },
      });

      if (ticket) {
        await prisma.ticket.update({
          where: { id: ticket.id },
          data: {
            quantity: { increment: transaction.quantity },
          },
        });
      }

      // Update transaction status
      updatedTransaction = await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: "REJECTED",
        },
      });

      // Return points if used
      if (transaction.pointsUsed > 0) {
        await returnPoints(transaction.userId, transaction.pointsUsed);
      }
    });

    // Send rejection email
    await sendConfirmationEmail(transactionId, false);
  }

  return updatedTransaction;
};

export const checkExpiredTransactions = async () => {
  const now = new Date();

  // Find expired waiting payment transactions
  const expiredWaitingPayment = await prisma.transaction.findMany({
    where: {
      status: "WAITING_PAYMENT",
      expiresAt: { lte: now },
    },
    include: {
      event: {
        include: {
          tickets: true,
        },
      },
    },
  });

  // Process each expired transaction
  for (const transaction of expiredWaitingPayment) {
    await prisma.$transaction(async (prisma) => {
      // Restore ticket quantity
      const ticket = transaction.event.tickets[0]; // Simplified - in real app you'd need to find the correct ticket
      if (ticket) {
        await prisma.ticket.update({
          where: { id: ticket.id },
          data: {
            quantity: { increment: transaction.quantity },
          },
        });
      }

      // Update transaction status
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: "EXPIRED",
        },
      });
    });
  }

  // Find expired waiting confirmation transactions
  const expiredWaitingConfirmation = await prisma.transaction.findMany({
    where: {
      status: "WAITING_CONFIRMATION",
      expiresAt: { lte: now },
    },
    include: {
      event: {
        include: {
          tickets: true,
        },
      },
    },
  });

  // Process each expired confirmation
  for (const transaction of expiredWaitingConfirmation) {
    await prisma.$transaction(async (prisma) => {
      // Restore ticket quantity
      const ticket = transaction.event.tickets[0]; // Simplified
      if (ticket) {
        await prisma.ticket.update({
          where: { id: ticket.id },
          data: {
            quantity: { increment: transaction.quantity },
          },
        });
      }

      // Return points if used
      if (transaction.pointsUsed > 0) {
        await returnPoints(transaction.userId, transaction.pointsUsed);
      }

      // Update transaction status
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: "CANCELED",
        },
      });
    });
  }
};

const deductPoints = async (userId: string, amount: number) => {
  const userPoints = await prisma.point.findMany({
    where: {
      userId,
      expiresAt: { gt: new Date() },
    },
    orderBy: { expiresAt: "asc" },
  });

  let remaining = amount;
  for (const point of userPoints) {
    if (remaining <= 0) break;

    const deductAmount = Math.min(point.amount, remaining);
    await prisma.point.update({
      where: { id: point.id },
      data: {
        amount: { decrement: deductAmount },
      },
    });

    remaining -= deductAmount;
  }
};

const returnPoints = async (userId: string, amount: number) => {
  // Find active points record or create new one
  const now = new Date();
  const expirationDate = new Date();
  expirationDate.setMonth(now.getMonth() + 3); // Expires in 3 months

  await prisma.point.create({
    data: {
      userId,
      amount,
      expiresAt: expirationDate,
    },
  });
};

const sendConfirmationEmail = async (
  transactionId: string,
  accepted: boolean
) => {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      event: true,
      user: true,
    },
  });

  if (!transaction) return;

  const subject = accepted ? "Transaction Confirmed" : "Transaction Rejected";
  const text = accepted
    ? `Your transaction for ${transaction.event.title} has been confirmed.`
    : `Your transaction for ${transaction.event.title} has been rejected.`;

  await sendEmail({
    to: transaction.user.email,
    subject,
    text,
    html: `<p>${text}</p>`,
  });
};
