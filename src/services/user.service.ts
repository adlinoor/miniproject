import prisma from "../lib/prisma";
import { sendEmail } from "./email.service";

export const applyReferral = async (userId: number, referralCode: string) => {
  return await prisma.$transaction(async (tx) => {
    // Check if user already used a referral
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { referredBy: true, first_name: true },
    });

    if (user?.referredBy) {
      throw new Error("You already used a referral code");
    }

    // Find referrer
    const referrer = await tx.user.findUnique({
      where: { referralCode },
      select: { id: true, email: true, first_name: true },
    });

    if (!referrer) {
      throw new Error("Invalid referral code");
    }

    if (referrer.id === userId) {
      throw new Error("Cannot use your own referral code");
    }

    // Update user with referral
    await tx.user.update({
      where: { id: userId },
      data: { referredBy: referralCode },
    });

    // Create points for referrer
    await tx.point.create({
      data: {
        userId: referrer.id,
        amount: 10000,
        expiresAt: new Date(new Date().setMonth(new Date().getMonth() + 3)),
      },
    });

    // Create coupon for new user
    const coupon = await tx.coupon.create({
      data: {
        userId,
        code: `WELCOME-${Math.random()
          .toString(36)
          .substring(2, 8)
          .toUpperCase()}`,
        discount: 10000,
        expiresAt: new Date(new Date().setMonth(new Date().getMonth() + 3)),
      },
    });

    // Send notifications
    await sendEmail(
      referrer.email,
      "Referral Reward",
      `You've earned 10,000 points because ${
        user?.first_name || "someone"
      } used your referral code!`
    );

    return coupon;
  });
};

// Ensure refundPoints is defined and exported
export const refundPoints = async (
  tx: typeof prisma,
  userId: number,
  points: number
) => {
  // Logic to refund points
};
