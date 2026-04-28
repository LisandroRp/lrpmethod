import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  ACCESS_TOKEN_COOKIE,
  getCurrentAuthenticatedUser,
  signInWithEmailPassword,
  updatePasswordWithAccessToken
} from "@/lib/server/supabase-auth";

export async function POST(request: Request) {
  try {
    const user = await getCurrentAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
    }

    const body = (await request.json()) as {
      currentPassword?: string;
      newPassword?: string;
    };

    const currentPassword = (body.currentPassword ?? "").trim();
    const newPassword = (body.newPassword ?? "").trim();

    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return NextResponse.json({ ok: false, error: "Invalid password payload" }, { status: 400 });
    }

    if (!user.email) {
      return NextResponse.json({ ok: false, error: "No email associated with account" }, { status: 400 });
    }

    try {
      await signInWithEmailPassword({
        email: user.email,
        password: currentPassword
      });
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid current password" }, { status: 401 });
    }

    const cookieStore = await cookies();
    const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value?.trim() ?? "";

    if (!accessToken) {
      return NextResponse.json({ ok: false, error: "Missing session" }, { status: 401 });
    }

    await updatePasswordWithAccessToken({
      accessToken,
      password: newPassword
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
