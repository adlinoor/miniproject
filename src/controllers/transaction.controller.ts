import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { TransactionStatus, Role } from "@prisma/client";
import {
  createTransaction,
  getTransaction,
} from "../services/transaction.service";
import { z } from "zod";

// GET user transaction history (include isReviewed)
export const getUserTransactionHistory = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            location: true,
            reviews: { where: { userId }, select: { id: true } },
          },
        },
      },
    });

    const response = transactions.map((tx) => ({
      id: tx.id,
      event: {
        id: tx.event.id,
        name: tx.event.title,
        location: tx.event.location,
      },
      totalPaid: tx.totalPrice,
      status: tx.status,
      createdAt: tx.createdAt,
      isReviewed: tx.event.reviews.length > 0,
    }));

    return res.json({ data: response });
  } catch (error) {
    console.error("❌ Error getUserTransactionHistory:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// CREATE
export const createEventTransaction = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const eventId = parseInt(req.body.eventId);
    const quantity = parseInt(req.body.quantity);
    const pointsUsed = req.body.pointsUsed
      ? parseInt(req.body.pointsUsed)
      : undefined;
    const voucherCode = req.body.voucherCode || undefined;
    const ticketTypeId = req.body.ticketTypeId
      ? parseInt(req.body.ticketTypeId)
      : undefined;
    const paymentProof = req.body.imageUrl || undefined;

    if (!eventId || isNaN(quantity) || quantity < 1) {
      return res.status(422).json({ message: "eventId or quantity invalid" });
    }

    const transaction = await createTransaction(
      userId,
      eventId,
      quantity,
      voucherCode,
      pointsUsed,
      ticketTypeId,
      paymentProof
    );

    return res.status(201).json(transaction);
  } catch (error: any) {
    console.error("❌ Unexpected error:", error.message || error);
    return res.status(500).json({ message: "Server error" });
  }
};

// GET ONE
export const getTransactionDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ message: "Invalid transaction id" });
    }
    const transactionId = Number(id);
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const transaction = await getTransaction(transactionId);

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    if (userRole === Role.CUSTOMER && transaction.userId !== userId) {
      return res
        .status(403)
        .json({ message: "Forbidden: Not your transaction" });
    }

    return res.json(transaction);
  } catch (error: any) {
    return handleTransactionError(res, error);
  }
};

// UPDATE
export const updateTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, paymentProof } = req.body;

    const transaction = await prisma.transaction.findUnique({
      where: { id: Number(id) },
    });
    if (!transaction)
      return res.status(404).json({ message: "Transaction not found" });

    const updated = await prisma.transaction.update({
      where: { id: Number(id) },
      data: { status, paymentProof },
    });

    return res.json({
      message: "Transaction updated successfully",
      transaction: updated,
    });
  } catch (error) {
    console.error("Update transaction error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// UPLOAD PAYMENT PROOF
export const uploadPaymentProof = async (req: Request, res: Response) => {
  try {
    const transactionId = parseInt(req.params.id, 10);
    const file = req.file;

    if (!file)
      return res
        .status(400)
        .json({ message: "Payment proof file is required" });

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });
    if (!transaction)
      return res.status(404).json({ message: "Transaction not found" });

    if (transaction.status !== "WAITING_FOR_PAYMENT") {
      return res.status(400).json({
        message: "Only transactions waiting for payment can upload proof",
      });
    }

    const updated = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        paymentProof: req.body.imageUrl,
        status: "WAITING_FOR_ADMIN_CONFIRMATION",
      },
    });

    return res
      .status(200)
      .json({ message: "Payment proof uploaded", transaction: updated });
  } catch (error: any) {
    console.error("Upload payment proof error:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// CEK JOIN EVENT
export const checkUserJoined = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const eventId = Number(req.query.eventId);

  const existing = await prisma.transaction.findFirst({
    where: { userId, eventId },
  });

  return res.json({ joined: !!existing });
};

// GET MY EVENTS
export const getMyEvents = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      include: { event: true },
    });

    const events = transactions.map((t) => t.event);

    return res.json(events);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch events" });
  }
};

// ORGANIZER - GET ALL TRANSACTIONS
export const getOrganizerTransactions = async (req: Request, res: Response) => {
  try {
    const organizerId = req.user?.id;
    if (!organizerId) return res.status(401).json({ message: "Unauthorized" });

    // Ambil SEMUA transaksi dari event yang dimiliki ORGANIZER
    const transactions = await prisma.transaction.findMany({
      where: {
        event: { organizerId },
      },
      include: {
        user: true,
        event: true,
        details: { include: { ticket: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ data: transactions });
  } catch (error) {
    console.error("Error fetching organizer transactions:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ERROR HANDLER
function handleTransactionError(res: Response, error: any) {
  console.error("Transaction error:", error);

  const statusCode = error.message.includes("not found")
    ? 404
    : error instanceof z.ZodError
    ? 422
    : error.message.includes("Unauthorized")
    ? 401
    : 400;

  res.status(statusCode).json({
    error: error.message || "Transaction operation failed",
    ...(error instanceof z.ZodError && { details: error.errors }),
  });
}
