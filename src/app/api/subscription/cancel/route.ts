import { NextResponse } from "next/server";

import { cancelPreapprovalById } from "@/lib/server/mercadopago-client";
import { cancelSubscriptionById, findCurrentActiveSubscriptionForCancellation } from "@/lib/server/supabase-admin";
import { getCurrentAuthenticatedUser } from "@/lib/server/supabase-auth";

async function cancelMercadoPagoPreapprovalIfAvailable(preapprovalId: string | null) {
  if (!preapprovalId) {
    return;
  }
  await cancelPreapprovalById(preapprovalId);
}

export async function POST() {
  try {
    const user = await getCurrentAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await findCurrentActiveSubscriptionForCancellation(user.id);
    if (!subscription) {
      return NextResponse.json({ ok: false, error: "No active subscription found" }, { status: 404 });
    }

    const metadata = subscription.metadata ?? {};
    const preapprovalId = typeof metadata.preapproval_id === "string" ? metadata.preapproval_id : null;
    await cancelMercadoPagoPreapprovalIfAvailable(preapprovalId);

    await cancelSubscriptionById(subscription.id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
