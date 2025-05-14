import cron from "node-cron";
import { checkTransactionExpirations } from "../services/transaction.service";
import { prisma } from "../lib/prisma";

cron.schedule("0 1 * * *", async () => {
  const now = new Date();
  console.log("[CRON] Running daily cleanup...");

  try {
    // Hapus poin yang sudah expired
    const deletedPoints = await prisma.point.deleteMany({
      where: {
        expiresAt: { lt: now },
      },
    });

    // Tandai kupon yang sudah expired sebagai isUsed = true
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

// Run every 30 minutes
cron.schedule("*/30 * * * *", checkTransactionExpirations);

/**
 * Schedules a task to run at a specified cron schedule.
 * @param taskName - A descriptive name for the task (used in logs).
 * @param cronExpression - The cron expression defining the schedule.
 * @param taskCallback - The function containing the task logic to execute.
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
