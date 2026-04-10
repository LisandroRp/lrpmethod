import { NextRequest, NextResponse } from "next/server";

import { parseCheckoutReference } from "@/lib/server/payment-reference";
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

type MercadoPagoPreapprovalDetails = {
  id: string;
  status?: string;
  external_reference?: string | null;
  reason?: string | null;
  payer_email?: string | null;
  date_created?: string | null;
  auto_recurring?: {
    transaction_amount?: number;
    currency_id?: string;
  };
};

type NormalizedPaymentData = {
  sourceId: string;
  sourceKind: "payment" | "preapproval";
  status: string | null;
  externalReference: string | null;
  payerEmail: string | null;
  amountArs: number | null;
  currency: string | null;
  approvedAt: string | null;
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

function isPaymentEvent(eventType: string) {
  const normalized = eventType.toLowerCase();
  return normalized === "payment" || normalized.includes("payment");
}

function isPreapprovalEvent(eventType: string) {
  const normalized = eventType.toLowerCase();
  return normalized.includes("preapproval") || normalized.includes("subscription");
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
    return null;
  }

  return (await response.json()) as MercadoPagoPaymentDetails;
}

async function fetchMercadoPagoPreapproval(preapprovalId: string): Promise<MercadoPagoPreapprovalDetails | null> {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!accessToken) {
    return null;
  }

  const response = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    cache: "no-store"
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as MercadoPagoPreapprovalDetails;
}

async function resolveNormalizedPaymentData(eventType: string, externalId: string): Promise<NormalizedPaymentData | null> {
  if (isPaymentEvent(eventType)) {
    const payment = await fetchMercadoPagoPayment(externalId);
    if (!payment) {
      return null;
    }

    return {
      sourceId: String(payment.id),
      sourceKind: "payment",
      status: payment.status ?? null,
      externalReference: payment.external_reference ?? null,
      payerEmail: payment.payer?.email?.trim().toLowerCase() ?? null,
      amountArs: payment.transaction_amount ? Math.round(payment.transaction_amount) : null,
      currency: payment.currency_id ?? "ARS",
      approvedAt: payment.date_approved ?? null
    };
  }

  if (isPreapprovalEvent(eventType)) {
    const preapproval = await fetchMercadoPagoPreapproval(externalId);
    if (!preapproval) {
      return null;
    }

    return {
      sourceId: preapproval.id,
      sourceKind: "preapproval",
      status: preapproval.status ?? null,
      externalReference: preapproval.external_reference ?? null,
      payerEmail: preapproval.payer_email?.trim().toLowerCase() ?? null,
      amountArs: preapproval.auto_recurring?.transaction_amount ? Math.round(preapproval.auto_recurring.transaction_amount) : null,
      currency: preapproval.auto_recurring?.currency_id ?? "ARS",
      approvedAt: preapproval.date_created ?? null
    };
  }

  return null;
}

function isApprovedStatus(sourceKind: "payment" | "preapproval", status: string | null) {
  if (!status) {
    return false;
  }

  if (sourceKind === "payment") {
    return status === "approved";
  }

  return status === "authorized";
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

    if (!externalId) {
      return NextResponse.json({ ok: true, processed: false, reason: "Missing resource id" });
    }

    const normalized = await resolveNormalizedPaymentData(eventType, externalId);
    if (!normalized) {
      return NextResponse.json({
        ok: true,
        processed: false,
        reason: `Unsupported event, missing access token, or resource not found for ${eventType}:${externalId}`
      });
    }

    if (!isApprovedStatus(normalized.sourceKind, normalized.status)) {
      return NextResponse.json({ ok: true, processed: false, reason: `Status ${normalized.status ?? "unknown"} not approved` });
    }

    const parsedReference = parseCheckoutReference(normalized.externalReference);
    const userIdFromReference = parsedReference.userId;
    const planCodeFromReference = parsedReference.planCode;
    const planCode = planCodeFromReference ?? inferPlanCode(normalized.externalReference, normalized.amountArs);

    let userId = userIdFromReference;
    if (!userId && normalized.payerEmail) {
      userId = await findProfileIdByEmail(normalized.payerEmail);
    }

    if (!userId || !planCode || !normalized.amountArs) {
      return NextResponse.json({
        ok: true,
        processed: false,
        reason: "Missing user mapping, plan code, or amount"
      });
    }

    const subscriptionIdentity =
      normalized.sourceKind === "payment" ? normalized.sourceId : `preapproval:${normalized.sourceId}`;

    await upsertRow(
      "subscriptions",
      {
        user_id: userId,
        plan_code: planCode,
        status: "active",
        amount_ars: normalized.amountArs,
        currency: normalized.currency ?? "ARS",
        mercadopago_payment_id: subscriptionIdentity,
        starts_at: normalized.approvedAt ?? new Date().toISOString(),
        metadata: {
          source_kind: normalized.sourceKind,
          external_reference: normalized.externalReference ?? null,
          payer_email: normalized.payerEmail ?? null,
          preapproval_id: normalized.sourceKind === "preapproval" ? normalized.sourceId : null
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

export async function GET() {
  return NextResponse.json({ ok: true, message: "Mercado Pago webhook endpoint online" });
}
