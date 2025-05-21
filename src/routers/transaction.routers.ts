import { Router } from "express";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware";
import { Role } from "@prisma/client";
import upload from "../middleware/upload";
import { uploadImageAndAttachUrl } from "../middleware/uploadImageAndAttachUrl";
import {
  checkUserJoined,
  createEventTransaction,
  getMyEvents,
  getOrganizerTransactions,
  getTransactionDetails,
  updateTransaction,
  uploadPaymentProof,
} from "../controllers/transaction.controller";

const router = Router();

//
// =======================
//  CUSTOMER ROUTES
// =======================
//

// Buat transaksi baru (checkout event)
router.post(
  "/",
  authenticate,
  authorizeRoles(Role.CUSTOMER),
  createEventTransaction
);

// Lihat detail transaksi (milik sendiri)
router.get("/:id", authenticate, getTransactionDetails);

// Cek apakah user sudah join event tertentu
router.get("/check", authenticate, checkUserJoined);

// Lihat event yang sudah diikuti
router.get(
  "/myevents",
  authenticate,
  authorizeRoles(Role.CUSTOMER),
  getMyEvents
);

// Upload bukti pembayaran ke Cloudinary
router.patch(
  "/:id/payment-proof",
  authenticate,
  authorizeRoles(Role.CUSTOMER),
  upload.single("paymentProof"),
  uploadImageAndAttachUrl,
  uploadPaymentProof
);

//
// =======================
//  ORGANIZER ROUTES
// =======================
//

// Lihat semua transaksi dari event yang dibuat
router.get(
  "/organizer",
  authenticate,
  authorizeRoles(Role.ORGANIZER),
  getOrganizerTransactions
);

// Ubah status transaksi (approve/reject)
router.put(
  "/:id/status",
  authenticate,
  authorizeRoles(Role.ORGANIZER),
  updateTransaction
);

//
// =======================
//  GENERAL / SHARED
// =======================
//

// Update transaksi secara umum (fallback legacy / manual)
router.put("/:id", authenticate, updateTransaction);

export default router;
