import prisma from "../lib/prisma";
import { Prisma, TransactionStatus } from "@prisma/client";
import { sendEmail } from "./email.service";

type TransactionWithDetails = Prisma.TransactionGetPayload<{
  include: {
    event: true;
    user: { select: { email: true; first_name: true; last_name: true } };
    details: { include: { ticket: true } };
  };
}>;

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
  return await prisma.$transaction(async (tx) => {
    // 1. Validate event and user
    const [event, user] = await Promise.all([
      tx.event.findUnique({
        where: { id: eventId },
        include: { tickets: true },
      }),
      tx.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          userPoints: true,
        },
      }),
    ]);

    if (!event) throw new Error("Event not found");
    if (!user) throw new Error("User not found");
    if (event.availableSeats < quantity) {
      throw new Error("Not enough available seats for this event");
    }

    // 2. Handle ticket type if specified
    let ticketPrice = event.price;
    if (ticketTypeId) {
      const ticket = event.tickets.find((t) => t.id === ticketTypeId);
      if (!ticket) throw new Error("Invalid ticket type");
      if (ticket.quantity < quantity) {
        throw new Error("Not enough tickets available");
      }
      ticketPrice = ticket.price;
    }

    // 3. Calculate price with discounts
    let totalPrice = ticketPrice * quantity;
    let appliedVoucherId: string | null = null;

    if (voucherCode) {
      const voucher = await tx.promotion.findUnique({
        where: { code: voucherCode, eventId },
      });

      if (
        !voucher ||
        voucher.endDate < new Date() ||
        (voucher.maxUses !== null && voucher.uses >= voucher.maxUses)
      ) {
        throw new Error("Invalid or expired voucher");
      }

      totalPrice = Math.max(0, totalPrice - voucher.discount);
      appliedVoucherId = voucher.id;
    }

    if (typeof pointsUsed === "number" && pointsUsed > 0) {
      if (pointsUsed > user.userPoints) {
        throw new Error("Not enough points");
      }
      totalPrice = Math.max(0, totalPrice - pointsUsed);
    }

    // 4. Create transaction
    const transaction = await tx.transaction.create({
      data: {
        userId,
        eventId,
        quantity,
        totalPrice,
        status: TransactionStatus.WAITING_FOR_PAYMENT,
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
    const updateOperations: Promise<any>[] = [];

    updateOperations.push(
      tx.event.update({
        where: { id: eventId },
        data: { availableSeats: { decrement: quantity } },
      })
    );

    if (ticketTypeId) {
      updateOperations.push(
        tx.ticket.update({
          where: { id: ticketTypeId },
          data: { quantity: { decrement: quantity } },
        })
      );
    }

    if (typeof pointsUsed === "number" && pointsUsed > 0) {
      updateOperations.push(
        tx.user.update({
          where: { id: userId },
          data: { userPoints: { decrement: pointsUsed } },
        })
      );
    }

    if (appliedVoucherId) {
      updateOperations.push(
        tx.promotion.update({
          where: { id: appliedVoucherId },
          data: { uses: { increment: 1 } },
        })
      );
    }

    await Promise.all(updateOperations);

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

    switch (status) {
      case TransactionStatus.WAITING_FOR_ADMIN_CONFIRMATION:
        if (!paymentProof) throw new Error("Payment proof required");
        break;

      case TransactionStatus.REJECTED:
      case TransactionStatus.EXPIRED:
      case TransactionStatus.CANCELED:
        await restoreResources(tx, transaction);
        if (status === TransactionStatus.REJECTED) {
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

  // Restore voucher if used
  if (transaction.voucherCode) {
    await tx.voucher.updateMany({
      where: {
        code: transaction.voucherCode,
        eventId: transaction.eventId,
      },
      data: {
        isUsed: false,
      },
    });
  }
}

export const checkTransactionExpirations = async () => {
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const unpaidExpired = await tx.transaction.findMany({
      where: {
        status: TransactionStatus.WAITING_FOR_PAYMENT,
        expiresAt: { lt: now },
      },
    });

    const unresponded = await tx.transaction.findMany({
      where: {
        status: TransactionStatus.WAITING_FOR_ADMIN_CONFIRMATION,
        expiresAt: { lt: now },
      },
    });

    await Promise.all([
      ...unpaidExpired.map((t) =>
        updateTransactionStatus(t.id, TransactionStatus.EXPIRED)
      ),
      ...unresponded.map((t) =>
        updateTransactionStatus(t.id, TransactionStatus.CANCELED)
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
