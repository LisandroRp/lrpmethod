import { NextRequest, NextResponse } from "next/server";

import { sendPasswordRecoveryEmail } from "@/lib/server/supabase-auth";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      email?: string;
    };

    const email = normalizeEmail(body.email ?? "");
    if (!email) {
      return NextResponse.json({ ok: false, error: "Missing email" }, { status: 400 });
    }

    const redirectTo = `${request.nextUrl.origin}/reset-password`;
    await sendPasswordRecoveryEmail({ email, redirectTo });

    // Always return success to avoid email enumeration.
    return NextResponse.json({ ok: true });
  } catch {
    // Keep response generic to avoid leaking account existence or provider detail.
    return NextResponse.json({ ok: true });
  }
}
