import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  createEventTransaction,
  getTransactionDetails,
  updateTransaction,
} from "../controllers/transaction.controller";

const router = Router();

// Routes for transactions
router.post("/", authenticate, createEventTransaction);
router.get("/:id", authenticate, getTransactionDetails);
router.put("/:id", authenticate, updateTransaction);

export default router;
