import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { createPendingPreapproval } from "@/lib/server/mercadopago-client";
import { insertRow } from "@/lib/server/supabase-admin";
import { getCurrentAuthenticatedUser } from "@/lib/server/supabase-auth";

type PlanCode = "basic" | "intermediate" | "premium";

function isPlanCode(value: string): value is PlanCode {
  return value === "basic" || value === "intermediate" || value === "premium";
}

function getPlanConfig(planCode: PlanCode) {
  const map: Record<
    PlanCode,
    {
      amount: number;
      reason: string;
    }
  > = {
    basic: {
      amount: 100,
      reason: "LRP Method - Basic"
    },
    intermediate: {
      amount: 33500,
      reason: "LRP Method - Intermediate"
    },
    premium: {
      amount: 59970,
      reason: "LRP Method - Premium"
    }
  };

  return map[planCode];
}

function buildSiteUrl(request: NextRequest) {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, "");
  }

  return request.nextUrl.origin.replace(/\/+$/, "");
}

function sanitizeEmail(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return normalized || null;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentAuthenticatedUser();
    if (!user?.id) {
      const loginUrl = new URL("/", request.url);
      loginUrl.searchParams.set("auth", "1");
      return NextResponse.redirect(loginUrl);
    }

    const plan = request.nextUrl.searchParams.get("plan") ?? "";
    if (!isPlanCode(plan)) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const forcedPayerEmail = sanitizeEmail(process.env.MP_FORCED_PAYER_EMAIL);
    const payerEmail = forcedPayerEmail || sanitizeEmail(user.email);
    if (!payerEmail) {
      return NextResponse.redirect(new URL("/?checkout_error=missing_payer_email", request.url));
    }

    const siteUrl = buildSiteUrl(request);
    const checkoutIntentId = crypto.randomUUID();
    const externalReference = `lrp|u:${user.id}|p:${plan}|i:${checkoutIntentId}`;
    const planConfig = getPlanConfig(plan);

    const preapproval = (await createPendingPreapproval({
      reason: planConfig.reason,
      payer_email: payerEmail,
      status: "pending",
      back_url: `${siteUrl}/onboarding`,
      external_reference: externalReference,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: planConfig.amount,
        currency_id: "ARS"
      }
    })) as {
      id?: string;
      init_point?: string;
      status?: string;
      external_reference?: string;
    };

    await insertRow("payment_events", {
      provider: "mercadopago",
      event_type: "subscription_pending_created",
      external_id: preapproval.id ?? checkoutIntentId,
      payload: {
        checkout_intent_id: checkoutIntentId,
        user_id: user.id,
        plan_code: plan,
        payer_email: payerEmail,
        payer_email_source: forcedPayerEmail ? "forced_env" : "user_email",
        preapproval_id: preapproval.id ?? null,
        preapproval_status: preapproval.status ?? null,
        external_reference: preapproval.external_reference ?? externalReference,
        init_point: preapproval.init_point ?? null
      }
    });

    const initPoint = preapproval.init_point?.trim();
    if (!initPoint) {
      return NextResponse.redirect(new URL("/?checkout_error=missing_init_point", request.url));
    }

    return NextResponse.redirect(initPoint);
  } catch (error) {
    return NextResponse.redirect(new URL("/?checkout_error=subscription_start_failed", request.url));
  }
}
