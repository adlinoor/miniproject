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
const node_cron_1 = __importDefault(require("node-cron"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const transaction_service_1 = require("../services/transaction.service");
/**
 * 🔁 Daily cleanup for points and coupons
 * Runs at 01:00 every day
 */
node_cron_1.default.schedule("0 1 * * *", () => __awaiter(void 0, void 0, void 0, function* () {
    const now = new Date();
    console.log("[CRON] Running daily cleanup...");
    try {
        // 🧹 Hapus poin expired
        const deletedPoints = yield prisma_1.default.point.deleteMany({
            where: {
                expiresAt: { lt: now },
            },
        });
        // 🧼 Update kupon kadaluarsa jadi isUsed = true
        const expiredCoupons = yield prisma_1.default.coupon.updateMany({
            where: {
                expiresAt: { lt: now },
                isUsed: false,
            },
            data: {
                isUsed: true,
            },
        });
        console.log(`[CRON] Cleanup done. Deleted points: ${deletedPoints.count}, expired coupons: ${expiredCoupons.count}`);
    }
    catch (error) {
        console.error("[CRON] Cleanup job failed:", error);
    }
}));
/**
 * ⏳ Transaction expiration check
 * Runs every 30 minutes
 */
node_cron_1.default.schedule("*/30 * * * *", transaction_service_1.checkTransactionExpirations);
/**
 * 🧰 Custom scheduler (optional utility)
 */
function scheduleTask(taskName, cronExpression, taskCallback) {
    node_cron_1.default.schedule(cronExpression, () => __awaiter(this, void 0, void 0, function* () {
        console.log(`[${taskName}] Task started at ${new Date().toISOString()}`);
        try {
            yield taskCallback();
            console.log(`[${taskName}] Task completed successfully.`);
        }
        catch (error) {
            console.error(`[${taskName}] Task failed:`, error);
        }
    }));
}
exports.default = scheduleTask;
