"use client";
import { useEffect } from "react";
import { useAppDispatch } from "@/lib/redux/hook";
import { login } from "@/lib/redux/features/authSlice";
import { jwtDecode } from "jwt-decode";
import { getCookie } from "cookies-next";

import { IUser } from "@/interfaces/user.interface";

export default function AuthProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const dispatch = useAppDispatch();

  const handleRefresh = async () => {
    const access_token = (await getCookie("access_token")) || "";

    if (access_token) {
      const user: IUser = jwtDecode(access_token);
      dispatch(login({ user }));
    }
  };
  useEffect(() => {
    handleRefresh;
  }, []);
  return <>{children}</>;
}
