import { Router } from "express";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware";
import upload from "../middleware/upload";
import {
  checkUserJoined,
  createEventTransaction,
  getMyEvents,
  getOrganizerTransactions,
  getTransactionDetails,
  updateTransaction,
} from "../controllers/transaction.controller";
import { Role } from "@prisma/client";

const router = Router();

// CUSTOMER: Buat transaksi event
router.post(
  "/",
  authenticate,
  authorizeRoles(Role.CUSTOMER),
  upload.single("payment_proof"), // Upload bukti pembayaran
  createEventTransaction
);

// CUSTOMER: Cek detail transaksi (atau milik sendiri)
router.get("/:id", authenticate, getTransactionDetails);

// CUSTOMER: Cek apakah sudah join event tertentu
router.get("/transactions/check", authenticate, checkUserJoined);

// CUSTOMER: Lihat event yang diikuti
router.get(
  "/myevents",
  authenticate,
  authorizeRoles(Role.CUSTOMER),
  getMyEvents
);

// ORGANIZER: Lihat transaksi event yang mereka buat
router.get(
  "/organizer",
  authenticate,
  authorizeRoles(Role.ORGANIZER),
  getOrganizerTransactions
);

// ORGANIZER: Update status transaksi (approve/reject)
router.put(
  "/:id/status",
  authenticate,
  authorizeRoles(Role.ORGANIZER),
  updateTransaction
);

// Tambahan umum: Update data transaksi (versi feature 1)
router.put("/:id", authenticate, updateTransaction);

export default router;
