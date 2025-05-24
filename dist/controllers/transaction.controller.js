"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadPaymentProof = exports.getOrganizerTransactions = exports.getMyEvents = exports.checkUserJoined = exports.getUserTransactionHistory = exports.updateTransaction = exports.getTransactionDetails = exports.createEventTransaction = exports.transactionUpdateSchema = exports.transactionSchema = void 0;
const transaction_service_1 = require("../services/transaction.service");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../lib/prisma"));
const client_2 = require("@prisma/client");
// Validasi schema transaksi
exports.transactionSchema = zod_1.z.object({
    eventId: zod_1.z.number().min(1),
    quantity: zod_1.z.number().min(1),
    voucherCode: zod_1.z.string().optional(),
    pointsUsed: zod_1.z.number().min(0).optional(),
    ticketTypeId: zod_1.z.number().min(1).optional(),
});
// Validasi update status
exports.transactionUpdateSchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(client_1.TransactionStatus),
    paymentProof: zod_1.z.string().optional(),
});
// Create Transaction
const createEventTransaction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        // ✅ Parse semua dari FormData (string)
        const eventId = parseInt(req.body.eventId);
        const quantity = parseInt(req.body.quantity);
        const pointsUsed = req.body.pointsUsed
            ? parseInt(req.body.pointsUsed)
            : undefined;
        const voucherCode = req.body.voucherCode || undefined;
        const ticketTypeId = req.body.ticketTypeId
            ? parseInt(req.body.ticketTypeId)
            : undefined;
        // ✅ Validasi manual
        if (!eventId || isNaN(quantity) || quantity < 1) {
            return res.status(422).json({ message: "eventId or quantity invalid" });
        }
        // ✅ Log debug lengkap
        console.log("📦 req.body:", req.body);
        console.log("📎 req.file:", req.file);
        // ✅ Tidak perlu pakai Zod parse lagi kalau sudah validasi manual
        const transaction = yield (0, transaction_service_1.createTransaction)(userId, eventId, quantity, voucherCode, pointsUsed, ticketTypeId);
        res.status(201).json(transaction);
    }
    catch (error) {
        console.error("❌ Unexpected error:", error.message || error);
        res.status(500).json({ message: "Server error" });
    }
});
exports.createEventTransaction = createEventTransaction;
// Get Transaction Detail
const getTransactionDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { id } = req.params;
        const transactionId = parseInt(id, 10);
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const userRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
        const transaction = yield (0, transaction_service_1.getTransaction)(transactionId);
        // ❗️Validasi kepemilikan (kecuali admin / organizer)
        if (userRole === client_2.Role.CUSTOMER && transaction.userId !== userId) {
            return res
                .status(403)
                .json({ message: "Forbidden: Not your transaction" });
        }
        res.json(transaction);
    }
    catch (error) {
        handleTransactionError(res, error);
    }
});
exports.getTransactionDetails = getTransactionDetails;
// Update Transaction (Status or PaymentProof)
const updateTransaction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { status, paymentProof } = req.body;
        const transaction = yield prisma_1.default.transaction.findUnique({
            where: { id: Number(id) },
        });
        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }
        const updated = yield prisma_1.default.transaction.update({
            where: { id: Number(id) },
            data: {
                status,
                paymentProof,
            },
        });
        res.json({
            message: "Transaction updated successfully",
            transaction: updated,
        });
    }
    catch (error) {
        console.error("Update transaction error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.updateTransaction = updateTransaction;
// Get All Transactions by User
const getUserTransactionHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        // ✅ Tambahkan log di sini
        console.log("🔍 userId:", userId);
        const transactions = yield prisma_1.default.transaction.findMany({
            where: { userId },
            include: {
                event: {
                    select: {
                        title: true,
                        startDate: true,
                        location: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        // ✅ Tambahkan log hasil
        console.log("📦 transactions found:", transactions.length);
        return res.status(200).json({ data: transactions });
    }
    catch (error) {
        console.error("❌ getUserTransactionHistory error:", error);
        return res
            .status(500)
            .json({ message: "Failed to fetch user transactions" });
    }
});
exports.getUserTransactionHistory = getUserTransactionHistory;
// Error Handler
function handleTransactionError(res, error) {
    console.error("Transaction error:", error);
    const statusCode = error.message.includes("not found")
        ? 404
        : error instanceof zod_1.z.ZodError
            ? 422
            : error.message.includes("Unauthorized")
                ? 401
                : 400;
    res.status(statusCode).json(Object.assign({ error: error.message || "Transaction operation failed" }, (error instanceof zod_1.z.ZodError && { details: error.errors })));
}
// Cek apakah user sudah join event
const checkUserJoined = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const eventId = Number(req.query.eventId);
    const existing = yield prisma_1.default.transaction.findFirst({
        where: { userId, eventId },
    });
    res.json({ joined: !!existing });
});
exports.checkUserJoined = checkUserJoined;
// Get My Joined Events
const getMyEvents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const transactions = yield prisma_1.default.transaction.findMany({
            where: { userId },
            include: { event: true },
        });
        const events = transactions.map((t) => t.event);
        return res.json(events);
    }
    catch (err) {
        return res.status(500).json({ message: "Failed to fetch events" });
    }
});
exports.getMyEvents = getMyEvents;
// Organizer melihat semua transaksi event miliknya
const getOrganizerTransactions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const organizerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!organizerId)
            return res.status(401).json({ message: "Unauthorized" });
        const transactions = yield prisma_1.default.transaction.findMany({
            where: {
                event: {
                    organizerId,
                },
            },
            include: {
                user: true,
                event: true,
                details: {
                    include: {
                        ticket: true,
                    },
                },
            },
        });
        res.json(transactions);
    }
    catch (error) {
        console.error("Error fetching organizer transactions:", error);
        res.status(500).json({ message: "Server error" });
    }
});
exports.getOrganizerTransactions = getOrganizerTransactions;
// Upload Payment Proof (khusus event berbayar)
const uploadPaymentProof = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transactionId = parseInt(req.params.id, 10);
        const file = req.file;
        if (!file) {
            return res
                .status(400)
                .json({ message: "Payment proof file is required" });
        }
        const transaction = yield prisma_1.default.transaction.findUnique({
            where: { id: transactionId },
        });
        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }
        if (transaction.status !== "WAITING_FOR_PAYMENT") {
            return res.status(400).json({
                message: "Payment proof can only be uploaded when status is WAITING_FOR_PAYMENT",
            });
        }
        const updatedTransaction = yield prisma_1.default.transaction.update({
            where: { id: transactionId },
            data: {
                paymentProof: req.body.imageUrl,
                status: "WAITING_FOR_ADMIN_CONFIRMATION",
            },
        });
        return res.status(200).json({
            message: "Payment proof uploaded successfully",
            transaction: updatedTransaction,
        });
    }
    catch (error) {
        console.error("Upload payment proof error:", error);
        return res.status(500).json({
            message: "Server error",
            error: error.message,
        });
    }
});
exports.uploadPaymentProof = uploadPaymentProof;
