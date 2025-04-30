import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { IUser } from "./interfaces/user.interface";
import { jwtDecode } from "jwt-decode";

const eoRoutes = ["/dashboard"];

export default async function middleware(req: NextRequest) {
  try {
    const cookieStore = await cookies();

    const eoOnly = eoRoutes.some((path) =>
      req.nextUrl.pathname.startsWith(path)
    );

    const token = cookieStore.get("access_token")?.value || "";
    if (eoOnly && !token)
      return NextResponse.redirect(new URL("/login", req.nextUrl));

    const user: IUser = jwtDecode(token);

    if (eoOnly && user.role != "event_organizer")
      return NextResponse.redirect(new URL("/", req.nextUrl));
  } catch (err) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }
}

export const config = {
    matcher: ["/dashboard/:path*"]
}
