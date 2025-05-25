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
exports.expirePoints = exports.usePoints = exports.getUserPointsBalance = exports.addPoints = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const addPoints = (tx_1, userId_1, amount_1, ...args_1) => __awaiter(void 0, [tx_1, userId_1, amount_1, ...args_1], void 0, function* (tx, userId, amount, expiresInMonths = 3) {
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + expiresInMonths);
    // Buat point record
    const point = yield tx.point.create({
        data: { userId, amount, expiresAt },
    });
    // Update userPoints field di User model (saldo total)
    yield tx.user.update({
        where: { id: userId },
        data: { userPoints: { increment: amount } },
    });
    return point;
});
exports.addPoints = addPoints;
/**
 * Get user's points (ambil dari field userPoints di User).
 */
const getUserPointsBalance = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const user = yield prisma_1.default.user.findUnique({ where: { id: userId } });
    return (_a = user === null || user === void 0 ? void 0 : user.userPoints) !== null && _a !== void 0 ? _a : 0;
});
exports.getUserPointsBalance = getUserPointsBalance;
const usePoints = (userId, amount) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield prisma_1.default.user.findUnique({ where: { id: userId } });
    if (!user || user.userPoints < amount)
        throw new Error("Insufficient points");
    const points = yield prisma_1.default.point.findMany({
        where: { userId, expiresAt: { gt: new Date() }, amount: { gt: 0 } },
        orderBy: { expiresAt: "asc" },
    });
    let remaining = amount;
    for (const point of points) {
        if (remaining <= 0)
            break;
        const useAmount = Math.min(remaining, point.amount);
        remaining -= useAmount;
        yield prisma_1.default.point.update({
            where: { id: point.id },
            data: { amount: point.amount - useAmount },
        });
    }
    yield prisma_1.default.user.update({
        where: { id: userId },
        data: { userPoints: { decrement: amount } },
    });
});
exports.usePoints = usePoints;
const expirePoints = () => __awaiter(void 0, void 0, void 0, function* () {
    const now = new Date();
    const expiredPoints = yield prisma_1.default.point.findMany({
        where: { expiresAt: { lte: now }, amount: { gt: 0 } },
    });
    for (const p of expiredPoints) {
        yield prisma_1.default.user.update({
            where: { id: p.userId },
            data: { userPoints: { decrement: p.amount } },
        });
    }
    yield prisma_1.default.point.deleteMany({
        where: { expiresAt: { lte: now } },
    });
});
exports.expirePoints = expirePoints;
exports.default = { getUserPointsBalance: exports.getUserPointsBalance, addPoints: exports.addPoints, usePoints: exports.usePoints, expirePoints: exports.expirePoints };
