import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";
import { IRegisterParam, ILoginParam } from "../interfaces/user.interface";

export const RegisterService = async (param: IRegisterParam) => {
  // Add explicit type checking
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

  const user = await prisma.user.create({
    data: {
      email: param.email,
      password: hashedPassword,
      first_name: param.first_name,
      last_name: param.last_name,
      role: param.role as Role, // Cast to ensure type safety
      isVerified: false,
      referralCode,
    },
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
      isVerified: user.isVerified,
    },
  };
};
