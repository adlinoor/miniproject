import { Request, Response, NextFunction } from "express";
import { verify } from "jsonwebtoken";
import { IUserReqParam } from "../custom";
import { SECRET_KEY } from "../config";
import { Role } from "@prisma/client";

async function VerifyToken(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) throw new Error("Unauthorized");

    const verifyUser = verify(token, String(SECRET_KEY));

    if (!verifyUser) throw new Error("Invalid Token");

    req.user = verifyUser as IUserReqParam;

    next();
  } catch (err) {
    next(err);
  }
}

async function EOGuard(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.user?.role !== "Event Organizer") throw new Error("Restricted");

    next();
  } catch (err) {
    next(err);
  }
}

async function authorizeRoles(roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!roles.includes(req.user?.role as Role))
        throw new Error("Restricted");
      next();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      res.status(403).json({ message: "Forbidden", error: errorMessage });
    }
  };
}

export { VerifyToken, EOGuard, authorizeRoles };
