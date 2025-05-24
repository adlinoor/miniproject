import { Point, Prisma } from "@prisma/client";
import prisma from "../lib/prisma";

export const addPoints = async (
  tx: Prisma.TransactionClient,
  userId: number,
  amount: number,
  expiresInMonths: number = 3
): Promise<Point> => {
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + expiresInMonths);

  // Buat point record
  const point = await tx.point.create({
    data: { userId, amount, expiresAt },
  });

  // Update userPoints field di User model (saldo total)
  await tx.user.update({
    where: { id: userId },
    data: { userPoints: { increment: amount } },
  });

  return point;
};

/**
 * Get user's points (ambil dari field userPoints di User).
 */
export const getUserPointsBalance = async (userId: number): Promise<number> => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user?.userPoints ?? 0;
};

export const usePoints = async (userId: number, amount: number) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.userPoints < amount) throw new Error("Insufficient points");
  const points = await prisma.point.findMany({
    where: { userId, expiresAt: { gt: new Date() }, amount: { gt: 0 } },
    orderBy: { expiresAt: "asc" },
  });
  let remaining = amount;
  for (const point of points) {
    if (remaining <= 0) break;
    const useAmount = Math.min(remaining, point.amount);
    remaining -= useAmount;
    await prisma.point.update({
      where: { id: point.id },
      data: { amount: point.amount - useAmount },
    });
  }
  await prisma.user.update({
    where: { id: userId },
    data: { userPoints: { decrement: amount } },
  });
};

export const expirePoints = async () => {
  const now = new Date();
  const expiredPoints = await prisma.point.findMany({
    where: { expiresAt: { lte: now }, amount: { gt: 0 } },
  });
  for (const p of expiredPoints) {
    await prisma.user.update({
      where: { id: p.userId },
      data: { userPoints: { decrement: p.amount } },
    });
  }
  await prisma.point.deleteMany({
    where: { expiresAt: { lte: now } },
  });
};

export default { getUserPointsBalance, addPoints, usePoints, expirePoints };
