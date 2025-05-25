import prisma from "../lib/prisma";
import { User } from "@prisma/client";

// Ambil user berdasarkan ID
export const getUserById = async (
  userId: number
): Promise<Partial<User> | null> => {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      first_name: true,
      last_name: true,
      email: true,
      profilePicture: true,
      role: true,
      userPoints: true,
      createdAt: true,
      referralCode: true,
    },
  });
};

// Update user
export const updateUser = async (
  userId: number,
  data: {
    first_name?: string;
    last_name?: string;
    email?: string;
    password?: string;
    profilePicture?: string;
  }
) => {
  return await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      first_name: true,
      last_name: true,
      email: true,
      profilePicture: true,
      role: true,
      userPoints: true,
      updatedAt: true,
    },
  });
};

// Ringkasan poin dan kupon
export const getUserRewardSummary = async (userId: number) => {
  const now = new Date();

  const [activePoints, coupons] = await Promise.all([
    prisma.point.findMany({
      where: {
        userId,
        expiresAt: { gt: now },
      },
      select: {
        amount: true,
        expiresAt: true,
        createdAt: true,
      },
    }),

    prisma.coupon.findMany({
      where: { userId },
      select: {
        code: true,
        discount: true,
        expiresAt: true,
        isUsed: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    totalActivePoints: activePoints.reduce((sum, p) => sum + p.amount, 0),
    pointHistory: activePoints,
    coupons: {
      active: coupons.filter((c) => !c.isUsed && c.expiresAt > now),
      used: coupons.filter((c) => c.isUsed),
      expired: coupons.filter((c) => !c.isUsed && c.expiresAt <= now),
    },
  };
};
