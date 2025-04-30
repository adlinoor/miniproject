import { Request, Response } from "express";
import * as authService from "../services/auth.service";
import { z } from "zod";

// Validation schemas
export const registerSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

/**
 * Register a new user.
 */
export const register = async (req: Request, res: Response) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const user = await authService.RegisterService({
      ...validatedData,
      role: "customer",
    });
    res.status(201).json(user);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Log in a user.
 */
export const login = async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { user, token } = await authService.LoginService(validatedData);
    res.json({ user, token });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
};
