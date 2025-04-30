import { Request } from "express";
import { Role } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        first_name?: string;
        last_name?: string;
        role: Role;
      };
    }
  }
}
export interface IUserReqParam {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: Role;
}
