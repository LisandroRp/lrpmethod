"use client";

import { useAccount } from "@/features/contexts/AccountContext";

export function useAccountSubscription() {
  const { isLoading, activePlanCode, onboardingSubmitted } = useAccount();

  return {
    isLoading,
    hasActivePlan: Boolean(activePlanCode),
    activePlanCode,
    onboardingSubmitted
  };
}
