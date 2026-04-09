import { NextResponse } from "next/server";

import { cancelSubscriptionById, findCurrentActiveSubscriptionForCancellation } from "@/lib/server/supabase-admin";
import { getCurrentAuthenticatedUser } from "@/lib/server/supabase-auth";

type MercadoPagoPreapprovalResponse = {
  status?: string;
};

async function cancelMercadoPagoPreapprovalIfAvailable(preapprovalId: string | null) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken || !preapprovalId) {
    return;
  }

  const response = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      status: "cancelled"
    }),
    cache: "no-store"
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Mercado Pago cancel failed (${response.status}): ${errorBody}`);
  }

  const payload = (await response.json()) as MercadoPagoPreapprovalResponse;
  if (payload.status && payload.status !== "cancelled") {
    throw new Error(`Mercado Pago cancel returned unexpected status: ${payload.status}`);
  }
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
