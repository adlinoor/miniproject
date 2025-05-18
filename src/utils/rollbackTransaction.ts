import prisma from "../lib/prisma";

export const rollbackTransaction = async (trx: any) => {
  await prisma.$transaction(async (tx) => {
    // 1. Kembalikan kursi event
    if (trx.eventId && trx.quantity) {
      await tx.event.update({
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
      await tx.user.update({
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
      await tx.coupon.updateMany({
        where: {
          code: trx.voucherCode,
          userId: trx.userId,
        },
        data: {
          isUsed: false,
        },
      });
    }
  });
};
