// src/types/express/index.d.ts
import { UserRole } from "@prisma/client";

declare global {
  namespace Express {
    interface UserPayload {
      id: number;
      email: string;
      role: UserRole;
      first_name: string;
      last_name: string;
    }

    interface Request {
      user?: UserPayload;
    }
  }
}

export {};
