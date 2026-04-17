import { NextResponse } from "next/server";

import { hasSubmittedOnboardingAnswerByUserId } from "@/lib/server/onboarding-admin";
import { findCurrentActiveSubscriptionByUserId, isUserAdmin } from "@/lib/server/supabase-admin";
import { getCurrentAuthenticatedUser } from "@/lib/server/supabase-auth";

export async function GET() {
  const user = await getCurrentAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ ok: false, user: null }, { status: 401 });
  }

  let subscription: Awaited<ReturnType<typeof findCurrentActiveSubscriptionByUserId>> = null;
  let admin = false;
  let onboardingSubmitted = false;

  try {
    const [subscriptionResult, adminResult, onboardingResult] = await Promise.allSettled([
      findCurrentActiveSubscriptionByUserId(user.id),
      isUserAdmin(user.id),
      hasSubmittedOnboardingAnswerByUserId(user.id)
    ]);

    if (subscriptionResult.status === "fulfilled") {
      subscription = subscriptionResult.value;
    } else {
      console.error("[auth/account] failed to fetch subscription", subscriptionResult.reason);
    }

    if (adminResult.status === "fulfilled") {
      admin = adminResult.value;
    } else {
      console.error("[auth/account] failed to fetch admin role", adminResult.reason);
    }

    if (onboardingResult.status === "fulfilled") {
      onboardingSubmitted = onboardingResult.value;
    } else {
      console.error("[auth/account] failed to fetch onboarding state", onboardingResult.reason);
    }
  } catch (error) {
    console.error("[auth/account] unexpected error", error);
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email ?? null,
      fullName: user.user_metadata?.full_name ?? null,
      isAdmin: admin
    },
    subscription: subscription
      ? {
          planCode: subscription.plan_code
        }
      : null,
    onboardingSubmitted
  });
}
