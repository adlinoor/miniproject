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
const transaction_service_1 = require("../services/transaction.service");
const prisma_1 = require("../lib/prisma");
node_cron_1.default.schedule("0 1 * * *", () => __awaiter(void 0, void 0, void 0, function* () {
    const now = new Date();
    console.log("[CRON] Running daily cleanup...");
    try {
        // Hapus poin yang sudah expired
        const deletedPoints = yield prisma_1.prisma.point.deleteMany({
            where: {
                expiresAt: { lt: now },
            },
        });
        // Tandai kupon yang sudah expired sebagai isUsed = true
        const expiredCoupons = yield prisma_1.prisma.coupon.updateMany({
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
// Run every 30 minutes
node_cron_1.default.schedule("*/30 * * * *", transaction_service_1.checkTransactionExpirations);
/**
 * Schedules a task to run at a specified cron schedule.
 * @param taskName - A descriptive name for the task (used in logs).
 * @param cronExpression - The cron expression defining the schedule.
 * @param taskCallback - The function containing the task logic to execute.
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
