import express from "express";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware";
import {
  createEventTransaction,
  getTransactionDetails,
  updateTransaction,
  handlePaymentProof,
} from "../controllers/transaction.controller";
import { upload } from "../services/cloudinary.service";

const router = express.Router();

// Routes for transactions
router.post("/", authenticate, createEventTransaction); // Accessible by authenticated users
router.get("/:id", authenticate, getTransactionDetails); // Accessible by authenticated users
router.put(
  "/:id",
  authenticate,
  authorizeRoles("organizer"), // Only organizers can update transactions
  updateTransaction
);
router.post(
  "/:id/payment-proof",
  authenticate,
  upload.single("proof"),
  handlePaymentProof
);

export default router;
