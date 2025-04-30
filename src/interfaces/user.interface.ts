export interface IRegisterParam {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: "customer" | "organizer";
}

export interface ILoginParam {
  email: string;
  password: string;
}

// Define and export the User interface
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  profilePicture?: string;
  isVerified: boolean;
}
