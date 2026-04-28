import { NextRequest, NextResponse } from "next/server";

import { updatePasswordWithAccessToken, verifyRecoveryToken } from "@/lib/server/supabase-auth";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      password?: string;
      accessToken?: string;
      tokenHash?: string;
    };

    const password = (body.password ?? "").trim();
    const accessTokenFromBody = (body.accessToken ?? "").trim();
    const tokenHash = (body.tokenHash ?? "").trim();

    if (!password || password.length < 6) {
      return NextResponse.json({ ok: false, error: "Invalid password" }, { status: 400 });
    }

    let accessToken = accessTokenFromBody;

    if (!accessToken && tokenHash) {
      const verification = await verifyRecoveryToken({ tokenHash });
      accessToken = verification.access_token?.trim() ?? "";
    }

    if (!accessToken) {
      return NextResponse.json({ ok: false, error: "Invalid recovery token" }, { status: 400 });
    }

    await updatePasswordWithAccessToken({ accessToken, password });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message.toLowerCase().includes("invalid token") || message.toLowerCase().includes("expired")) {
      return NextResponse.json({ ok: false, error: "Invalid recovery token" }, { status: 400 });
    }

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
