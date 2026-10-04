import { NextRequest, NextResponse } from "next/server";

import { saveProfileAvatarByUserId } from "@/lib/server/profile-avatar";
import { getCurrentAuthenticatedUser } from "@/lib/server/supabase-auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const avatar = formData.get("avatar");

    if (!(avatar instanceof File)) {
      return NextResponse.json({ ok: false, error: "Missing profile photo" }, { status: 400 });
    }

    const avatarUrl = await saveProfileAvatarByUserId(user.id, avatar);

    return NextResponse.json({
      ok: true,
      avatarUrl
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not upload profile photo";
    const status = message.includes("Invalid profile photo type") || message.includes("too large") ? 400 : 500;

    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
