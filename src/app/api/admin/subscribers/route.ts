import { NextRequest, NextResponse } from "next/server";

import { getCurrentAuthenticatedUser } from "@/lib/server/supabase-auth";
import { isUserAdmin, listSubscribers } from "@/lib/server/supabase-admin";

export async function GET(request: NextRequest) {
  const user = await getCurrentAuthenticatedUser();
  if (!user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const admin = await isUserAdmin(user.id);
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const status = request.nextUrl.searchParams.get("status") ?? "all";
  const plan = request.nextUrl.searchParams.get("plan") ?? "all";
  const q = request.nextUrl.searchParams.get("q") ?? "";

  const rows = await listSubscribers({
    status: status as "all" | "active" | "pending" | "canceled",
    plan: plan as "all" | "basic" | "intermediate" | "premium",
    q
  });

  return NextResponse.json({
    ok: true,
    count: rows.length,
    rows
  });
}
