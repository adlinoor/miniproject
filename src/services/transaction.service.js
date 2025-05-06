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
exports.checkExpiredTransactions = exports.restoreTicketAvailability = exports.updateTransactionStatus = exports.getTransaction = exports.createTransaction = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const client_1 = require("@prisma/client");
const createTransaction = (userId, eventId, quantity) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Check if event exists and has enough seats
            const event = yield tx.event.findUnique({
                where: { id: eventId },
            });
            if (!event) {
                throw new Error("Event not found");
            }
            if (event.availableSeats < quantity) {
                throw new Error("Not enough available seats for this event");
            }
            // Create transaction
            const transaction = yield tx.transaction.create({
                data: {
                    userId,
                    eventId,
                    quantity,
                    totalPrice: event.price * quantity,
                    status: client_1.TransactionStatus.waiting_for_payment,
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
                },
            });
            // Update event available seats
            yield tx.event.update({
                where: { id: eventId },
                data: {
                    availableSeats: event.availableSeats - quantity,
                },
            });
            return transaction;
        }
        catch (error) {
            // Ensure transaction is rolled back on error
            throw error;
        }
    }));
});
exports.createTransaction = createTransaction;
const getTransaction = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const transaction = yield prisma_1.default.transaction.findUnique({
        where: { id },
        include: {
            event: true,
            user: {
                select: {
                    id: true,
                    first_name: true,
                    last_name: true,
                    email: true,
                },
            },
        },
    });
    if (!transaction) {
        throw new Error("Transaction not found");
    }
    return transaction;
});
exports.getTransaction = getTransaction;
const updateTransactionStatus = (id, status, paymentProof) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const transaction = yield tx.transaction.findUnique({
                where: { id },
                include: { event: true },
            });
            if (!transaction) {
                throw new Error("Transaction not found");
            }
            // If transaction is being cancelled or expired, restore ticket availability
            if (status === client_1.TransactionStatus.canceled ||
                status === client_1.TransactionStatus.expired) {
                yield tx.event.update({
                    where: { id: transaction.eventId },
                    data: {
                        availableSeats: transaction.event.availableSeats + transaction.quantity,
                    },
                });
            }
            return yield tx.transaction.update({
                where: { id },
                data: Object.assign({ status }, (paymentProof && { paymentProof })),
            });
        }
        catch (error) {
            // Ensure transaction is rolled back on error
            throw error;
        }
    }));
});
exports.updateTransactionStatus = updateTransactionStatus;
const restoreTicketAvailability = (tx, transactionId) => __awaiter(void 0, void 0, void 0, function* () {
    const transaction = yield tx.transaction.findUnique({
        where: { id: transactionId },
        include: { event: true },
    });
    if (!transaction) {
        throw new Error("Transaction not found");
    }
    yield tx.event.update({
        where: { id: transaction.eventId },
        data: {
            availableSeats: transaction.event.availableSeats + transaction.quantity,
        },
    });
    return transaction;
});
exports.restoreTicketAvailability = restoreTicketAvailability;
const checkExpiredTransactions = () => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const expired = yield tx.transaction.findMany({
            where: {
                status: "waiting_for_payment",
                expiresAt: { lt: new Date() },
            },
        });
        for (const t of expired) {
            yield (0, exports.updateTransactionStatus)(t.id, "expired");
        }
    }));
});
exports.checkExpiredTransactions = checkExpiredTransactions;
