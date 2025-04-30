import prisma from "../lib/prisma";
import { Point, Prisma, TransactionStatus } from "@prisma/client";

/**
 * Get the total points balance for a user.
 * @param userId - The ID of the user.
 * @returns The total points balance.
 */
export const getUserPointsBalance = async (userId: number): Promise<number> => {
  const result = await prisma.point.aggregate({
    where: {
      userId,
      expiresAt: { gt: new Date() }, // Only include unexpired points
    },
    _sum: {
      amount: true,
    },
  });

  return result._sum?.amount || 0;
};

/**
 * Add points to a user's account.
 * @param userId - The ID of the user.
 * @param amount - The amount of points to add.
 * @param expiresInMonths - The number of months until the points expire (default: 3 months).
 * @returns The created Point record.
 */
export const addPoints = async (
  userId: number,
  amount: number,
  expiresInMonths: number = 3
): Promise<Point> => {
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + expiresInMonths);

  return await prisma.point.create({
    data: {
      userId,
      amount,
      expiresAt,
    },
  });
};

/**
 * Use points for a transaction.
 * @param userId - The ID of the user.
 * @param amount - The amount of points to use.
 * @returns A boolean indicating whether the operation was successful.
 */
export const usePoints = async (
  userId: number,
  amount: number
): Promise<boolean> => {
  return await prisma.$transaction(async (tx) => {
    // Get the total available points for the user
    const availablePoints = await tx.point.aggregate({
      where: {
        userId,
        expiresAt: { gt: new Date() }, // Only include unexpired points
      },
      _sum: {
        amount: true,
      },
    });

    const totalAvailable = availablePoints._sum?.amount || 0;

    if (totalAvailable < amount) {
      throw new Error("Insufficient points balance");
    }

    // Get points ordered by expiration (use oldest points first)
    const pointsToUse = await tx.point.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
        amount: { gt: 0 },
      },
      orderBy: {
        expiresAt: "asc",
      },
    });

    let remaining = amount;

    for (const point of pointsToUse) {
      if (remaining <= 0) break;

      const useAmount = Math.min(remaining, point.amount);
      remaining -= useAmount;

      // Deduct the used points from the current point record
      await tx.point.update({
        where: { id: point.id },
        data: { amount: point.amount - useAmount },
      });

      // Create a record of points usage in the Transaction table
      await tx.transaction.create({
        data: {
          userId,
          eventId: point.id,
          totalPrice: useAmount,
          quantity: 1,
          status: TransactionStatus.done,
          expiresAt: point.expiresAt,
        },
      });
    }

    return true;
  });
};

/**
 * Expire points that have passed their expiration date.
 */
export const expirePoints = async (): Promise<void> => {
  const now = new Date();
  await prisma.point.deleteMany({
    where: {
      expiresAt: { lte: now }, // Points that have expired
      amount: { gt: 0 }, // Only points with a positive balance
    },
  });
};
