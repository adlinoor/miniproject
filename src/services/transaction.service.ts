import prisma from "../lib/prisma";
import { TransactionStatus } from "@prisma/client";
import { sendEmail } from "./email.service";

// Constants from requirements
const PAYMENT_WINDOW_HOURS = 2;
const POINT_EXPIRY_MONTHS = 3;

export const createTransaction = async (
  userId: number,
  eventId: number,
  quantity: number,
  voucherCode?: string,
  pointsUsed?: number,
  ticketTypeId?: number
) => {
  // Input validation (redundant since controller already validated)
  if (!userId || !eventId || !quantity) {
    throw new Error("Missing required fields");
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Validate event and user
    const [event, user] = await Promise.all([
      tx.event.findUnique({
        where: { id: eventId },
        include: { tickets: true },
      }),
      tx.user.findUnique({ where: { id: userId } }),
    ]);

    if (!event) throw new Error("Event not found");
    if (!user) throw new Error("User not found");

    // 2. Handle ticket type if specified
    let ticketPrice = event.price;
    if (ticketTypeId) {
      const ticket = event.tickets.find((t) => t.id === ticketTypeId);
      if (!ticket) throw new Error("Invalid ticket type");
      if (ticket.quantity < quantity)
        throw new Error("Not enough tickets available");
      ticketPrice = ticket.price;
    }

    // 3. Calculate price with discounts
    let totalPrice = ticketPrice * quantity;
    let appliedVoucherId: string | null = null;

    // Apply voucher if provided
    if (voucherCode) {
      const voucher = await tx.promotion.findUnique({
        where: { code: voucherCode, eventId },
      });
      if (!voucher || voucher.endDate < new Date())
        throw new Error("Invalid or expired voucher");
      totalPrice = Math.max(0, totalPrice - voucher.discount);
      appliedVoucherId = voucher.id;
    }

    // Apply points if specified
    if (pointsUsed && pointsUsed > 0) {
      if (pointsUsed > user.userPoints) throw new Error("Not enough points");
      totalPrice = Math.max(0, totalPrice - pointsUsed);
    }

    // 4. Create transaction
    const transaction = await tx.transaction.create({
      data: {
        userId,
        eventId,
        quantity,
        totalPrice,
        status: TransactionStatus.waiting_for_payment,
        expiresAt: new Date(Date.now() + PAYMENT_WINDOW_HOURS * 60 * 60 * 1000),
        voucherCode,
        pointsUsed: pointsUsed || 0,
        details: ticketTypeId
          ? {
              create: [
                {
                  ticketId: ticketTypeId,
                  quantity,
                },
              ],
            }
          : undefined,
      },
      include: { event: true, user: true, details: true },
    });

    // 5. Update inventory
    await Promise.all([
      tx.event.update({
        where: { id: eventId },
        data: { availableSeats: { decrement: quantity } },
      }),
      ...(ticketTypeId
        ? [
            tx.ticket.update({
              where: { id: ticketTypeId },
              data: { quantity: { decrement: quantity } },
            }),
          ]
        : []),
      ...(pointsUsed
        ? [
            tx.user.update({
              where: { id: userId },
              data: { userPoints: { decrement: pointsUsed } },
            }),
          ]
        : []),
    ]);

    return {
      ...transaction,
      paymentWindow: PAYMENT_WINDOW_HOURS,
      nextSteps: "Please complete payment within 2 hours",
    };
  });
};

export const getTransaction = async (id: number) => {
  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: {
      event: true,
      user: { select: { email: true, first_name: true, last_name: true } },
      details: { include: { ticket: true } },
    },
  });

  if (!transaction) throw new Error("Transaction not found");
  return transaction;
};

export const updateTransactionStatus = async (
  id: number,
  status: TransactionStatus,
  paymentProof?: string
) => {
  return await prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.findUnique({
      where: { id },
      include: { event: true, user: true, details: true },
    });

    if (!transaction) throw new Error("Transaction not found");

    // Handle status changes
    switch (status) {
      case TransactionStatus.waiting_for_admin_confirmation:
        if (!paymentProof) throw new Error("Payment proof required");
        break;

      case TransactionStatus.rejected:
      case TransactionStatus.expired:
      case TransactionStatus.canceled:
        await restoreResources(tx, transaction);
        if (status === TransactionStatus.rejected) {
          await sendEmail(
            transaction.user.email,
            "Transaction Rejected",
            `Your transaction for ${transaction.event.title} was rejected.`
          );
        }
        break;
    }

    return await tx.transaction.update({
      where: { id },
      data: { status, ...(paymentProof && { paymentProof }) },
    });
  });
};

async function restoreResources(tx: any, transaction: any) {
  // Restore seats/tickets
  await Promise.all([
    tx.event.update({
      where: { id: transaction.eventId },
      data: { availableSeats: { increment: transaction.quantity } },
    }),
    ...(transaction.details?.map((detail: any) =>
      tx.ticket.update({
        where: { id: detail.ticketId },
        data: { quantity: { increment: detail.quantity } },
      })
    ) || []),
  ]);

  // Restore points if used
  if (transaction.pointsUsed > 0) {
    await tx.point.create({
      data: {
        userId: transaction.userId,
        amount: transaction.pointsUsed,
        expiresAt: new Date(
          new Date().setMonth(new Date().getMonth() + POINT_EXPIRY_MONTHS)
        ),
      },
    });
  }
}

export const checkTransactionExpirations = async () => {
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    // Expire unpaid transactions
    const unpaidExpired = await tx.transaction.findMany({
      where: {
        status: TransactionStatus.waiting_for_payment,
        expiresAt: { lt: now },
      },
    });

    // Auto-cancel unresponded transactions (using same expiresAt field)
    const unresponded = await tx.transaction.findMany({
      where: {
        status: TransactionStatus.waiting_for_admin_confirmation,
        expiresAt: { lt: now },
      },
    });

    await Promise.all([
      ...unpaidExpired.map((t) =>
        updateTransactionStatus(t.id, TransactionStatus.expired)
      ),
      ...unresponded.map((t) =>
        updateTransactionStatus(t.id, TransactionStatus.canceled)
      ),
    ]);
  });
};

export const getUserTransactions = async (userId: number) => {
  return await prisma.transaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      event: {
        select: {
          title: true,
          startDate: true,
          location: true,
        },
      },
    },
  });
};
