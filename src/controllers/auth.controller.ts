import { Request, Response } from "express";
import { z } from "zod";
import dotenv from "dotenv";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { Role } from "@prisma/client";
import * as authService from "../services/auth.service";
import { sendEmail } from "../services/email.service";
import prisma from "../lib/prisma";

dotenv.config();

// ====================
// 🔐 SCHEMA VALIDATION
// ====================
export const registerSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum([Role.CUSTOMER, Role.ORGANIZER]).default(Role.CUSTOMER),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

// ====================
// 👤 REGISTER
// ====================
export const register = async (req: Request, res: Response) => {
  try {
    const user = await authService.RegisterService(req.body);

    // ✅ Reuse login logic to generate token + full user
    const { token, user: fullUser } = await authService.LoginService({
      email: user.email,
      password: req.body.password,
    });

    res.status(201).json({
      user: fullUser,
      token,
    });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "Registration failed",
    });
  }
};

// ====================
// 🔓 LOGIN
// ====================
export const login = async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    const result = await authService.LoginService(validatedData);

    res.json({
      user: result.user,
      token: result.token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.errors,
      });
    }

    res.status(401).json({
      error: "Invalid credentials",
    });
  }
};

// ============================
// 🔁 FORGOT PASSWORD - Send link
// ============================
export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(200).json({
      message: "If your email is registered, a reset link has been sent.",
    });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken: token,
      resetTokenExp: expires,
    },
  });

  const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;
  await sendEmail(user.email, "Reset Password", `Click to reset: ${resetLink}`);

  return res.status(200).json({ message: "Reset link sent to your email" });
};

// ============================
// 🔁 RESET PASSWORD - Use token
// ============================
export const resetPassword = async (req: Request, res: Response) => {
  const { token } = req.params;
  const { password } = req.body;

  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExp: { gt: new Date() },
    },
  });

  if (!user) {
    return res.status(400).json({ error: "Invalid or expired token" });
  }

  const hashed = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashed,
      resetToken: null,
      resetTokenExp: null,
    },
  });

  return res.status(200).json({ message: "Password updated successfully" });
};
