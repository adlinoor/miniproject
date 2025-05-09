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
exports.getUserPoints = exports.refundPoints = exports.applyReferral = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const email_service_1 = require("./email.service");
const coupon_utils_1 = require("../utils/coupon.utils");
const applyReferral = (userId, referralCode) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        // Check if user already used a referral
        const user = yield tx.user.findUnique({
            where: { id: userId },
            select: {
                referredBy: true,
                first_name: true,
            },
        });
        if (!user) {
            throw new Error("User not found");
        }
        if (user.referredBy) {
            throw new Error("You already used a referral code");
        }
        // Find referrer
        const referrer = yield tx.user.findUnique({
            where: { referralCode },
            select: {
                id: true,
                email: true,
                first_name: true,
            },
        });
        if (!referrer) {
            throw new Error("Invalid referral code");
        }
        if (referrer.id === userId) {
            throw new Error("Cannot use your own referral code");
        }
        // Update user with referral
        yield tx.user.update({
            where: { id: userId },
            data: { referredBy: referralCode },
        });
        // Create points for referrer
        const points = yield tx.point.create({
            data: {
                userId: referrer.id,
                amount: 10000,
                expiresAt: new Date(new Date().setMonth(new Date().getMonth() + 3)),
            },
        });
        // Create coupon for new user
        const coupon = yield tx.coupon.create({
            data: {
                userId,
                code: (0, coupon_utils_1.generateCouponCode)(),
                discount: 10000,
                expiresAt: new Date(new Date().setMonth(new Date().getMonth() + 3)),
            },
        });
        // Send notifications
        try {
            yield (0, email_service_1.sendEmail)(referrer.email, "Referral Reward", `You've earned 10,000 points because ${user.first_name || "someone"} used your referral code!`);
        }
        catch (error) {
            console.error("Failed to send referral email:", error);
            // Don't throw error here as the referral process should still complete
        }
        return coupon;
    }));
});
exports.applyReferral = applyReferral;
const refundPoints = (tx, userId, points) => __awaiter(void 0, void 0, void 0, function* () {
    yield tx.point.create({
        data: {
            userId,
            amount: points,
            expiresAt: new Date(new Date().setMonth(new Date().getMonth() + 3)),
        },
    });
});
exports.refundPoints = refundPoints;
const getUserPoints = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const points = yield prisma_1.default.point.findMany({
        where: {
            userId,
            expiresAt: { gt: new Date() },
        },
        orderBy: { expiresAt: "asc" },
    });
    return points.reduce((total, point) => total + point.amount, 0);
});
exports.getUserPoints = getUserPoints;
