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
exports.expirePoints = exports.usePoints = exports.addPoints = exports.getUserPointsBalance = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const client_1 = require("@prisma/client");
/**
 * Get the total points balance for a user.
 * @param userId - The ID of the user.
 * @returns The total points balance.
 */
const getUserPointsBalance = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const result = yield prisma_1.default.point.aggregate({
        where: {
            userId,
            expiresAt: { gt: new Date() }, // Only include unexpired points
        },
        _sum: {
            amount: true,
        },
    });
    return ((_a = result._sum) === null || _a === void 0 ? void 0 : _a.amount) || 0;
});
exports.getUserPointsBalance = getUserPointsBalance;
/**
 * Add points to a user's account.
 * @param userId - The ID of the user.
 * @param amount - The amount of points to add.
 * @param expiresInMonths - The number of months until the points expire (default: 3 months).
 * @returns The created Point record.
 */
const addPoints = (userId_1, amount_1, ...args_1) => __awaiter(void 0, [userId_1, amount_1, ...args_1], void 0, function* (userId, amount, expiresInMonths = 3) {
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + expiresInMonths);
    return yield prisma_1.default.point.create({
        data: {
            userId,
            amount,
            expiresAt,
        },
    });
});
exports.addPoints = addPoints;
/**
 * Use points for a transaction.
 * @param userId - The ID of the user.
 * @param amount - The amount of points to use.
 * @returns A boolean indicating whether the operation was successful.
 */
const usePoints = (userId, amount) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        // Get the total available points for the user
        const availablePoints = yield tx.point.aggregate({
            where: {
                userId,
                expiresAt: { gt: new Date() }, // Only include unexpired points
            },
            _sum: {
                amount: true,
            },
        });
        const totalAvailable = ((_a = availablePoints._sum) === null || _a === void 0 ? void 0 : _a.amount) || 0;
        if (totalAvailable < amount) {
            throw new Error("Insufficient points balance");
        }
        // Get points ordered by expiration (use oldest points first)
        const pointsToUse = yield tx.point.findMany({
            where: {
                userId,
                expiresAt: { gt: new Date() },
                amount: { gt: 0 },
            },
            orderBy: {
                expiresAt: "asc",
            },
        });
        let remaining = amount;
        for (const point of pointsToUse) {
            if (remaining <= 0)
                break;
            const useAmount = Math.min(remaining, point.amount);
            remaining -= useAmount;
            // Deduct the used points from the current point record
            yield tx.point.update({
                where: { id: point.id },
                data: { amount: point.amount - useAmount },
            });
            // Create a record of points usage in the Transaction table
            yield tx.transaction.create({
                data: {
                    userId,
                    eventId: point.id,
                    totalPrice: useAmount,
                    quantity: 1,
                    status: client_1.TransactionStatus.done,
                    expiresAt: point.expiresAt,
                },
            });
        }
        return true;
    }));
});
exports.usePoints = usePoints;
/**
 * Expire points that have passed their expiration date.
 */
const expirePoints = () => __awaiter(void 0, void 0, void 0, function* () {
    const now = new Date();
    yield prisma_1.default.point.deleteMany({
        where: {
            expiresAt: { lte: now }, // Points that have expired
            amount: { gt: 0 }, // Only points with a positive balance
        },
    });
});
exports.expirePoints = expirePoints;
