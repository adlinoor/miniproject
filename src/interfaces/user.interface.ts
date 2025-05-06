import { Role } from "@prisma/client";

export interface IRegisterParam {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: Role;
}

export interface ILoginParam {
  email: string;
  password: string;
}

// Define and export the User interface
export interface IUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
  profilePicture?: string;
  isVerified: boolean;
}
