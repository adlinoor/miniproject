import { Request, Response } from "express";
import {
  createTransaction,
  getTransaction,
  getUserTransactions,
} from "../services/transaction.service";
import { TransactionStatus } from "@prisma/client";
import { z } from "zod";
import prisma from "../lib/prisma";

// Validasi schema transaksi
export const transactionSchema = z.object({
  eventId: z.number().min(1),
  quantity: z.number().min(1),
  voucherCode: z.string().optional(),
  pointsUsed: z.number().min(0).optional(),
  ticketTypeId: z.number().min(1).optional(),
});

// Validasi update status
export const transactionUpdateSchema = z.object({
  status: z.nativeEnum(TransactionStatus),
  paymentProof: z.string().optional(),
});

// Create Transaction
export const createEventTransaction = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // ✅ Parse semua dari FormData (string)
    const eventId = parseInt(req.body.eventId);
    const quantity = parseInt(req.body.quantity);
    const pointsUsed = req.body.pointsUsed
      ? parseInt(req.body.pointsUsed)
      : undefined;
    const voucherCode = req.body.voucherCode || undefined;
    const ticketTypeId = req.body.ticketTypeId
      ? parseInt(req.body.ticketTypeId)
      : undefined;

    // ✅ Validasi manual
    if (!eventId || isNaN(quantity) || quantity < 1) {
      return res.status(422).json({ message: "eventId or quantity invalid" });
    }

    // ✅ Log debug lengkap
    console.log("📦 req.body:", req.body);
    console.log("📎 req.file:", req.file);

    // ✅ Tidak perlu pakai Zod parse lagi kalau sudah validasi manual
    const transaction = await createTransaction(
      userId,
      eventId,
      quantity,
      voucherCode,
      pointsUsed,
      ticketTypeId
    );

    res.status(201).json(transaction);
  } catch (error: any) {
    console.error("❌ Unexpected error:", error.message || error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get Transaction Detail
export const getTransactionDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const transaction = await getTransaction(parseInt(id, 10));
    res.json(transaction);
  } catch (error: any) {
    handleTransactionError(res, error);
  }
};

// Update Transaction (Status or PaymentProof)
export const updateTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, paymentProof } = req.body;

    const transaction = await prisma.transaction.findUnique({
      where: { id: Number(id) },
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    const updated = await prisma.transaction.update({
      where: { id: Number(id) },
      data: {
        status,
        paymentProof,
      },
    });

    res.json({
      message: "Transaction updated successfully",
      transaction: updated,
    });
  } catch (error) {
    console.error("Update transaction error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get All Transactions by User
export const getUserTransactionHistory = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const transactions = await getUserTransactions(userId);
    res.json(transactions);
  } catch (error: any) {
    handleTransactionError(res, error);
  }
};

// Error Handler
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

// Cek apakah user sudah join event
export const checkUserJoined = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const eventId = Number(req.query.eventId);

  const existing = await prisma.transaction.findFirst({
    where: { userId, eventId },
  });

  res.json({ joined: !!existing });
};

// Get My Joined Events
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

// Organizer melihat semua transaksi event miliknya
export const getOrganizerTransactions = async (req: Request, res: Response) => {
  try {
    const organizerId = req.user?.id;
    if (!organizerId) return res.status(401).json({ message: "Unauthorized" });

    const transactions = await prisma.transaction.findMany({
      where: {
        event: {
          organizerId,
        },
      },
      include: {
        user: true,
        event: true,
        details: {
          include: {
            ticket: true,
          },
        },
      },
    });

    res.json(transactions);
  } catch (error) {
    console.error("Error fetching organizer transactions:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Upload Payment Proof (khusus event berbayar)
export const uploadPaymentProof = async (req: Request, res: Response) => {
  try {
    const transactionId = parseInt(req.params.id, 10);
    const file = req.file;

    if (!file) {
      return res
        .status(400)
        .json({ message: "Payment proof file is required" });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    if (transaction.status !== "WAITING_FOR_PAYMENT") {
      return res.status(400).json({
        message:
          "Payment proof can only be uploaded when status is WAITING_FOR_PAYMENT",
      });
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        paymentProof: req.body.imageUrl,
        status: "WAITING_FOR_ADMIN_CONFIRMATION",
      },
    });

    return res.status(200).json({
      message: "Payment proof uploaded successfully",
      transaction: updatedTransaction,
    });
  } catch (error: any) {
    console.error("Upload payment proof error:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};
