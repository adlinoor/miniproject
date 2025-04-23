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
