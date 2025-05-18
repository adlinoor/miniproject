import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { UserPayload } from "../interfaces/user.interface";

dotenv.config();

interface DecodedUser {
  id: number;
  email: string;
  role: string;
  first_name?: string;
  last_name?: string;
}

const secret = process.env.SECRET_KEY;

if (!secret) {
  throw new Error("❌ SECRET_KEY is not defined in environment variables.");
}

// ===============================
// Middleware: Authenticate
// ===============================
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: Token missing" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, secret) as UserPayload;
    req.user = decoded;
    next();
  } catch (err) {
    console.error("❌ JWT verification failed:", err);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

// ===============================
// Middleware: Authorize Roles
// ===============================
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (
      !req.user ||
      typeof req.user.role !== "string" ||
      !roles.includes(req.user.role)
    ) {
      return res.status(403).json({
        message: "Forbidden: You do not have permission to access this route",
      });
    }

    next();
  };
};
