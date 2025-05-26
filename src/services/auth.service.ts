import { Role } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";
import { IRegisterParam, ILoginParam } from "../interfaces/user.interface";
import { addPoints } from "./point.service";
import { generateReferralCode, generateCouponCode } from "../utils/helpers";

// REGISTER SERVICE
export const RegisterService = async (param: IRegisterParam) => {
  if (!Object.values(Role).includes(param.role)) {
    throw new Error(
      `Invalid role. Must be one of: ${Object.values(Role).join(", ")}`
    );
  }

  const isExist = await prisma.user.findFirst({
    where: { email: param.email },
  });
  if (isExist) throw new Error("Email already registered");

  const hashedPassword = await bcrypt.hash(param.password, 10);
  const referralCode = generateReferralCode();
  let referredByUser = null;

  if (param.referralCode) {
    referredByUser = await prisma.user.findUnique({
      where: { referralCode: param.referralCode.toUpperCase() },
    });
    if (!referredByUser) throw new Error("Invalid referral code");
  }

  const user = await prisma.$transaction(async (tx) => {
    // 1. Buat user baru
    const newUser = await tx.user.create({
      data: {
        email: param.email,
        password: hashedPassword,
        first_name: param.first_name,
        last_name: param.last_name,
        role: param.role,
        isVerified: false,
        referralCode,
        referredBy: referredByUser?.referralCode || null,
        userPoints: 0, // default
      },
    });

    // 2. Referral reward
    if (referredByUser) {
      await addPoints(tx, referredByUser.id, 10000); // Referrer dapat 10k poin
      await addPoints(tx, newUser.id, 10000); // User baru dapat 10k poin
      await tx.coupon.create({
        data: {
          userId: newUser.id,
          code: generateCouponCode(),
          discount: 10000,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90),
        },
      });
    }

    // 3. REFETCH untuk dapat userPoints yang sudah diupdate
    const userWithUpdatedPoints = await tx.user.findUnique({
      where: { id: newUser.id },
    });
    return userWithUpdatedPoints;
  });

  return user;
};

// LOGIN SERVICE
export const LoginService = async (param: ILoginParam) => {
  const user = await prisma.user.findFirst({
    where: { email: param.email },
  });

  if (!user) throw new Error("Email not registered");

  const isPasswordValid = await bcrypt.compare(param.password, user.password);
  if (!isPasswordValid) throw new Error("Incorrect password");

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
    },
    process.env.SECRET_KEY!,
    { expiresIn: "1h" }
  );

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      referralCode: user.referralCode,
      isVerified: user.isVerified,
      userPoints: user.userPoints,
    },
  };
};
