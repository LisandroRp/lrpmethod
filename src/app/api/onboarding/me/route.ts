import { NextResponse } from "next/server";

import { getOnboardingByUserId } from "@/lib/server/onboarding-admin";
import { getCurrentAuthenticatedUser } from "@/lib/server/supabase-auth";

export async function GET() {
  const user = await getCurrentAuthenticatedUser();
  if (!user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const onboarding = await getOnboardingByUserId(user.id);
  return NextResponse.json({
    ok: true,
    onboarding
  });
}
