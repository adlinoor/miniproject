"use client";

import { useAppDispatch, useAppSelector } from "@/lib/redux/hook";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/redux/features/authSlice";

const menus = [
  {
    label: "Dashboard",
    path: "/dashboard",
  },
];

export default function Navbar() {
  const auth = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const onMenuItemClick = (path: string) => () => {
    router.push(path);
  };
  return (
    <div className="flex flex-row h-[140px] p-10 justify-between">
      <div>
        {menus.map((menu, idx) => (
          <div
            key={idx}
            className="flex flex-row gap-4 cursor-pointer hover:bg-gray-600 p-4 rounded-md"
            onClick={onMenuItemClick(menu.path)}
          >
            {menu.label}
          </div>
        ))}
      </div>
      <div>
        {auth.isLogin ? (
          <button onClick={() => dispatch(logout())}>Logout</button>
        ) : (
          <div className="flex flex-row gap-5">
            <button onClick={() => router.push("/login")}>Login</button>
            <button onClick={() => router.push("/register")}>Register</button>
          </div>
        )}
      </div>
    </div>
  );
}
