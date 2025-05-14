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
exports.getUserRewardSummary = exports.updateUser = exports.getUserById = void 0;
const prisma_1 = require("../lib/prisma");
// ✅ Ambil user berdasarkan ID
const getUserById = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_1.prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            profilePicture: true,
            role: true,
            userPoints: true,
            createdAt: true,
        },
    });
});
exports.getUserById = getUserById;
// ✅ Update user dengan validasi & upload gambar jika ada
const updateUser = (userId, data) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_1.prisma.user.update({
        where: { id: userId },
        data,
        select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            profilePicture: true,
            role: true,
            userPoints: true,
            updatedAt: true,
        },
    });
});
exports.updateUser = updateUser;
const getUserRewardSummary = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const now = new Date();
    const [activePoints, coupons] = yield Promise.all([
        prisma_1.prisma.point.findMany({
            where: {
                userId,
                expiresAt: { gt: now },
            },
            select: {
                amount: true,
                expiresAt: true,
                createdAt: true,
            },
        }),
        prisma_1.prisma.coupon.findMany({
            where: { userId },
            select: {
                code: true,
                discount: true,
                expiresAt: true,
                isUsed: true,
                createdAt: true,
            },
        }),
    ]);
    return {
        totalActivePoints: activePoints.reduce((sum, p) => sum + p.amount, 0),
        pointHistory: activePoints,
        coupons: {
            active: coupons.filter((c) => !c.isUsed && c.expiresAt > now),
            used: coupons.filter((c) => c.isUsed),
            expired: coupons.filter((c) => !c.isUsed && c.expiresAt <= now),
        },
    };
});
exports.getUserRewardSummary = getUserRewardSummary;
