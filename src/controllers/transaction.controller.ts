import { Request, Response } from "express";
import {
  createTransaction,
  getTransaction,
  updateTransactionStatus,
} from "../services/transaction.service";
import { TransactionStatus } from "@prisma/client";

export const createEventTransaction = async (req: Request, res: Response) => {
  try {
    const { eventId, quantity } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const transaction = await createTransaction(userId, eventId, quantity);
    res.status(201).json(transaction);
  } catch (error: any) {
    console.error("Error creating transaction:", error);
    res.status(error.message.includes("not found") ? 404 : 400).json({
      message: error.message || "Error creating transaction",
    });
  }
};

export const getTransactionDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const transaction = await getTransaction(parseInt(id, 10));
    res.json(transaction);
  } catch (error: any) {
    console.error("Error getting transaction:", error);
    res.status(error.message.includes("not found") ? 404 : 500).json({
      message: error.message || "Error getting transaction details",
    });
  }
};

export const updateTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, paymentProof } = req.body;

    const transaction = await updateTransactionStatus(
      parseInt(id, 10),
      status as TransactionStatus,
      paymentProof
    );

    res.json(transaction);
  } catch (error: any) {
    console.error("Error updating transaction:", error);
    res.status(error.message.includes("not found") ? 404 : 500).json({
      message: error.message || "Error updating transaction",
    });
  }
};
