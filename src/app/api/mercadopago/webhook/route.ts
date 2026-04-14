import { NextRequest, NextResponse } from "next/server";

import { getPaymentById, getPreapprovalById } from "@/lib/server/mercadopago-client";
import { createActiveSubscriptionForUser, findSubscriptionByPreapprovalId, insertRow, updateSubscriptionById } from "@/lib/server/supabase-admin";

type MercadoPagoWebhookPayload = {
  action?: string;
  type?: string;
  topic?: string;
  id?: number | string;
  data?: {
    id?: number | string;
  };
  [key: string]: unknown;
};

function getEventType(request: NextRequest, payload: MercadoPagoWebhookPayload) {
  const queryType = request.nextUrl.searchParams.get("type") ?? request.nextUrl.searchParams.get("topic");
  return payload.type ?? payload.topic ?? queryType ?? payload.action ?? "unknown";
}

function getResourceId(payload: MercadoPagoWebhookPayload) {
  const value = payload.data?.id ?? payload.id ?? null;
  return value === null ? null : String(value);
}

function isPreapprovalEvent(eventType: string) {
  const normalized = eventType.toLowerCase();
  return normalized.includes("preapproval") || normalized.includes("subscription");
}

function isPaymentEvent(eventType: string) {
  const normalized = eventType.toLowerCase();
  return normalized === "payment" || normalized.includes("payment");
}

type PlanCode = "basic" | "intermediate" | "premium";

function parseExternalReference(
  externalReference: string | undefined
): {
  userId: string;
  planCode: PlanCode;
  intentId: string;
} | null {
  if (!externalReference) {
    return null;
  }

  const pattern = /^lrp\|u:([^|]+)\|p:(basic|intermediate|premium)\|i:([^|]+)$/;
  const match = externalReference.match(pattern);
  if (!match) {
    return null;
  }

  return {
    userId: match[1],
    planCode: match[2] as PlanCode,
    intentId: match[3]
  };
}

async function syncSubscriptionFromPreapproval(preapproval: {
  id?: string;
  status?: string;
  external_reference?: string;
  payer_email?: string;
  auto_recurring?: {
    transaction_amount?: number;
  };
}) {
  const preapprovalId = preapproval.id?.trim();
  if (!preapprovalId) {
    return { ok: false, reason: "missing_preapproval_id" } as const;
  }

  const parsedReference = parseExternalReference(preapproval.external_reference);
  if (!parsedReference) {
    return { ok: false, reason: "invalid_external_reference" } as const;
  }

  const currentSubscription = await findSubscriptionByPreapprovalId(preapprovalId);
  const status = preapproval.status ?? "unknown";

  if (status === "authorized") {
    if (currentSubscription) {
      await updateSubscriptionById(currentSubscription.id, {
        status: "active",
        metadata: {
          preapproval_id: preapprovalId,
          external_reference: preapproval.external_reference ?? null,
          payer_email: preapproval.payer_email ?? null,
          source: "webhook_subscription_preapproval"
        }
      });
      return { ok: true, reason: "updated_existing_active" } as const;
    }

    await createActiveSubscriptionForUser({
      userId: parsedReference.userId,
      planCode: parsedReference.planCode,
      preapprovalId,
      externalReference: preapproval.external_reference ?? `lrp|u:${parsedReference.userId}|p:${parsedReference.planCode}|i:${parsedReference.intentId}`,
      preapprovalPlanId: "none",
      payerEmail: preapproval.payer_email ?? "unknown",
      amount_ars: preapproval.auto_recurring?.transaction_amount ?? 0,
    });
    return { ok: true, reason: "created_new_active" } as const;
  }

  if (status === "cancelled" || status === "paused") {
    if (currentSubscription) {
      await updateSubscriptionById(currentSubscription.id, {
        status: "canceled",
        canceled_at: new Date().toISOString(),
        cancel_reason: `mercadopago_${status}`
      });
      return { ok: true, reason: "updated_existing_canceled" } as const;
    }

    return { ok: true, reason: "no_subscription_to_cancel" } as const;
  }

  return { ok: true, reason: `ignored_status_${status}` } as const;
}

export async function POST(request: NextRequest) {
  try {
    const configuredToken = process.env.MP_WEBHOOK_TOKEN?.trim();
    const requestToken = request.nextUrl.searchParams.get("token")?.trim();

    if (configuredToken && requestToken !== configuredToken) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const payload = (await request.json()) as MercadoPagoWebhookPayload;
    const eventType = getEventType(request, payload);
    const resourceId = getResourceId(payload);

    await insertRow("payment_events", {
      provider: "mercadopago",
      event_type: eventType,
      external_id: resourceId,
      payload
    });

    if (resourceId && isPaymentEvent(eventType)) {
      try {
        const payment = await getPaymentById(resourceId);

        await insertRow("payment_events", {
          provider: "mercadopago",
          event_type: "webhook_payment_response",
          external_id: resourceId,
          payload: JSON.parse(JSON.stringify(payment)) as Record<string, unknown>
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown payment fetch error";

        await insertRow("payment_events", {
          provider: "mercadopago",
          event_type: "webhook_payment_response_error",
          external_id: resourceId,
          payload: {
            resource_id: resourceId,
            message
          }
        });
      }
    }

    if (resourceId && isPreapprovalEvent(eventType)) {
      try {
        const preapproval = await getPreapprovalById(resourceId);

        const normalizedPreapproval = JSON.parse(JSON.stringify(preapproval)) as {
          id?: string;
          status?: string;
          external_reference?: string;
          payer_email?: string;
          auto_recurring?: {
            transaction_amount?: number;
          };
        };

        const syncResult = await syncSubscriptionFromPreapproval(normalizedPreapproval);

        await insertRow("payment_events", {
          provider: "mercadopago",
          event_type: "webhook_preapproval_response",
          external_id: resourceId,
          payload: {
            preapproval: normalizedPreapproval,
            sync_result: syncResult
          }
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown preapproval fetch error";

        await insertRow("payment_events", {
          provider: "mercadopago",
          event_type: "webhook_preapproval_response_error",
          external_id: resourceId,
          payload: {
            resource_id: resourceId,
            message
          }
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, message: "Mercado Pago webhook endpoint online" });
}
