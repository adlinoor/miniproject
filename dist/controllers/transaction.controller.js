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
exports.getOrganizerTransactions = exports.getMyEvents = exports.checkUserJoined = exports.uploadPaymentProof = exports.updateTransaction = exports.getTransactionDetails = exports.createEventTransaction = exports.getUserTransactionHistory = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const client_1 = require("@prisma/client");
const transaction_service_1 = require("../services/transaction.service");
const zod_1 = require("zod");
// GET user transaction history (include isReviewed)
const getUserTransactionHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        const transactions = yield prisma_1.default.transaction.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            include: {
                event: {
                    select: {
                        id: true,
                        title: true,
                        location: true,
                        reviews: { where: { userId }, select: { id: true } },
                    },
                },
            },
        });
        const response = transactions.map((tx) => ({
            id: tx.id,
            event: {
                id: tx.event.id,
                name: tx.event.title,
                location: tx.event.location,
            },
            totalPaid: tx.totalPrice,
            status: tx.status,
            createdAt: tx.createdAt,
            isReviewed: tx.event.reviews.length > 0,
        }));
        return res.json({ data: response });
    }
    catch (error) {
        console.error("❌ Error getUserTransactionHistory:", error);
        return res.status(500).json({ message: "Server error" });
    }
});
exports.getUserTransactionHistory = getUserTransactionHistory;
// CREATE
const createEventTransaction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        const eventId = parseInt(req.body.eventId);
        const quantity = parseInt(req.body.quantity);
        const pointsUsed = req.body.pointsUsed
            ? parseInt(req.body.pointsUsed)
            : undefined;
        const voucherCode = req.body.voucherCode || undefined;
        const ticketTypeId = req.body.ticketTypeId
            ? parseInt(req.body.ticketTypeId)
            : undefined;
        const paymentProof = req.body.imageUrl || undefined;
        if (!eventId || isNaN(quantity) || quantity < 1) {
            return res.status(422).json({ message: "eventId or quantity invalid" });
        }
        const transaction = yield (0, transaction_service_1.createTransaction)(userId, eventId, quantity, voucherCode, pointsUsed, ticketTypeId, paymentProof);
        return res.status(201).json(transaction);
    }
    catch (error) {
        console.error("❌ Unexpected error:", error.message || error);
        return res.status(500).json({ message: "Server error" });
    }
});
exports.createEventTransaction = createEventTransaction;
// GET ONE
const getTransactionDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { id } = req.params;
        if (!id || isNaN(Number(id))) {
            return res.status(400).json({ message: "Invalid transaction id" });
        }
        const transactionId = Number(id);
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const userRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
        const transaction = yield (0, transaction_service_1.getTransaction)(transactionId);
        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }
        if (userRole === client_1.Role.CUSTOMER && transaction.userId !== userId) {
            return res
                .status(403)
                .json({ message: "Forbidden: Not your transaction" });
        }
        return res.json(transaction);
    }
    catch (error) {
        return handleTransactionError(res, error);
    }
});
exports.getTransactionDetails = getTransactionDetails;
// UPDATE
const updateTransaction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { status, paymentProof } = req.body;
        const transaction = yield prisma_1.default.transaction.findUnique({
            where: { id: Number(id) },
        });
        if (!transaction)
            return res.status(404).json({ message: "Transaction not found" });
        const updated = yield prisma_1.default.transaction.update({
            where: { id: Number(id) },
            data: { status, paymentProof },
        });
        return res.json({
            message: "Transaction updated successfully",
            transaction: updated,
        });
    }
    catch (error) {
        console.error("Update transaction error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
exports.updateTransaction = updateTransaction;
// UPLOAD PAYMENT PROOF
const uploadPaymentProof = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transactionId = parseInt(req.params.id, 10);
        const file = req.file;
        if (!file)
            return res
                .status(400)
                .json({ message: "Payment proof file is required" });
        const transaction = yield prisma_1.default.transaction.findUnique({
            where: { id: transactionId },
        });
        if (!transaction)
            return res.status(404).json({ message: "Transaction not found" });
        if (transaction.status !== "WAITING_FOR_PAYMENT") {
            return res.status(400).json({
                message: "Only transactions waiting for payment can upload proof",
            });
        }
        const updated = yield prisma_1.default.transaction.update({
            where: { id: transactionId },
            data: {
                paymentProof: req.body.imageUrl,
                status: "WAITING_FOR_ADMIN_CONFIRMATION",
            },
        });
        return res
            .status(200)
            .json({ message: "Payment proof uploaded", transaction: updated });
    }
    catch (error) {
        console.error("Upload payment proof error:", error);
        return res
            .status(500)
            .json({ message: "Server error", error: error.message });
    }
});
exports.uploadPaymentProof = uploadPaymentProof;
// CEK JOIN EVENT
const checkUserJoined = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const eventId = Number(req.query.eventId);
    const existing = yield prisma_1.default.transaction.findFirst({
        where: { userId, eventId },
    });
    return res.json({ joined: !!existing });
});
exports.checkUserJoined = checkUserJoined;
// GET MY EVENTS
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
// ORGANIZER - GET ALL TRANSACTIONS
const getOrganizerTransactions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const organizerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!organizerId)
            return res.status(401).json({ message: "Unauthorized" });
        // Ambil SEMUA transaksi dari event yang dimiliki ORGANIZER
        const transactions = yield prisma_1.default.transaction.findMany({
            where: {
                event: { organizerId },
            },
            include: {
                user: true,
                event: true,
                details: { include: { ticket: true } },
            },
            orderBy: { createdAt: "desc" },
        });
        return res.json({ data: transactions });
    }
    catch (error) {
        console.error("Error fetching organizer transactions:", error);
        return res.status(500).json({ message: "Server error" });
    }
});
exports.getOrganizerTransactions = getOrganizerTransactions;
// ERROR HANDLER
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
