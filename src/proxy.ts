import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

const COOKIE_NAME = "reviewdle_uid";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 2;

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const existing = request.cookies.get(COOKIE_NAME);

  if (!existing) {
    response.cookies.set(COOKIE_NAME, uuidv4(), {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
