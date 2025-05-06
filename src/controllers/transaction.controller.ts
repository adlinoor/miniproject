import { Request, Response } from "express";
import {
  createTransaction,
  getTransaction,
  updateTransactionStatus,
  getUserTransactions,
} from "../services/transaction.service";
import { TransactionStatus } from "@prisma/client";
import { z } from "zod";

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
