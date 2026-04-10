import { NextRequest, NextResponse } from "next/server";

import { buildCheckoutReference } from "@/lib/server/payment-reference";
import { ACCESS_TOKEN_COOKIE, getUserFromAccessToken } from "@/lib/server/supabase-auth";

const PLAN_URLS: Record<"basic" | "intermediate" | "premium", string | undefined> = {
  basic: process.env.MP_CHECKOUT_BASIC_URL,
  intermediate: process.env.MP_CHECKOUT_INTERMEDIATE_URL,
  premium: process.env.MP_CHECKOUT_PREMIUM_URL
};

function isPlanCode(value: string): value is "basic" | "intermediate" | "premium" {
  return value === "basic" || value === "intermediate" || value === "premium";
}

export async function GET(request: NextRequest, context: { params: Promise<{ plan: string }> }) {
  const { plan } = await context.params;
  if (!isPlanCode(plan)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const paymentUrl = PLAN_URLS[plan];

  if (!paymentUrl) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("auth", "1");
    loginUrl.searchParams.set("plan", plan);
    return NextResponse.redirect(loginUrl);
  }

  const user = await getUserFromAccessToken(accessToken);
  if (!user) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("auth", "1");
    loginUrl.searchParams.set("plan", plan);
    return NextResponse.redirect(loginUrl);
  }

  const checkoutUrl = new URL(paymentUrl);
  checkoutUrl.searchParams.set("external_reference", buildCheckoutReference(user.id, plan));
  if (user.email) {
    checkoutUrl.searchParams.set("payer_email", user.email);
  }

  return NextResponse.redirect(checkoutUrl.toString());
}
