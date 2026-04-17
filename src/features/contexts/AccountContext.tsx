"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

type PlanCode = "basic" | "intermediate" | "premium";

type AccountUser = {
  id: string;
  email: string | null;
  fullName: string | null;
  isAdmin?: boolean;
};

type AccountResponse = {
  ok: boolean;
  user?: AccountUser;
  subscription?: {
    planCode: PlanCode;
  } | null;
  onboardingSubmitted?: boolean;
};

type AccountContextValue = {
  isLoading: boolean;
  user: AccountUser | null;
  activePlanCode: PlanCode | null;
  onboardingSubmitted: boolean;
  refreshAccount: () => Promise<void>;
  clearAccount: () => void;
};

const AccountContext = createContext<AccountContextValue | null>(null);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AccountUser | null>(null);
  const [activePlanCode, setActivePlanCode] = useState<PlanCode | null>(null);
  const [onboardingSubmitted, setOnboardingSubmitted] = useState(false);

  const refreshAccount = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/account", { method: "GET", cache: "no-store" });
      if (!response.ok) {
        setUser(null);
        setActivePlanCode(null);
        setOnboardingSubmitted(false);
        return;
      }

      const payload = (await response.json()) as AccountResponse;
      if (!payload.ok || !payload.user) {
        setUser(null);
        setActivePlanCode(null);
        setOnboardingSubmitted(false);
        return;
      }

      setUser(payload.user);
      setActivePlanCode(payload.subscription?.planCode ?? null);
      setOnboardingSubmitted(Boolean(payload.onboardingSubmitted));
    } catch {
      setUser(null);
      setActivePlanCode(null);
      setOnboardingSubmitted(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearAccount = useCallback(() => {
    setUser(null);
    setActivePlanCode(null);
    setOnboardingSubmitted(false);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void refreshAccount();
  }, [refreshAccount]);

  const value = useMemo<AccountContextValue>(
    () => ({
      isLoading,
      user,
      activePlanCode,
      onboardingSubmitted,
      refreshAccount,
      clearAccount
    }),
    [isLoading, user, activePlanCode, onboardingSubmitted, refreshAccount, clearAccount]
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error("useAccount must be used within AccountProvider");
  }
  return context;
}
