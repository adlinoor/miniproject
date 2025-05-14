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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrganizerTransactions = exports.getMyEvents = exports.checkUserJoined = exports.getUserTransactionHistory = exports.updateTransaction = exports.getTransactionDetails = exports.createEventTransaction = exports.transactionUpdateSchema = exports.transactionSchema = void 0;
const transaction_service_1 = require("../services/transaction.service");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
exports.transactionSchema = zod_1.z.object({
    eventId: zod_1.z.number().min(1),
    quantity: zod_1.z.number().min(1),
    voucherCode: zod_1.z.string().optional(),
    pointsUsed: zod_1.z.number().min(0).optional(),
    ticketTypeId: zod_1.z.number().min(1).optional(),
});
exports.transactionUpdateSchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(client_1.TransactionStatus),
    paymentProof: zod_1.z.string().optional(),
});
const createEventTransaction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const validatedData = exports.transactionSchema.parse(Object.assign(Object.assign({}, req.body), { eventId: Number(req.body.eventId), quantity: Number(req.body.quantity), pointsUsed: req.body.pointsUsed ? Number(req.body.pointsUsed) : undefined, ticketTypeId: req.body.ticketTypeId
                ? Number(req.body.ticketTypeId)
                : undefined }));
        // Fixed: Pass parameters directly instead of using spread with Object.values()
        const transaction = yield (0, transaction_service_1.createTransaction)(userId, validatedData.eventId, validatedData.quantity, validatedData.voucherCode, validatedData.pointsUsed, validatedData.ticketTypeId);
        res.status(201).json(transaction);
    }
    catch (error) {
        handleTransactionError(res, error);
    }
});
exports.createEventTransaction = createEventTransaction;
const getTransactionDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const transaction = yield (0, transaction_service_1.getTransaction)(parseInt(id, 10));
        res.json(transaction);
    }
    catch (error) {
        handleTransactionError(res, error);
    }
});
exports.getTransactionDetails = getTransactionDetails;
const updateTransaction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { status, paymentProof } = req.body;
        const transaction = yield prisma_1.prisma.transaction.findUnique({
            where: { id: Number(id) },
        });
        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }
        const updated = yield prisma_1.prisma.transaction.update({
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
const getUserTransactionHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId)
            return res.status(401).json({ error: "Unauthorized" });
        const transactions = yield (0, transaction_service_1.getUserTransactions)(userId);
        res.json(transactions);
    }
    catch (error) {
        handleTransactionError(res, error);
    }
});
exports.getUserTransactionHistory = getUserTransactionHistory;
// Reusable error handler
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
const checkUserJoined = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const eventId = Number(req.query.eventId);
    const existing = yield prisma_1.prisma.transaction.findFirst({
        where: { userId, eventId },
    });
    res.json({ joined: !!existing });
});
exports.checkUserJoined = checkUserJoined;
const getMyEvents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const transactions = yield prisma_1.prisma.transaction.findMany({
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
const getOrganizerTransactions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const organizerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!organizerId)
            return res.status(401).json({ message: "Unauthorized" });
        const transactions = yield prisma_1.prisma.transaction.findMany({
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
