import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  createEventTransaction,
  getTransactionDetails,
  updateTransaction,
} from "../controllers/transaction.controller";

const router = Router();

// Routes for transactions
router.post("/", authMiddleware, createEventTransaction);
router.get("/:id", authMiddleware, getTransactionDetails);
router.put("/:id", authMiddleware, updateTransaction);

export default router;
