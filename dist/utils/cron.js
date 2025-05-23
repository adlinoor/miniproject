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
exports.scheduleTask = scheduleTask;
const node_cron_1 = __importDefault(require("node-cron"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const rollbackTransaction_1 = require("./rollbackTransaction");
const transaction_service_1 = require("../services/transaction.service");
/**
 * 🔁 Daily cleanup for expired points and coupons
 * Runs at 01:00 every day
 */
node_cron_1.default.schedule("0 1 * * *", () => __awaiter(void 0, void 0, void 0, function* () {
    const now = new Date();
    console.log(`[CRON] Running daily cleanup at ${now.toISOString()}...`);
    try {
        const deletedPoints = yield prisma_1.default.point.deleteMany({
            where: { expiresAt: { lt: now } },
        });
        const expiredCoupons = yield prisma_1.default.coupon.updateMany({
            where: { expiresAt: { lt: now }, isUsed: false },
            data: { isUsed: true },
        });
        console.log(`[CRON] Cleanup done. Deleted points: ${deletedPoints.count}, expired coupons: ${expiredCoupons.count}`);
    }
    catch (error) {
        console.error("[CRON] Cleanup job failed:", error);
    }
}));
/**
 * ⏳ Check for transactions waiting for proof upload > 2 hours
 * Runs every 5 minutes
 */
node_cron_1.default.schedule("*/5 * * * *", () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("[CRON] Checking for expired upload proofs...");
    try {
        const expired = yield prisma_1.default.transaction.findMany({
            where: {
                status: "WAITING_FOR_PAYMENT",
                createdAt: { lt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
                paymentProof: null,
            },
        });
        for (const trx of expired) {
            try {
                yield prisma_1.default.transaction.update({
                    where: { id: trx.id },
                    data: { status: "EXPIRED" },
                });
                console.log(`[CRON] Marked transaction ${trx.id} as EXPIRED`);
            }
            catch (err) {
                console.error(`[CRON] Failed to expire transaction ${trx.id}:`, err);
            }
        }
    }
    catch (error) {
        console.error("[CRON] Error checking expired upload proofs:", error);
    }
}));
/**
 * ⛔ Cancel transactions pending admin confirmation > 3 days
 * Runs every hour
 */
node_cron_1.default.schedule("0 * * * *", () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("[CRON] Checking for stale transactions...");
    try {
        const stale = yield prisma_1.default.transaction.findMany({
            where: {
                status: "WAITING_FOR_ADMIN_CONFIRMATION",
                updatedAt: {
                    lt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 hari
                },
            },
        });
        for (const trx of stale) {
            try {
                yield prisma_1.default.transaction.update({
                    where: { id: trx.id },
                    data: { status: "CANCELED" },
                });
                yield (0, rollbackTransaction_1.rollbackTransaction)(trx);
                console.log(`[CRON] Canceled & rolled back transaction ${trx.id}`);
            }
            catch (err) {
                console.error(`[CRON] Failed to cancel transaction ${trx.id}:`, err);
            }
        }
    }
    catch (error) {
        console.error("[CRON] Error checking stale transactions:", error);
    }
}));
/**
<<<<<<< HEAD
 * 🧪 Optional: run expiration checker if it has extra logic
=======
 * 🧪 Optional: Use if checkTransactionExpirations has different logic
>>>>>>> e654e4524e15f8e93a2dc691010488b060051a89
 * Runs every 30 minutes
 */
node_cron_1.default.schedule("*/30 * * * *", () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("[CRON] Running custom checkTransactionExpirations...");
    try {
        yield (0, transaction_service_1.checkTransactionExpirations)();
        console.log("[CRON] checkTransactionExpirations completed.");
    }
    catch (error) {
        console.error("[CRON] checkTransactionExpirations failed:", error);
    }
}));
/**
<<<<<<< HEAD
 * 🧰 Reusable custom task scheduler
=======
 * 🧰 Reusable scheduler (for testing or future extensions)
>>>>>>> e654e4524e15f8e93a2dc691010488b060051a89
 */
function scheduleTask(taskName, cronExpression, taskCallback) {
    node_cron_1.default.schedule(cronExpression, () => __awaiter(this, void 0, void 0, function* () {
        const time = new Date().toISOString();
        console.log(`[${taskName}] Task started at ${time}`);
        try {
            yield taskCallback();
            console.log(`[${taskName}] Task completed successfully.`);
        }
        catch (error) {
            console.error(`[${taskName}] Task failed:`, error);
        }
    }));
}
