import { NextResponse } from "next/server";

import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/server/supabase-auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });

  response.cookies.set(ACCESS_TOKEN_COOKIE, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });

  response.cookies.set(REFRESH_TOKEN_COOKIE, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });

  return response;
}
