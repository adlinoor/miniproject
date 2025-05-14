import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  checkUserJoined,
  createEventTransaction,
  getMyEvents,
  getOrganizerTransactions,
  getTransactionDetails,
  updateTransaction,
} from "../controllers/transaction.controller";
import { authorizeRoles } from "../middleware/auth.middleware";
import { Role } from "@prisma/client";

const router = Router();

// Routes for transactions
router.post(
  "/",
  authenticate,
  authorizeRoles("CUSTOMER"),
  createEventTransaction
);
router.get("/:id", authenticate, getTransactionDetails);
router.get("/transactions/check", authenticate, checkUserJoined);
router.get(
  "/myevents",
  authenticate,
  authorizeRoles(Role.CUSTOMER),
  getMyEvents
);

router.get(
  "/organizer",
  authenticate,
  authorizeRoles(Role.ORGANIZER),
  getOrganizerTransactions
);

router.put(
  "/:id/status",
  authenticate,
  authorizeRoles(Role.ORGANIZER),
  updateTransaction
);

router.put("/:id", authenticate, updateTransaction);

export default router;
