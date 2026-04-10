import { NextRequest, NextResponse } from "next/server";

import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, signUpWithEmailPassword } from "@/lib/server/supabase-auth";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

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
      fullName?: string;
      email?: string;
      password?: string;
    };

    const fullName = (body.fullName ?? "").trim();
    const email = normalizeEmail(body.email ?? "");
    const password = (body.password ?? "").trim();

    if (!fullName || !email || !password) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }

    const signup = await signUpWithEmailPassword({ fullName, email, password });
    const response = NextResponse.json({
      ok: true,
      needsEmailVerification: !signup.session
    });

    if (signup.session) {
      const cookieDomain = getCookieDomain(request.nextUrl.hostname);
      setSessionCookies(response, signup.session.access_token, signup.session.refresh_token, cookieDomain);
    }

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
