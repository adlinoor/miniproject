"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
<<<<<<< HEAD
const upload_1 = __importDefault(require("../middleware/upload"));
const transaction_controller_1 = require("../controllers/transaction.controller");
=======
>>>>>>> c45909a3dcef10623f2f7f3fc808e13720d33323
const client_1 = require("@prisma/client");
const upload_1 = __importDefault(require("../middleware/upload"));
const uploadImageAndAttachUrl_1 = require("../middleware/uploadImageAndAttachUrl");
const transaction_controller_1 = require("../controllers/transaction.controller");
const router = (0, express_1.Router)();
<<<<<<< HEAD
// CUSTOMER: Buat transaksi event
router.post("/", auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)(client_1.Role.CUSTOMER), upload_1.default.single("payment_proof"), // Upload bukti pembayaran
transaction_controller_1.createEventTransaction);
// CUSTOMER: Cek detail transaksi (atau milik sendiri)
=======
//
// =======================
//  CUSTOMER ROUTES
// =======================
//
// Buat transaksi baru (checkout event)
router.post("/", auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)(client_1.Role.CUSTOMER), transaction_controller_1.createEventTransaction);
// Lihat detail transaksi (milik sendiri)
>>>>>>> c45909a3dcef10623f2f7f3fc808e13720d33323
router.get("/:id", auth_middleware_1.authenticate, transaction_controller_1.getTransactionDetails);
// Cek apakah user sudah join event tertentu
router.get("/check", auth_middleware_1.authenticate, transaction_controller_1.checkUserJoined);
// Lihat event yang sudah diikuti
router.get("/myevents", auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)(client_1.Role.CUSTOMER), transaction_controller_1.getMyEvents);
// Upload bukti pembayaran ke Cloudinary
router.patch("/:id/payment-proof", auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)(client_1.Role.CUSTOMER), upload_1.default.single("paymentProof"), uploadImageAndAttachUrl_1.uploadImageAndAttachUrl, transaction_controller_1.uploadPaymentProof);
//
// =======================
//  ORGANIZER ROUTES
// =======================
//
// Lihat semua transaksi dari event yang dibuat
router.get("/organizer", auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)(client_1.Role.ORGANIZER), transaction_controller_1.getOrganizerTransactions);
// Ubah status transaksi (approve/reject)
router.put("/:id/status", auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)(client_1.Role.ORGANIZER), transaction_controller_1.updateTransaction);
//
// =======================
//  GENERAL / SHARED
// =======================
//
// Update transaksi secara umum (fallback legacy / manual)
router.put("/:id", auth_middleware_1.authenticate, transaction_controller_1.updateTransaction);
exports.default = router;
