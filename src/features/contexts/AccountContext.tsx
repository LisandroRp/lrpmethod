"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

type PlanCode = "basic" | "intermediate" | "premium";

type AccountUser = {
  id: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
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
  refreshAccount: (options?: { silent?: boolean }) => Promise<void>;
  clearAccount: () => void;
};

const AccountContext = createContext<AccountContextValue | null>(null);

function getSignupSessionFromHash() {
  if (typeof window === "undefined" || !window.location.hash.startsWith("#")) {
    return null;
  }

  const hashParams = new URLSearchParams(window.location.hash.slice(1));
  const type = hashParams.get("type")?.trim().toLowerCase() ?? "";
  const accessToken = hashParams.get("access_token")?.trim() ?? "";
  const refreshToken = hashParams.get("refresh_token")?.trim() ?? "";

  if (type !== "signup" || !accessToken || !refreshToken) {
    return null;
  }

  return {
    accessToken,
    refreshToken
  };
}

async function setSessionFromHash(accessToken: string, refreshToken: string) {
  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      accessToken,
      refreshToken
    })
  });

  return response.ok;
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AccountUser | null>(null);
  const [activePlanCode, setActivePlanCode] = useState<PlanCode | null>(null);
  const [onboardingSubmitted, setOnboardingSubmitted] = useState(false);

  const refreshAccount = useCallback(async (options?: { silent?: boolean }) => {
    const shouldSetLoading = !options?.silent;
    if (shouldSetLoading) {
      setIsLoading(true);
    }

    try {
      const response = await fetch("/api/auth/account", { method: "GET", cache: "no-store" });
      if (!response.ok) {
        setUser(null);
        setActivePlanCode(null);
        setOnboardingSubmitted(false);
        if (response.status === 401) {
          await fetch("/api/auth/logout", { method: "POST" });
        }
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
      if (shouldSetLoading) {
        setIsLoading(false);
      }
    }
  }, []);

  const clearAccount = useCallback(() => {
    setUser(null);
    setActivePlanCode(null);
    setOnboardingSubmitted(false);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    async function initializeAccount() {
      const signupSession = getSignupSessionFromHash();

      if (signupSession) {
        const wasSessionSet = await setSessionFromHash(signupSession.accessToken, signupSession.refreshToken);
        if (wasSessionSet) {
          window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
        }
      }

      await refreshAccount();
    }

    void initializeAccount();
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
