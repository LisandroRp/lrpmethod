"use client";

import { useEffect, useMemo, useState } from "react";

import { AuthModal } from "@/features/landing/components/AuthModal";
import { SectionContainer } from "@/features/landing/components/SectionContainer";
import { LandingContent, PlanTier } from "@/features/landing/i18n/types";

type PricingSectionProps = {
  content: LandingContent;
};

type AuthMeResponse = {
  ok: boolean;
  user?: {
    id: string;
  };
};

export function PricingSection({ content }: PricingSectionProps) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    const params = new URLSearchParams(window.location.search);
    return params.get("auth") === "1";
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [pendingPlan, setPendingPlan] = useState<PlanTier["code"] | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const params = new URLSearchParams(window.location.search);
    const plan = params.get("plan");
    if (plan === "basic" || plan === "intermediate" || plan === "premium") {
      return plan;
    }

    return null;
  });

  useEffect(() => {
    async function loadSession() {
      try {
        const response = await fetch("/api/auth/me", { method: "GET" });
        if (!response.ok) {
          setIsAuthenticated(false);
          return;
        }

        const payload = (await response.json()) as AuthMeResponse;
        setIsAuthenticated(Boolean(payload.ok && payload.user?.id));
      } catch {
        setIsAuthenticated(false);
      }
    }

    void loadSession();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shouldOpenAuth = params.get("auth") === "1";
    if (!shouldOpenAuth && !params.get("plan")) {
      return;
    }
    params.delete("auth");
    params.delete("plan");
    const nextQuery = params.toString();
    const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}${window.location.hash}`;
    window.history.replaceState(null, "", nextUrl);
  }, []);

  const checkoutMessage = useMemo(() => {
    if (!pendingPlan) {
      return null;
    }

    return content.auth.requiredForCheckoutMessage;
  }, [content.auth.requiredForCheckoutMessage, pendingPlan]);

  function goToCheckout(planCode: PlanTier["code"]) {
    window.location.assign(`/checkout/${planCode}`);
  }

  function handlePlanClick(planCode: PlanTier["code"]) {
    if (isAuthenticated) {
      goToCheckout(planCode);
      return;
    }

    setPendingPlan(planCode);
    setIsAuthModalOpen(true);
  }

  function handleAuthenticated() {
    setIsAuthenticated(true);
    setIsAuthModalOpen(false);

    if (pendingPlan) {
      goToCheckout(pendingPlan);
      return;
    }
  }

  return (
    <section id="plans" className="bg-surface section-space">
      <SectionContainer>
        <div className="max-w-2xl">
          <p className="section-kicker">{content.pricing.kicker}</p>
          <h2 className="section-title">{content.pricing.title}</h2>
        </div>

        <div className="mt-8 grid gap-4 sm:gap-6 md:grid-cols-3">
          {content.pricing.plans.map((plan) => (
            <article key={plan.name} className={plan.highlighted ? "card card-highlight flex h-full flex-col" : "card flex h-full flex-col"}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-xl font-semibold">{plan.name}</h3>
                {plan.highlighted ? <p className="pill shrink-0">{content.pricing.featuredLabel}</p> : null}
              </div>
              <p className="text-muted mt-1 text-sm">{plan.description}</p>
              <p className="mt-4 text-3xl font-bold">
                {plan.price}
                <span className="text-muted text-base font-medium">{plan.period}</span>
              </p>

              <ul className="mt-4 grow space-y-2 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span className="dot-accent mt-1.5" aria-hidden="true" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button type="button" className="btn-primary mt-6 block w-full text-center" onClick={() => handlePlanClick(plan.code)}>
                {plan.ctaLabel}
              </button>
            </article>
          ))}
        </div>
      </SectionContainer>

      <AuthModal
        content={content.auth}
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthenticated={handleAuthenticated}
        checkoutMessage={checkoutMessage}
      />
    </section>
  );
}
