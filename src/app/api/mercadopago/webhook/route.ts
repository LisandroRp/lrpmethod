import { NextRequest, NextResponse } from "next/server";

import { findProfileIdByEmail, insertRow, upsertRow } from "@/lib/server/supabase-admin";

type MercadoPagoWebhookPayload = {
  action?: string;
  type?: string;
  topic?: string;
  id?: number | string;
  data?: {
    id?: number | string;
  };
};

type MercadoPagoPaymentDetails = {
  id: number;
  status?: string;
  transaction_amount?: number;
  currency_id?: string;
  external_reference?: string | null;
  date_approved?: string | null;
  payer?: {
    email?: string;
  };
};

function inferPlanCode(externalReference?: string | null, amount?: number | null) {
  const normalizedReference = (externalReference ?? "").toLowerCase();

  if (normalizedReference.includes("basic")) {
    return "basic";
  }

  if (normalizedReference.includes("intermediate")) {
    return "intermediate";
  }

  if (normalizedReference.includes("premium")) {
    return "premium";
  }

  if (amount === 19900) {
    return "basic";
  }

  if (amount === 33500) {
    return "intermediate";
  }

  if (amount === 59970) {
    return "premium";
  }

  return null;
}

async function fetchMercadoPagoPayment(paymentId: string): Promise<MercadoPagoPaymentDetails | null> {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!accessToken) {
    return null;
  }

  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Mercado Pago fetch failed (${response.status}): ${errorBody}`);
  }

  return (await response.json()) as MercadoPagoPaymentDetails;
}

export async function POST(request: NextRequest) {
  try {
    const configuredToken = process.env.MP_WEBHOOK_TOKEN;
    const requestToken = request.nextUrl.searchParams.get("token");

    if (configuredToken && requestToken !== configuredToken) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const payload = (await request.json()) as MercadoPagoWebhookPayload;
    const queryType = request.nextUrl.searchParams.get("type") ?? request.nextUrl.searchParams.get("topic");
    const eventType = payload.type ?? payload.topic ?? queryType ?? payload.action ?? "unknown";
    const externalIdValue = payload.data?.id ?? payload.id ?? null;
    const externalId = externalIdValue === null ? null : String(externalIdValue);

    await insertRow("payment_events", {
      provider: "mercadopago",
      event_type: eventType,
      external_id: externalId,
      payload
    });

    const isPaymentEvent =
      eventType.toLowerCase() === "payment" || eventType.toLowerCase().includes("payment");

    if (!isPaymentEvent || !externalId) {
      return NextResponse.json({ ok: true, processed: false });
    }

    const payment = await fetchMercadoPagoPayment(externalId);
    if (!payment) {
      return NextResponse.json({ ok: true, processed: false, reason: "MERCADOPAGO_ACCESS_TOKEN not configured" });
    }

    if (payment.status !== "approved") {
      return NextResponse.json({ ok: true, processed: false, reason: "Payment not approved" });
    }

    const email = payment.payer?.email?.trim().toLowerCase();
    const amount = payment.transaction_amount ? Math.round(payment.transaction_amount) : null;
    const planCode = inferPlanCode(payment.external_reference, amount);

    if (!email || !planCode || !amount) {
      return NextResponse.json({
        ok: true,
        processed: false,
        reason: "Missing email, plan inference, or amount"
      });
    }

    const userId = await findProfileIdByEmail(email);
    if (!userId) {
      return NextResponse.json({ ok: true, processed: false, reason: "No profile found for payment email" });
    }

    await upsertRow(
      "subscriptions",
      {
        user_id: userId,
        plan_code: planCode,
        status: "active",
        amount_ars: amount,
        currency: payment.currency_id ?? "ARS",
        mercadopago_payment_id: String(payment.id),
        starts_at: payment.date_approved ?? new Date().toISOString(),
        metadata: {
          external_reference: payment.external_reference ?? null
        }
      },
      "mercadopago_payment_id"
    );

    return NextResponse.json({ ok: true, processed: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
