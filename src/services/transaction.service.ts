import prisma from "../lib/prisma";
import { TransactionStatus } from "@prisma/client";

export const createTransaction = async (
  userId: number,
  eventId: number,
  quantity: number
) => {
  return await prisma.$transaction(async (tx) => {
    try {
      // Check if event exists and has enough seats
      const event = await tx.event.findUnique({
        where: { id: eventId },
      });

      if (!event) {
        throw new Error("Event not found");
      }

      if (event.availableSeats < quantity) {
        throw new Error("Not enough available seats for this event");
      }

      // Create transaction
      const transaction = await tx.transaction.create({
        data: {
          userId,
          eventId,
          quantity,
          totalPrice: event.price * quantity,
          status: TransactionStatus.waiting_for_payment,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        },
      });

      // Update event available seats
      await tx.event.update({
        where: { id: eventId },
        data: {
          availableSeats: event.availableSeats - quantity,
        },
      });

      return transaction;
    } catch (error) {
      // Ensure transaction is rolled back on error
      throw error;
    }
  });
};

export const getTransaction = async (id: number) => {
  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: {
      event: true,
      user: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
        },
      },
    },
  });

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  return transaction;
};

export const updateTransactionStatus = async (
  id: number,
  status: TransactionStatus,
  paymentProof?: string
) => {
  return await prisma.$transaction(async (tx) => {
    try {
      const transaction = await tx.transaction.findUnique({
        where: { id },
        include: { event: true },
      });

      if (!transaction) {
        throw new Error("Transaction not found");
      }

      // If transaction is being cancelled or expired, restore ticket availability
      if (
        status === TransactionStatus.canceled ||
        status === TransactionStatus.expired
      ) {
        await tx.event.update({
          where: { id: transaction.eventId },
          data: {
            availableSeats:
              transaction.event.availableSeats + transaction.quantity,
          },
        });
      }

      return await tx.transaction.update({
        where: { id },
        data: {
          status,
          ...(paymentProof && { paymentProof }),
        },
      });
    } catch (error) {
      // Ensure transaction is rolled back on error
      throw error;
    }
  });
};

export const restoreTicketAvailability = async (
  tx: any,
  transactionId: number
) => {
  const transaction = await tx.transaction.findUnique({
    where: { id: transactionId },
    include: { event: true },
  });

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  await tx.event.update({
    where: { id: transaction.eventId },
    data: {
      availableSeats: transaction.event.availableSeats + transaction.quantity,
    },
  });

  return transaction;
};

export const checkExpiredTransactions = async () => {
  await prisma.$transaction(async (tx) => {
    const expired = await tx.transaction.findMany({
      where: {
        status: "waiting_for_payment",
        expiresAt: { lt: new Date() },
      },
    });

    for (const t of expired) {
      await updateTransactionStatus(t.id, "expired");
    }
  });
};
