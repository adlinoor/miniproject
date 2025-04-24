import prisma from "../lib/prisma"; // Import Prisma Client
import { z } from "zod"; // For validation
import { TransactionStatus } from "@prisma/client"; // Prisma Enum for Transaction Status
import { sendEmail } from "./email.service"; // Email service for notifications
import { uploadToCloudinary } from "./cloudinary.service"; // Cloudinary service for file uploads

// Zod validation schemas
export const createTransactionSchema = z.object({
  eventId: z.string(), // Expecting string from input, will convert to number
  ticketId: z.string(), // Expecting string from input, will convert to number
  quantity: z.number().min(1),
  voucherCode: z.string().optional(),
  usePoints: z.boolean().optional(),
});

// Create a new transaction
export const createTransaction = async (
  data: z.infer<typeof createTransactionSchema>,
  userId: number // Ensure userId is a number to match Prisma schema
) => {
  const { eventId, ticketId, quantity, voucherCode, usePoints } = data;

  // Convert string IDs to numbers
  const eventIdNumber = parseInt(eventId, 10);
  const ticketIdNumber = parseInt(ticketId, 10);

  if (isNaN(eventIdNumber) || isNaN(ticketIdNumber)) {
    throw new Error("Invalid eventId or ticketId");
  }

  // Fetch event and ticket details
  const event = await prisma.event.findUnique({ where: { id: eventIdNumber } });
  if (!event) throw new Error("Event not found");

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketIdNumber },
  });
  if (!ticket || ticket.eventId !== eventIdNumber)
    throw new Error("Ticket not found");

  // Check ticket availability
  if (ticket.quantity < quantity) throw new Error("Not enough available seats");

  // Calculate total price
  let totalPrice = ticket.price * quantity;
  let discount = 0;
  let pointsUsed = 0;

  // Apply voucher if provided
  if (voucherCode) {
    const voucher = await prisma.promotion.findUnique({
      where: { code: voucherCode },
    });

    if (!voucher || voucher.eventId !== eventIdNumber)
      throw new Error("Invalid voucher code");
    if (voucher.startDate > new Date() || voucher.endDate < new Date())
      throw new Error("Voucher is not valid at this time");
    if (voucher.maxUses && voucher.uses >= voucher.maxUses)
      throw new Error("Voucher has reached its usage limit");

    discount = voucher.discount;
    totalPrice = totalPrice * (1 - discount / 100);
  }

  // Apply points if requested
  if (usePoints) {
    const userPoints = await prisma.point.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
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
    }
  }

  // Set expiration time (2 hours from now)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 2);

  // Create transaction
  const transaction = await prisma.transaction.create({
    data: {
      eventId: eventIdNumber,
      userId,
      quantity,
      totalPrice: Math.max(0, totalPrice), // Ensure price doesn't go negative
      status: TransactionStatus.waiting_for_payment, // Use camelCase enum value
      expiresAt,
      voucherCode,
      pointsUsed,
    },
  });

  // Update ticket quantity
  await prisma.ticket.update({
    where: { id: ticketIdNumber },
    data: { quantity: ticket.quantity - quantity },
  });

  return transaction;
};

// Upload payment proof
export const uploadPaymentProof = async (
  transactionId: number, // Ensure transactionId is a number
  userId: number, // Ensure userId is a number
  file: Express.Multer.File
) => {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
  });

  if (!transaction || transaction.userId !== userId)
    throw new Error("Transaction not found");

  if (transaction.status !== TransactionStatus.waiting_for_payment)
    throw new Error(
      "Payment proof can only be uploaded for waiting payment transactions"
    );

  const proofUrl = await uploadToCloudinary(file);

  const updatedTransaction = await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      paymentProof: proofUrl,
      status: TransactionStatus.waiting_for_admin_confirmation, // Use camelCase enum value
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // New expiration in 3 days
    },
  });

  return updatedTransaction;
};

// Confirm or reject a transaction
export const confirmTransaction = async (
  transactionId: number, // Ensure transactionId is a number
  organizerId: number, // Ensure organizerId is a number
  accept: boolean
) => {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { event: true },
  });

  if (!transaction || transaction.event.organizerId !== organizerId)
    throw new Error("Transaction not found");

  if (transaction.status !== TransactionStatus.waiting_for_admin_confirmation)
    throw new Error("Only waiting confirmation transactions can be confirmed");

  let updatedTransaction;

  if (accept) {
    updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: TransactionStatus.done }, // Use camelCase enum value
    });

    if (transaction.voucherCode) {
      await prisma.promotion.update({
        where: { code: transaction.voucherCode },
        data: { uses: { increment: 1 } },
      });
    }

    if (transaction.pointsUsed > 0) {
      await deductPoints(transaction.userId, transaction.pointsUsed);
    }

    await sendConfirmationEmail(transactionId, true);
  } else {
    await prisma.$transaction(async (prisma) => {
      const ticket = await prisma.ticket.findFirst({
        where: { eventId: transaction.eventId },
      });

      if (ticket) {
        await prisma.ticket.update({
          where: { id: ticket.id },
          data: { quantity: { increment: transaction.quantity } },
        });
      }

      updatedTransaction = await prisma.transaction.update({
        where: { id: transactionId },
        data: { status: TransactionStatus.rejected }, // Use camelCase enum value
      });

      if (transaction.pointsUsed > 0) {
        await returnPoints(transaction.userId, transaction.pointsUsed);
      }
    });

    await sendConfirmationEmail(transactionId, false);
  }

  return updatedTransaction;
};

// Deduct points from a user
const deductPoints = async (userId: number, amount: number) => {
  const userPoints = await prisma.point.findMany({
    where: { userId, expiresAt: { gt: new Date() } },
    orderBy: { expiresAt: "asc" },
  });

  let remaining = amount;
  for (const point of userPoints) {
    if (remaining <= 0) break;

    const deductAmount = Math.min(point.amount, remaining);
    await prisma.point.update({
      where: { id: point.id },
      data: { amount: { decrement: deductAmount } },
    });

    remaining -= deductAmount;
  }
};

// Return points to a user
const returnPoints = async (userId: number, amount: number) => {
  const expirationDate = new Date();
  expirationDate.setMonth(expirationDate.getMonth() + 3);

  await prisma.point.create({
    data: { userId, amount, expiresAt: expirationDate },
  });
};

// Send confirmation email
const sendConfirmationEmail = async (
  transactionId: number,
  accepted: boolean
) => {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { event: true, user: true },
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
