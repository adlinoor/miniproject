import cron from "node-cron";
import prisma from "../lib/prisma";
import { rollbackTransaction } from "./rollbackTransaction";
import { checkTransactionExpirations } from "../services/transaction.service";

/**
 * 🔁 Daily cleanup for expired points and coupons
 * Runs at 01:00 every day
 */
cron.schedule("0 1 * * *", async () => {
  const now = new Date();
  console.log(`[CRON] Running daily cleanup at ${now.toISOString()}...`);

  try {
    const deletedPoints = await prisma.point.deleteMany({
      where: { expiresAt: { lt: now } },
    });

    const expiredCoupons = await prisma.coupon.updateMany({
      where: { expiresAt: { lt: now }, isUsed: false },
      data: { isUsed: true },
    });

    console.log(
      `[CRON] Cleanup done. Deleted points: ${deletedPoints.count}, expired coupons: ${expiredCoupons.count}`
    );
  } catch (error) {
    console.error("[CRON] Cleanup job failed:", error);
  }
});

/**
 * ⏳ Check for transactions waiting for proof upload > 2 hours
 * Runs every 5 minutes
 */
cron.schedule("*/5 * * * *", async () => {
  console.log("[CRON] Checking for expired upload proofs...");

  try {
    const expired = await prisma.transaction.findMany({
      where: {
        status: "WAITING_FOR_PAYMENT",
        createdAt: { lt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
        paymentProof: null,
      },
    });

    for (const trx of expired) {
      try {
        await prisma.transaction.update({
          where: { id: trx.id },
          data: { status: "EXPIRED" },
        });
        console.log(`[CRON] Marked transaction ${trx.id} as EXPIRED`);
      } catch (err) {
        console.error(`[CRON] Failed to expire transaction ${trx.id}:`, err);
      }
    }
  } catch (error) {
    console.error("[CRON] Error checking expired upload proofs:", error);
  }
});

/**
 * ⛔ Cancel transactions pending admin confirmation > 3 days
 * Runs every hour
 */
cron.schedule("0 * * * *", async () => {
  console.log("[CRON] Checking for stale transactions...");

  try {
    const stale = await prisma.transaction.findMany({
      where: {
        status: "WAITING_FOR_ADMIN_CONFIRMATION",
        updatedAt: {
          lt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 hari
        },
      },
    });

    for (const trx of stale) {
      try {
        await prisma.transaction.update({
          where: { id: trx.id },
          data: { status: "CANCELED" },
        });
        await rollbackTransaction(trx);
        console.log(`[CRON] Canceled & rolled back transaction ${trx.id}`);
      } catch (err) {
        console.error(`[CRON] Failed to cancel transaction ${trx.id}:`, err);
      }
    }
  } catch (error) {
    console.error("[CRON] Error checking stale transactions:", error);
  }
});

/**
 * 🧪 Optional: run expiration checker if it has extra logic
 * Runs every 30 minutes
 */
cron.schedule("*/30 * * * *", async () => {
  console.log("[CRON] Running custom checkTransactionExpirations...");
  try {
    await checkTransactionExpirations();
    console.log("[CRON] checkTransactionExpirations completed.");
  } catch (error) {
    console.error("[CRON] checkTransactionExpirations failed:", error);
  }
});

/**
 * 🧰 Reusable custom task scheduler
 */
export function scheduleTask(
  taskName: string,
  cronExpression: string,
  taskCallback: () => Promise<void>
) {
  cron.schedule(cronExpression, async () => {
    const time = new Date().toISOString();
    console.log(`[${taskName}] Task started at ${time}`);
    try {
      await taskCallback();
      console.log(`[${taskName}] Task completed successfully.`);
    } catch (error) {
      console.error(`[${taskName}] Task failed:`, error);
    }
  });
}
