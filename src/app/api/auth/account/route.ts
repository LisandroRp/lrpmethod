import { NextResponse } from "next/server";

import { hasSubmittedOnboardingAnswerByUserId } from "@/lib/server/onboarding-admin";
import { findCurrentActiveSubscriptionByUserId, findProfileById } from "@/lib/server/supabase-admin";
import { getCurrentAuthenticatedUser } from "@/lib/server/supabase-auth";

export async function GET() {
  const user = await getCurrentAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ ok: false, user: null }, { status: 401 });
  }

  let subscription: Awaited<ReturnType<typeof findCurrentActiveSubscriptionByUserId>> = null;
  let profile: Awaited<ReturnType<typeof findProfileById>> = null;
  let onboardingSubmitted = false;

  try {
    const [subscriptionResult, profileResult, onboardingResult] = await Promise.allSettled([
      findCurrentActiveSubscriptionByUserId(user.id),
      findProfileById(user.id),
      hasSubmittedOnboardingAnswerByUserId(user.id)
    ]);

    if (subscriptionResult.status === "fulfilled") {
      subscription = subscriptionResult.value;
    } else {
      console.error("[auth/account] failed to fetch subscription", subscriptionResult.reason);
    }

    if (profileResult.status === "fulfilled") {
      profile = profileResult.value;
    } else {
      console.error("[auth/account] failed to fetch profile", profileResult.reason);
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
      fullName: profile?.fullName ?? user.user_metadata?.full_name ?? null,
      avatarUrl: profile?.avatarUrl ?? null,
      isAdmin: Boolean(profile?.isAdmin)
    },
    subscription: subscription
      ? {
          planCode: subscription.plan_code
        }
      : null,
    onboardingSubmitted
  });
}
