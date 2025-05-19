import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";
import { IRegisterParam, ILoginParam } from "../interfaces/user.interface";

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
  const referralCode = `REF-${Math.random()
    .toString(36)
    .substring(2, 10)
    .toUpperCase()}`;

  let referredByUser = null;

  if (param.referralCode) {
    referredByUser = await prisma.user.findUnique({
      where: { referralCode: param.referralCode },
    });
    if (!referredByUser) throw new Error("Invalid referral code");
  }

  // Mulai transaksi
  const user = await prisma.$transaction(async (tx) => {
    // Create new user
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
      },
    });

    // Jika referral valid, beri reward ke referrer
    if (referredByUser) {
      // Tambahkan point
      await tx.point.create({
        data: {
          userId: referredByUser.id,
          amount: 10000,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90), // 3 bulan
        },
      });

      // Buatkan kupon diskon untuk user baru
      await tx.coupon.create({
        data: {
          userId: newUser.id,
          code: `COUP-${Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase()}`,
          discount: 10000,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90), // 3 bulan
        },
      });
    }

    return newUser;
  });

  return user;
};

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
    },
  };
};
