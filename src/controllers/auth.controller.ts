import { Request, Response } from "express";
import * as authService from "../services/auth.service";
import { z } from "zod";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const generateToken = (userId: number) => {
  return jwt.sign({ id: userId }, process.env.SECRET_KEY!);
};
// Validation schemas
export const registerSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["CUSTOMER", "ORGANIZER"]).default("CUSTOMER"), // Role is optional and defaults to "CUSTOMER"
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
    // Validate the incoming request body using the updated schema
    const validatedData = registerSchema.parse(req.body);

    // Pass validated data to RegisterService
    const user = await authService.RegisterService(validatedData);

    // Generate JWT token after successful registration
    const token = generateToken(user.id);

    // Send response with user and token
    res.status(201).json({ user, token });
  } catch (error: any) {
    // Return validation or other error responses
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
