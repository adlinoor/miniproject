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
exports.applyVoucherHandler = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const applyVoucherHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { code, eventId } = req.body;
    const now = new Date();
    if (!code || !eventId) {
        return res.status(400).json({ message: "Code and eventId are required" });
    }
    const promo = yield prisma_1.default.promotion.findFirst({
        where: {
            code,
            eventId,
            startDate: { lte: now },
            endDate: { gte: now },
        },
    });
    if (!promo) {
        return res.status(404).json({ message: "Voucher not valid or expired" });
    }
    return res.status(200).json({
        discount: promo.discount,
        message: "Voucher applied",
    });
});
exports.applyVoucherHandler = applyVoucherHandler;
