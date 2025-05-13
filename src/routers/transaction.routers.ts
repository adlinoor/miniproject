import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  createEventTransaction,
  getTransactionDetails,
  updateTransaction,
} from "../controllers/transaction.controller";
import { authorizeRoles } from "../middleware/auth.middleware";

const router = Router();

// Routes for transactions
router.post(
  "/",
  authenticate,
  authorizeRoles("CUSTOMER"),
  createEventTransaction
);
router.get("/:id", authenticate, getTransactionDetails);
router.put("/:id", authenticate, updateTransaction);

export default router;
