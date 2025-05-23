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
exports.getUserTransactions = exports.checkTransactionExpirations = exports.updateTransactionStatus = exports.getTransaction = exports.createTransaction = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const client_1 = require("@prisma/client");
const email_service_1 = require("./email.service");
const PAYMENT_WINDOW_HOURS = 2;
const POINT_EXPIRY_MONTHS = 3;
const createTransaction = (userId, eventId, quantity, voucherCode, pointsUsed, ticketTypeId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        // 1. Validate event and user
        const [event, user] = yield Promise.all([
            tx.event.findUnique({
                where: { id: eventId },
                include: { tickets: true },
            }),
            tx.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    userPoints: true,
                },
            }),
        ]);
        if (!event)
            throw new Error("Event not found");
        if (!user)
            throw new Error("User not found");
        if (event.availableSeats < quantity) {
            throw new Error("Not enough available seats for this event");
        }
        // 2. Handle ticket type if specified
        let ticketPrice = event.price;
        if (ticketTypeId) {
            const ticket = event.tickets.find((t) => t.id === ticketTypeId);
            if (!ticket)
                throw new Error("Invalid ticket type");
            if (ticket.quantity < quantity) {
                throw new Error("Not enough tickets available");
            }
            ticketPrice = ticket.price;
        }
        // 3. Calculate price with discounts
        let totalPrice = ticketPrice * quantity;
        let appliedVoucherId = null;
        if (voucherCode) {
            const voucher = yield tx.promotion.findUnique({
                where: { code: voucherCode, eventId },
            });
            if (!voucher ||
                voucher.endDate < new Date() ||
                (voucher.maxUses !== null && voucher.uses >= voucher.maxUses)) {
                throw new Error("Invalid or expired voucher");
            }
            totalPrice = Math.max(0, totalPrice - voucher.discount);
            appliedVoucherId = voucher.id;
        }
        if (typeof pointsUsed === "number" && pointsUsed > 0) {
            if (pointsUsed > user.userPoints) {
                throw new Error("Not enough points");
            }
            totalPrice = Math.max(0, totalPrice - pointsUsed);
        }
        // 4. Create transaction
        const isFree = totalPrice === 0;
        const transaction = yield tx.transaction.create({
            data: {
                userId,
                eventId,
                quantity,
                totalPrice,
                status: isFree
                    ? client_1.TransactionStatus.DONE
                    : client_1.TransactionStatus.WAITING_FOR_PAYMENT,
                expiresAt: isFree
                    ? null
                    : new Date(Date.now() + PAYMENT_WINDOW_HOURS * 60 * 60 * 1000),
                voucherCode,
                pointsUsed: pointsUsed || 0,
                details: ticketTypeId
                    ? {
                        create: [
                            {
                                ticketId: ticketTypeId,
                                quantity,
                            },
                        ],
                    }
                    : undefined,
            },
            include: { event: true, user: true, details: true },
        });
        // 5. Update inventory
        const updateOperations = [];
        updateOperations.push(tx.event.update({
            where: { id: eventId },
            data: { availableSeats: { decrement: quantity } },
        }));
        if (ticketTypeId) {
            updateOperations.push(tx.ticket.update({
                where: { id: ticketTypeId },
                data: { quantity: { decrement: quantity } },
            }));
        }
        if (typeof pointsUsed === "number" && pointsUsed > 0) {
            updateOperations.push(tx.user.update({
                where: { id: userId },
                data: { userPoints: { decrement: pointsUsed } },
            }));
        }
        if (appliedVoucherId) {
            updateOperations.push(tx.promotion.update({
                where: { id: appliedVoucherId },
                data: { uses: { increment: 1 } },
            }));
        }
        yield Promise.all(updateOperations);
        return Object.assign(Object.assign({}, transaction), { paymentWindow: PAYMENT_WINDOW_HOURS, nextSteps: "Please complete payment within 2 hours" });
    }));
});
exports.createTransaction = createTransaction;
const getTransaction = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const transaction = yield prisma_1.default.transaction.findUnique({
        where: { id },
        include: {
            event: true,
            user: { select: { email: true, first_name: true, last_name: true } },
            details: { include: { ticket: true } },
        },
    });
    if (!transaction)
        throw new Error("Transaction not found");
    return transaction;
});
exports.getTransaction = getTransaction;
const updateTransactionStatus = (id, status, paymentProof) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const transaction = yield tx.transaction.findUnique({
            where: { id },
            include: { event: true, user: true, details: true },
        });
        if (!transaction)
            throw new Error("Transaction not found");
        switch (status) {
            case client_1.TransactionStatus.WAITING_FOR_ADMIN_CONFIRMATION:
                if (!paymentProof)
                    throw new Error("Payment proof required");
                break;
            case client_1.TransactionStatus.REJECTED:
            case client_1.TransactionStatus.EXPIRED:
            case client_1.TransactionStatus.CANCELED:
                yield restoreResources(tx, transaction);
                if (status === client_1.TransactionStatus.REJECTED) {
                    yield (0, email_service_1.sendEmail)(transaction.user.email, "Transaction Rejected", `Your transaction for ${transaction.event.title} was rejected.`);
                }
                break;
        }
        return yield tx.transaction.update({
            where: { id },
            data: Object.assign({ status }, (paymentProof && { paymentProof })),
        });
    }));
});
exports.updateTransactionStatus = updateTransactionStatus;
function restoreResources(tx, transaction) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        yield Promise.all([
            tx.event.update({
                where: { id: transaction.eventId },
                data: { availableSeats: { increment: transaction.quantity } },
            }),
            ...(((_a = transaction.details) === null || _a === void 0 ? void 0 : _a.map((detail) => tx.ticket.update({
                where: { id: detail.ticketId },
                data: { quantity: { increment: detail.quantity } },
            }))) || []),
        ]);
        if (transaction.pointsUsed > 0) {
            yield tx.point.create({
                data: {
                    userId: transaction.userId,
                    amount: transaction.pointsUsed,
                    expiresAt: new Date(new Date().setMonth(new Date().getMonth() + POINT_EXPIRY_MONTHS)),
                },
            });
        }
        // Restore voucher if used
        if (transaction.voucherCode) {
            yield tx.voucher.updateMany({
                where: {
                    code: transaction.voucherCode,
                    eventId: transaction.eventId,
                },
                data: {
                    isUsed: false,
                },
            });
        }
    });
}
const checkTransactionExpirations = () => __awaiter(void 0, void 0, void 0, function* () {
    const now = new Date();
    yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const unpaidExpired = yield tx.transaction.findMany({
            where: {
                status: client_1.TransactionStatus.WAITING_FOR_PAYMENT,
                expiresAt: { lt: now },
            },
        });
        const unresponded = yield tx.transaction.findMany({
            where: {
                status: client_1.TransactionStatus.WAITING_FOR_ADMIN_CONFIRMATION,
                expiresAt: { lt: now },
            },
        });
        yield Promise.all([
            ...unpaidExpired.map((t) => (0, exports.updateTransactionStatus)(t.id, client_1.TransactionStatus.EXPIRED)),
            ...unresponded.map((t) => (0, exports.updateTransactionStatus)(t.id, client_1.TransactionStatus.CANCELED)),
        ]);
    }));
});
exports.checkTransactionExpirations = checkTransactionExpirations;
const getUserTransactions = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_1.default.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: {
            event: {
                select: {
                    title: true,
                    startDate: true,
                    location: true,
                },
            },
        },
    });
});
exports.getUserTransactions = getUserTransactions;
