import { Role } from "@prisma/client";

export interface IRegisterParam {
  referralCode: any;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: Role;
}

export interface ILoginParam {
  email: string;
  password: string;
}

export interface UserPayload {
  id: number;
  email: string;
  role: "CUSTOMER" | "ORGANIZER";
  first_name: string;
  last_name: string;
}
