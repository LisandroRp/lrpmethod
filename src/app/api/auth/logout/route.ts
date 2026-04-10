import { NextResponse } from "next/server";

import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/server/supabase-auth";

function getCookieDomain(hostname: string) {
  if (hostname === "lrpmethod.com" || hostname === "www.lrpmethod.com") {
    return ".lrpmethod.com";
  }

  return undefined;
}

export async function POST(request: Request) {
  const response = NextResponse.json({ ok: true });
  const url = new URL(request.url);
  const cookieDomain = getCookieDomain(url.hostname);

  response.cookies.set(ACCESS_TOKEN_COOKIE, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    domain: cookieDomain
  });

  response.cookies.set(REFRESH_TOKEN_COOKIE, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    domain: cookieDomain
  });

  return response;
}
