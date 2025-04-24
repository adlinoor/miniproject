import { Role } from "@prisma/client";

export interface IUserReqParam {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
}

declare global {
  namespace Express {
    export interface Request {
      user?: IUserReqParam;
    }
  }
}
