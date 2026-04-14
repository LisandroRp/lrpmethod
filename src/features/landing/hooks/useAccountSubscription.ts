"use client";

import { useEffect, useState } from "react";

type PlanCode = "basic" | "intermediate" | "premium";

type AccountResponse = {
  ok: boolean;
  subscription?: {
    planCode: PlanCode;
  } | null;
  onboardingSubmitted?: boolean;
};

export function useAccountSubscription() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasActivePlan, setHasActivePlan] = useState(false);
  const [activePlanCode, setActivePlanCode] = useState<PlanCode | null>(null);
  const [onboardingSubmitted, setOnboardingSubmitted] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadAccountSubscription() {
      setIsLoading(true);
      try {
        const response = await fetch("/api/auth/account", { method: "GET" });
        if (!response.ok) {
          if (!isMounted) return;
          setHasActivePlan(false);
          setActivePlanCode(null);
          return;
        }

        const payload = (await response.json()) as AccountResponse;
        const planCode = payload.subscription?.planCode ?? null;
        if (!isMounted) return;
        setActivePlanCode(planCode);
        setHasActivePlan(Boolean(planCode));
        setOnboardingSubmitted(Boolean(payload.onboardingSubmitted));
      } catch {
        if (!isMounted) return;
        setHasActivePlan(false);
        setActivePlanCode(null);
        setOnboardingSubmitted(false);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadAccountSubscription();
    return () => {
      isMounted = false;
    };
  }, []);

  return {
    isLoading,
    hasActivePlan,
    activePlanCode,
    onboardingSubmitted
  };
}
