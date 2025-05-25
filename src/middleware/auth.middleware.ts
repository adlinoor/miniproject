import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { UserPayload } from "../interfaces/user.interface";

dotenv.config();

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
  const cookieToken = req.cookies?.access_token;

  const token =
    (authHeader?.startsWith("Bearer ") && authHeader.split(" ")[1]) ||
    cookieToken;

  console.log("📥 Token from header or cookie:", token);

  if (!token) {
    console.warn("❌ No token found in request");
    return res.status(401).json({ message: "Unauthorized: Token missing" });
  }

  try {
    const decoded = jwt.verify(token, secret) as UserPayload;
    console.log("✅ Token verified. Payload:", decoded); // ✅ log full payload
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
    const user = req.user as UserPayload;

    console.log("🔍 Role from token:", user?.role);
    console.log("🔐 Allowed roles:", roles);

    if (!user || !roles.includes(user.role)) {
      console.warn("⛔ Access denied: user.role not in allowed roles");
      return res.status(403).json({
        message: "Forbidden: You do not have permission to access this route",
      });
    }

    next();
  };
};

export const requireVerified = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user?.isVerified) {
    return res.status(403).json({ message: "Please verify your email first" });
  }
  next();
};
