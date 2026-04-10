import { PlanTier } from "@/features/landing/i18n/types";
import { parseCheckoutReference } from "@/lib/server/payment-reference";
import { upsertRow } from "@/lib/server/supabase-admin";

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
  payer_email?: string | null;
  date_created?: string | null;
  auto_recurring?: {
    transaction_amount?: number;
    currency_id?: string;
  };
};

type NormalizedSource = {
  sourceId: string;
  sourceKind: "payment" | "preapproval";
  status: string | null;
  externalReference: string | null;
  payerEmail: string | null;
  amountArs: number | null;
  currency: string | null;
  approvedAt: string | null;
};

type SyncInput = {
  userId: string;
  userEmail?: string | null;
  paymentId?: string | null;
  preapprovalId?: string | null;
};

function inferPlanCode(externalReference?: string | null, amount?: number | null): PlanTier["code"] | null {
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

function isApprovedStatus(sourceKind: "payment" | "preapproval", status: string | null) {
  if (!status) {
    return false;
  }

  if (sourceKind === "payment") {
    return status === "approved";
  }

  return status === "authorized";
}

async function fetchMercadoPagoPayment(paymentId: string): Promise<NormalizedSource | null> {
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

  const payment = (await response.json()) as MercadoPagoPaymentDetails;

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

async function fetchMercadoPagoPreapproval(preapprovalId: string): Promise<NormalizedSource | null> {
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

  const preapproval = (await response.json()) as MercadoPagoPreapprovalDetails;

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

function canAssignToUser(source: NormalizedSource, userId: string, userEmail?: string | null) {
  const parsedReference = parseCheckoutReference(source.externalReference);

  if (parsedReference.userId && parsedReference.userId !== userId) {
    return false;
  }

  const normalizedUserEmail = userEmail?.trim().toLowerCase() ?? null;
  if (source.payerEmail && normalizedUserEmail && source.payerEmail !== normalizedUserEmail && !parsedReference.userId) {
    return false;
  }

  return true;
}

async function upsertActiveSubscription(userId: string, source: NormalizedSource) {
  const parsedReference = parseCheckoutReference(source.externalReference);
  const planCode = parsedReference.planCode ?? inferPlanCode(source.externalReference, source.amountArs);

  if (!planCode || !source.amountArs || !isApprovedStatus(source.sourceKind, source.status)) {
    return false;
  }

  const subscriptionIdentity = source.sourceKind === "payment" ? source.sourceId : `preapproval:${source.sourceId}`;

  await upsertRow(
    "subscriptions",
    {
      user_id: userId,
      plan_code: planCode,
      status: "active",
      amount_ars: source.amountArs,
      currency: source.currency ?? "ARS",
      mercadopago_payment_id: subscriptionIdentity,
      starts_at: source.approvedAt ?? new Date().toISOString(),
      metadata: {
        source_kind: source.sourceKind,
        external_reference: source.externalReference ?? null,
        payer_email: source.payerEmail ?? null,
        preapproval_id: source.sourceKind === "preapproval" ? source.sourceId : null
      }
    },
    "mercadopago_payment_id"
  );

  return true;
}

export async function syncMercadoPagoSubscriptionForUser(input: SyncInput) {
  const paymentId = input.paymentId?.trim() || null;
  const preapprovalId = input.preapprovalId?.trim() || null;

  if (!paymentId && !preapprovalId) {
    return { ok: false, reason: "Missing payment or preapproval id" as const };
  }

  const candidates: NormalizedSource[] = [];

  if (paymentId) {
    const payment = await fetchMercadoPagoPayment(paymentId);
    if (payment) {
      candidates.push(payment);
    }
  }

  if (preapprovalId) {
    const preapproval = await fetchMercadoPagoPreapproval(preapprovalId);
    if (preapproval) {
      candidates.push(preapproval);
    }
  }

  for (const candidate of candidates) {
    if (!canAssignToUser(candidate, input.userId, input.userEmail)) {
      continue;
    }

    const written = await upsertActiveSubscription(input.userId, candidate);
    if (written) {
      return { ok: true } as const;
    }
  }

  return { ok: false, reason: "No eligible approved resource found" as const };
}
