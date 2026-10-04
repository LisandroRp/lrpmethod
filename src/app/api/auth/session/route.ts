import { NextRequest, NextResponse } from "next/server";

import { ACCESS_TOKEN_COOKIE, getUserFromAccessToken, REFRESH_TOKEN_COOKIE } from "@/lib/server/supabase-auth";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function getCookieDomain(hostname: string) {
  if (hostname === "lrpmethod.com" || hostname === "www.lrpmethod.com") {
    return ".lrpmethod.com";
  }

  return undefined;
}

function setSessionCookies(response: NextResponse, accessToken: string, refreshToken: string, cookieDomain?: string) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
    domain: cookieDomain
  });

  response.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
    domain: cookieDomain
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      accessToken?: string;
      refreshToken?: string;
    };

    const accessToken = body.accessToken?.trim() ?? "";
    const refreshToken = body.refreshToken?.trim() ?? "";

    if (!accessToken || !refreshToken) {
      return NextResponse.json({ ok: false, error: "Missing session tokens" }, { status: 400 });
    }

    const user = await getUserFromAccessToken(accessToken);
    if (!user) {
      return NextResponse.json({ ok: false, error: "Invalid session token" }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    setSessionCookies(response, accessToken, refreshToken, getCookieDomain(request.nextUrl.hostname));
    return response;
  } catch {
    return NextResponse.json({ ok: false, error: "Could not set session" }, { status: 500 });
  }
}
