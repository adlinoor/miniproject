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
exports.redeemCoupon = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const redeemCoupon = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user; // dari middleware authenticate
    const { code } = req.body;
    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const coupon = yield prisma_1.default.coupon.findFirst({
        where: {
            code,
            userId: user.id,
            isUsed: false,
            expiresAt: { gte: new Date() },
        },
    });
    if (!coupon) {
        return res.status(400).json({ message: "Invalid or already used coupon." });
    }
    yield prisma_1.default.$transaction([
        prisma_1.default.coupon.update({
            where: { id: coupon.id },
            data: { isUsed: true },
        }),
        prisma_1.default.user.update({
            where: { id: user.id },
            data: {
                userPoints: { increment: coupon.discount },
            },
        }),
    ]);
    return res
        .status(200)
        .json({ message: `Coupon redeemed. +${coupon.discount} points added!` });
});
exports.redeemCoupon = redeemCoupon;
