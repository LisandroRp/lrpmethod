import { NextResponse } from "next/server";

import { getCurrentAuthenticatedUser } from "@/lib/server/supabase-auth";

export async function GET() {
  const user = await getCurrentAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ ok: false, user: null }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email ?? null,
      fullName: user.user_metadata?.full_name ?? null
    }
  });
}
