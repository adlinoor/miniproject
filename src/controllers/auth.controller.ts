import { Request, Response } from "express";
import * as authService from "../services/auth.service";
import { z } from "zod";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { Role } from "@prisma/client";

dotenv.config();

// Token generation with enhanced type safety
const generateToken = (user: { id: number; email: string; role: Role }) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.SECRET_KEY!,
    { expiresIn: "1h" }
  );
};

export const registerSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum([Role.CUSTOMER, Role.ORGANIZER]).default(Role.CUSTOMER),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"), // Changed to min 1 for flexibility
});

/**
 * Register a new user with proper error handling
 */
export const register = async (req: Request, res: Response) => {
  try {
    let validatedData = registerSchema.parse(req.body);
    validatedData = {
      ...validatedData,
      role: validatedData.role.toUpperCase() as Role,
    };

    const user = await authService.RegisterService(validatedData);

    // Generate token with user details
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Omit sensitive data from response
    const { password, ...userData } = user;

    res.status(201).json({
      user: userData,
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.errors,
      });
    }

    res.status(400).json({
      error: error instanceof Error ? error.message : "Registration failed",
    });
  }
};

/**
 * Log in a user with enhanced security
 */
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

    // Generic error message for security (don't reveal if email exists)
    res.status(401).json({
      error: "Invalid credentials",
    });
  }
};
