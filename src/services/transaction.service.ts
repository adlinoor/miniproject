import prisma from "../lib/prisma";
import { TransactionStatus } from "@prisma/client";

/**
 * Create a new transaction for an event.
 */
export const createTransaction = async (
  userId: number,
  eventId: number,
  quantity: number,
  voucherCode?: string,
  pointsToUse?: number
) => {
  return await prisma.$transaction(async (tx) => {
    // Validate event existence and availability
    const event = await tx.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error("Event not found");
    }

    if (event.availableSeats < quantity) {
      throw new Error("Not enough available seats for this event");
    }

    // Deduct available seats
    await tx.event.update({
      where: { id: eventId },
      data: {
        availableSeats: event.availableSeats - quantity,
      },
    });

    // Calculate total price
    const totalPrice = event.price * quantity;

    // Create the transaction
    const transaction = await tx.transaction.create({
      data: {
        userId,
        eventId,
        quantity,
        totalPrice,
        voucherCode,
        pointsUsed: pointsToUse || 0,
        status: TransactionStatus.waiting_for_payment,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
      },
    });

    return transaction;
  });
};

/**
 * Get details of a specific transaction.
 */
export const getTransaction = async (transactionId: number, userId: number) => {
  const transaction = await prisma.transaction.findFirst({
    where: {
      id: transactionId,
      userId,
    },
    include: {
      event: true,
      user: true,
    },
  });

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  return transaction;
};

/**
 * Update the status of a transaction.
 */
export const updateTransactionStatus = async (
  transactionId: number,
  userId: number,
  status: TransactionStatus,
  rejectionReason?: string,
  paymentProofUrl?: string
) => {
  // Validate transaction existence
  const transaction = await prisma.transaction.findFirst({
    where: {
      id: transactionId,
      userId,
    },
  });

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  // Update the transaction status
  const updatedTransaction = await prisma.transaction.update({
    where: {
      id: transactionId,
    },
    data: {
      status,
      paymentProof: paymentProofUrl,
    },
  });

  return updatedTransaction;
};
