import { NextRequest, NextResponse } from "next/server";

import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, signInWithEmailPassword } from "@/lib/server/supabase-auth";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function setSessionCookies(response: NextResponse, accessToken: string, refreshToken: string) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS
  });

  response.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    const email = normalizeEmail(body.email ?? "");
    const password = (body.password ?? "").trim();

    if (!email || !password) {
      return NextResponse.json({ ok: false, error: "Missing credentials" }, { status: 400 });
    }

    const session = await signInWithEmailPassword({ email, password });
    const response = NextResponse.json({ ok: true });
    setSessionCookies(response, session.access_token, session.refresh_token);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 401 });
  }
}
