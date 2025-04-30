import { Request, Response } from "express";
import {
  createTransaction,
  getTransaction,
  updateTransactionStatus,
} from "../services/transaction.service";
import { uploadToCloudinary } from "../services/cloudinary.service";
import { TransactionStatus } from "@prisma/client";

/**
 * Helper function to parse an ID from a string.
 */
const parseId = (id: string): number | null => {
  const parsedId = parseInt(id, 10);
  return isNaN(parsedId) ? null : parsedId;
};

/**
 * Create a new transaction for an event.
 */
export const createEventTransaction = async (req: Request, res: Response) => {
  try {
    const { eventId, quantity, voucherCode, usePoints } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const pointsToUse = usePoints ? parseInt(usePoints, 10) : 0;

    const transaction = await createTransaction(
      parseInt(userId, 10),
      parseInt(eventId, 10),
      parseInt(quantity, 10),
      voucherCode,
      pointsToUse
    );

    res.status(201).json({
      message: "Transaction created successfully",
      transaction,
    });
  } catch (error: any) {
    console.error("Error creating transaction:", error);
    res
      .status(400)
      .json({ message: error.message || "Failed to create transaction" });
  }
};

/**
 * Get details of a specific transaction.
 */
export const getTransactionDetails = async (req: Request, res: Response) => {
  try {
    const transactionId = parseId(req.params.id);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!transactionId) {
      return res.status(400).json({ message: "Invalid transaction ID" });
    }

    const transaction = await getTransaction(
      transactionId,
      parseInt(userId, 10)
    );

    res.status(200).json(transaction);
  } catch (error: any) {
    console.error("Error fetching transaction details:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/**
 * Update the status of a transaction.
 */
export const updateTransaction = async (req: Request, res: Response) => {
  try {
    const transactionId = parseId(req.params.id);
    const { status, rejectionReason } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!transactionId) {
      return res.status(400).json({ message: "Invalid transaction ID" });
    }

    if (!Object.values(TransactionStatus).includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updatedTransaction = await updateTransactionStatus(
      transactionId,
      parseInt(userId, 10),
      status as TransactionStatus,
      rejectionReason
    );

    res.status(200).json({
      message: "Transaction updated successfully",
      transaction: updatedTransaction,
    });
  } catch (error: any) {
    console.error("Error updating transaction:", error);
    res
      .status(400)
      .json({ message: error.message || "Failed to update transaction" });
  }
};

/**
 * Handle the upload of payment proof for a transaction.
 */
export const handlePaymentProof = async (req: Request, res: Response) => {
  try {
    const transactionId = parseId(req.params.id);
    const userId = req.user?.id;
    const paymentProof = req.file;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!transactionId) {
      return res.status(400).json({ message: "Invalid transaction ID" });
    }

    if (!paymentProof) {
      return res.status(400).json({ message: "Payment proof is required" });
    }

    const paymentProofUrl = await uploadToCloudinary(paymentProof);

    const updatedTransaction = await updateTransactionStatus(
      transactionId,
      parseInt(userId, 10),
      TransactionStatus.waiting_for_admin_confirmation,
      undefined,
      paymentProofUrl
    );

    res.status(200).json({
      message: "Payment proof uploaded successfully",
      transaction: updatedTransaction,
    });
  } catch (error: any) {
    console.error("Error uploading payment proof:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};
