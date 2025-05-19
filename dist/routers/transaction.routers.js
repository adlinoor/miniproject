"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const transaction_controller_1 = require("../controllers/transaction.controller");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// CUSTOMER: Buat transaksi event
router.post("/", auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)(client_1.Role.CUSTOMER), transaction_controller_1.createEventTransaction);
// CUSTOMER: Cek detail transaksi (atau milik sendiri)
router.get("/:id", auth_middleware_1.authenticate, transaction_controller_1.getTransactionDetails);
// CUSTOMER: Cek apakah sudah join event tertentu
router.get("/transactions/check", auth_middleware_1.authenticate, transaction_controller_1.checkUserJoined);
// CUSTOMER: Lihat event yang diikuti
router.get("/myevents", auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)(client_1.Role.CUSTOMER), transaction_controller_1.getMyEvents);
// ORGANIZER: Lihat transaksi event yang mereka buat
router.get("/organizer", auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)(client_1.Role.ORGANIZER), transaction_controller_1.getOrganizerTransactions);
// ORGANIZER: Update status transaksi (approve/reject)
router.put("/:id/status", auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)(client_1.Role.ORGANIZER), transaction_controller_1.updateTransaction);
// Tambahan umum: Update data transaksi (versi feature 1)
router.put("/:id", auth_middleware_1.authenticate, transaction_controller_1.updateTransaction);
exports.default = router;
