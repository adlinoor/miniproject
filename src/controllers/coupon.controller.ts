import { Request, Response } from "express";
import prisma from "../lib/prisma";

export const redeemCoupon = async (req: Request, res: Response) => {
  const user = req.user; // dari middleware authenticate
  const { code } = req.body;

  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const coupon = await prisma.coupon.findFirst({
    where: {
      code,
      userId: user.id,
      isUsed: false,
      expiresAt: { gte: new Date() },
    },
  });

  if (!coupon) {
    return res.status(400).json({ message: "Invalid or already used coupon." });
  }

  await prisma.$transaction([
    prisma.coupon.update({
      where: { id: coupon.id },
      data: { isUsed: true },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: {
        userPoints: { increment: coupon.discount },
      },
    }),
  ]);

  return res
    .status(200)
    .json({ message: `Coupon redeemed. +${coupon.discount} points added!` });
};
