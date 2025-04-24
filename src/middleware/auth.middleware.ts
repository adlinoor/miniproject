import { Request, Response, NextFunction } from "express";
import { verify, JwtPayload } from "jsonwebtoken";
import { IUserReqParam } from "../custom";
import { SECRET_KEY } from "../config";
import { Role } from "@prisma/client";

async function VerifyToken(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const verifyUser = verify(token, String(SECRET_KEY));

    if (typeof verifyUser !== "object" || !verifyUser) {
      return res.status(401).json({ message: "Invalid Token" });
    }

    const { id, email, first_name, last_name, role } = verifyUser as JwtPayload;

    if (!id || !email || !role) {
      return res.status(401).json({ message: "Invalid Token Payload" });
    }

    req.user = { id, email, first_name, last_name, role } as IUserReqParam;

    next();
  } catch (err) {
    res
      .status(401)
      .json({ message: "Unauthorized", error: (err as Error).message });
  }
}

async function EOGuard(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.user?.role !== Role.organizer)
      return res.status(403).json({ message: "Restricted" });

    next();
  } catch (err) {
    res
      .status(403)
      .json({ message: "Forbidden", error: (err as Error).message });
  }
}

function authorizeRoles(roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!roles.includes(req.user?.role as Role)) {
        return res.status(403).json({ message: "Restricted" });
      }

      next();
    } catch (err) {
      res
        .status(403)
        .json({ message: "Forbidden", error: (err as Error).message });
    }
  };
}

export { VerifyToken, EOGuard, authorizeRoles };
