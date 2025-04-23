import express from "express";
import { upload } from "../app";
import { authenticate } from "../middleware/auth";
import {
  createTransaction,
  uploadPaymentProof,
  createTransactionSchema,
} from "../services/transaction.service";
import { validateRequest } from "../middleware/validateRequest";

const router = express.Router();

router.post(
  "/",
  authenticate,
  validateRequest(createTransactionSchema),
  async (req, res, next) => {
    try {
      const transaction = await createTransaction(req.body, req.user.id);
      res.status(201).json(transaction);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/:id/payment-proof",
  authenticate,
  upload.single("proof"),
  async (req, res, next) => {
    try {
      const transaction = await uploadPaymentProof(
        req.params.id,
        req.user.id,
        req.file!
      );
      res.json(transaction);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
