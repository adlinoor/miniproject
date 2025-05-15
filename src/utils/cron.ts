import cron from "node-cron";
import prisma from "../lib/prisma";
import { checkTransactionExpirations } from "../services/transaction.service";

/**
 * 🔁 Daily cleanup for points and coupons
 * Runs at 01:00 every day
 */
cron.schedule("0 1 * * *", async () => {
  const now = new Date();
  console.log("[CRON] Running daily cleanup...");

  try {
    // 🧹 Hapus poin expired
    const deletedPoints = await prisma.point.deleteMany({
      where: {
        expiresAt: { lt: now },
      },
    });

    // 🧼 Update kupon kadaluarsa jadi isUsed = true
    const expiredCoupons = await prisma.coupon.updateMany({
      where: {
        expiresAt: { lt: now },
        isUsed: false,
      },
      data: {
        isUsed: true,
      },
    });

    console.log(
      `[CRON] Cleanup done. Deleted points: ${deletedPoints.count}, expired coupons: ${expiredCoupons.count}`
    );
  } catch (error) {
    console.error("[CRON] Cleanup job failed:", error);
  }
});

/**
 * ⏳ Transaction expiration check
 * Runs every 30 minutes
 */
cron.schedule("*/30 * * * *", checkTransactionExpirations);

/**
 * 🧰 Custom scheduler (optional utility)
 */
function scheduleTask(
  taskName: string,
  cronExpression: string,
  taskCallback: () => Promise<void>
) {
  cron.schedule(cronExpression, async () => {
    console.log(`[${taskName}] Task started at ${new Date().toISOString()}`);
    try {
      await taskCallback();
      console.log(`[${taskName}] Task completed successfully.`);
    } catch (error) {
      console.error(`[${taskName}] Task failed:`, error);
    }
  });
}

export default scheduleTask;
