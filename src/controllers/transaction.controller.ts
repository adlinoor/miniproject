import { Request, Response } from "express";
import {
  createTransaction,
  getTransaction,
  updateTransactionStatus,
  getUserTransactions,
} from "../services/transaction.service";
import { TransactionStatus } from "@prisma/client";
import { z } from "zod";
import { Transaction } from "@prisma/client";
import prisma from "../lib/prisma";

export const transactionSchema = z.object({
  eventId: z.number().min(1),
  quantity: z.number().min(1),
  voucherCode: z.string().optional(),
  pointsUsed: z.number().min(0).optional(),
  ticketTypeId: z.number().min(1).optional(),
});

export const transactionUpdateSchema = z.object({
  status: z.nativeEnum(TransactionStatus),
  paymentProof: z.string().optional(),
});

export const createEventTransaction = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const validatedData = transactionSchema.parse({
      ...req.body,
      eventId: Number(req.body.eventId),
      quantity: Number(req.body.quantity),
      pointsUsed: req.body.pointsUsed ? Number(req.body.pointsUsed) : undefined,
      ticketTypeId: req.body.ticketTypeId
        ? Number(req.body.ticketTypeId)
        : undefined,
    });

    // Fixed: Pass parameters directly instead of using spread with Object.values()
    const transaction = await createTransaction(
      userId,
      validatedData.eventId,
      validatedData.quantity,
      validatedData.voucherCode,
      validatedData.pointsUsed,
      validatedData.ticketTypeId
    );

    res.status(201).json(transaction);
  } catch (error: any) {
    handleTransactionError(res, error);
  }
};

export const getTransactionDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const transaction = await getTransaction(parseInt(id, 10));
    res.json(transaction);
  } catch (error: any) {
    handleTransactionError(res, error);
  }
};

export const updateTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = transactionUpdateSchema.parse(req.body);

    const transaction = await updateTransactionStatus(
      parseInt(id, 10),
      validatedData.status,
      validatedData.paymentProof
    );

    res.json(transaction);
  } catch (error: any) {
    handleTransactionError(res, error);
  }
};

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

// Reusable error handler
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
        paymentProof: file.path,
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
