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
exports.rollbackTransaction = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const rollbackTransaction = (trx) => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        // 1. Kembalikan kursi event
        if (trx.eventId && trx.quantity) {
            yield tx.event.update({
                where: { id: trx.eventId },
                data: {
                    availableSeats: {
                        increment: trx.quantity,
                    },
                },
            });
        }
        // 2. Kembalikan poin user (field: pointsUsed → tambahkan ke userPoints)
        if (trx.pointsUsed > 0) {
            yield tx.user.update({
                where: { id: trx.userId },
                data: {
                    userPoints: {
                        increment: trx.pointsUsed,
                    },
                },
            });
        }
        // 3. Tandai kupon sebagai belum digunakan (field: isUsed)
        if (trx.voucherCode) {
            yield tx.coupon.updateMany({
                where: {
                    code: trx.voucherCode,
                    userId: trx.userId,
                },
                data: {
                    isUsed: false,
                },
            });
        }
    }));
});
exports.rollbackTransaction = rollbackTransaction;
