"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

import { LoadingButton } from "@/components/composed/LoadingButton";
import { useAccount } from "@/features/contexts/AccountContext";
import { ActionModal } from "@/features/landing/components/ActionModal";
import { AuthModal } from "@/features/landing/components/AuthModal";
import { SectionContainer } from "@/features/landing/components/SectionContainer";
import { LandingContent, PlanTier } from "@/features/landing/i18n/types";

type PricingSectionProps = {
  content: LandingContent;
};

function subscribeToUrlChanges(onStoreChange: () => void) {
  window.addEventListener("popstate", onStoreChange);
  window.addEventListener("lrp-url-change", onStoreChange);

  return () => {
    window.removeEventListener("popstate", onStoreChange);
    window.removeEventListener("lrp-url-change", onStoreChange);
  };
}

function getUrlSearchSnapshot() {
  return window.location.search;
}

function getServerUrlSearchSnapshot() {
  return "";
}

function isPlanCode(value: string | null): value is PlanTier["code"] {
  return value === "basic" || value === "intermediate" || value === "premium";
}

export function PricingSection({ content }: PricingSectionProps) {
  const { user, activePlanCode, isLoading: isAccountLoading, refreshAccount } = useAccount();
  const urlSearch = useSyncExternalStore(subscribeToUrlChanges, getUrlSearchSnapshot, getServerUrlSearchSnapshot);
  const [checkoutLoadingPlan, setCheckoutLoadingPlan] = useState<PlanTier["code"] | null>(null);
  const [isAlreadySubscribedModalOpen, setIsAlreadySubscribedModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<PlanTier["code"] | null>(null);
  const [checkoutErrorMessage, setCheckoutErrorMessage] = useState<string | null>(null);

  const urlState = useMemo(() => {
    const params = new URLSearchParams(urlSearch);
    const plan = params.get("plan");

    return {
      shouldOpenAuth: params.get("auth") === "1",
      pendingPlan: isPlanCode(plan) ? plan : null,
      hasCheckoutError: Boolean(params.get("checkout_error"))
    };
  }, [urlSearch]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shouldOpenAuth = params.get("auth") === "1";
    const hasCheckoutError = Boolean(params.get("checkout_error"));

    if (!shouldOpenAuth && !params.get("plan") && !hasCheckoutError) {
      return;
    }

    params.delete("auth");
    params.delete("plan");
    params.delete("checkout_error");
    const nextQuery = params.toString();
    const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}${window.location.hash}`;
    window.history.replaceState(null, "", nextUrl);
    window.dispatchEvent(new Event("lrp-url-change"));
  }, [urlSearch]);

  const effectivePendingPlan = pendingPlan ?? urlState.pendingPlan;
  const visibleCheckoutErrorMessage = checkoutErrorMessage ?? (urlState.hasCheckoutError ? content.pricing.checkoutErrorMessage : null);
  const shouldShowAuthModal = isAuthModalOpen || urlState.shouldOpenAuth;

  const checkoutMessage = useMemo(() => {
    if (!effectivePendingPlan) {
      return null;
    }

    return content.auth.requiredForCheckoutMessage;
  }, [content.auth.requiredForCheckoutMessage, effectivePendingPlan]);

  const planNameByCode = useMemo(
    () =>
      content.pricing.plans.reduce<Record<PlanTier["code"], string>>((acc, plan) => {
        acc[plan.code] = plan.name;
        return acc;
      }, { basic: "", intermediate: "", premium: "" }),
    [content.pricing.plans]
  );

  function goToCheckout(planCode: PlanTier["code"]) {
    setCheckoutErrorMessage(null);
    setCheckoutLoadingPlan(planCode);
    window.location.assign(`/api/mercadopago/subscription/start?plan=${planCode}`);
  }

  function handlePlanClick(planCode: PlanTier["code"]) {
    if (activePlanCode && activePlanCode !== planCode) {
      setIsAlreadySubscribedModalOpen(true);
      return;
    }

    if (user?.id) {
      goToCheckout(planCode);
      return;
    }

    setPendingPlan(planCode);
    setIsAuthModalOpen(true);
  }

  function handleAuthenticated() {
    setIsAuthModalOpen(false);
    void refreshAccount();

    if (effectivePendingPlan) {
      goToCheckout(effectivePendingPlan);
    }
  }

  return (
    <section id="plans" className="bg-surface section-space">
      <SectionContainer>
        <div className="max-w-2xl">
          <p className="section-kicker">{content.pricing.kicker}</p>
          <h2 className="section-title">{content.pricing.title}</h2>
          {visibleCheckoutErrorMessage ? <p className="text-accent mt-3 text-sm">{visibleCheckoutErrorMessage}</p> : null}
        </div>

        <div className="mt-8 grid gap-4 sm:gap-6 md:grid-cols-3">
          {content.pricing.plans.map((plan) => {
            const isActivePlan = activePlanCode === plan.code;
            const isPremiumComingSoon = plan.code === "premium";
            const isCurrentCheckout = checkoutLoadingPlan === plan.code;
            const isDisabled = isAccountLoading || isActivePlan || isPremiumComingSoon || checkoutLoadingPlan !== null;
            const buttonClassName = isActivePlan
              ? "btn-secondary btn-static mt-6 block w-full text-center"
              : "btn-primary mt-6 block w-full text-center";
            const buttonLabel = isActivePlan ? content.pricing.activePlanCtaLabel : plan.ctaLabel;

            return (
              <article
                key={plan.name}
                className={plan.highlighted ? "card card-highlight relative flex h-full flex-col" : "card relative flex h-full flex-col"}
              >
                {isPremiumComingSoon ? (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-black/55 pointer-events-none">
                    <p
                      className="text-accent rotate-[-16deg] rounded-full border-2 px-6 py-2 text-3xl font-bold tracking-wide sm:px-8 sm:py-3 sm:text-4xl"
                      style={{ borderColor: "var(--color-accent)", backgroundColor: "color-mix(in oklch, var(--color-canvas) 82%, transparent)" }}
                    >
                      {content.pricing.premiumComingSoonLabel}
                    </p>
                  </div>
                ) : null}
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

                {isActivePlan ? (
                  <button type="button" className={buttonClassName} disabled={isDisabled} aria-disabled={isDisabled}>
                    {buttonLabel}
                  </button>
                ) : (
                  <LoadingButton
                    type="button"
                    className={buttonClassName}
                    onClick={() => handlePlanClick(plan.code)}
                    disabled={isDisabled}
                    isLoading={isCurrentCheckout}
                    aria-disabled={isDisabled}
                  >
                    {buttonLabel}
                  </LoadingButton>
                )}
              </article>
            );
          })}
        </div>
      </SectionContainer>

      <AuthModal
        content={content.auth}
        isOpen={shouldShowAuthModal}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthenticated={handleAuthenticated}
        checkoutMessage={checkoutMessage}
      />

      <ActionModal
        isOpen={isAlreadySubscribedModalOpen}
        title={content.pricing.alreadySubscribedModalTitle}
        description={
          <>
            {content.pricing.alreadySubscribedModalTextBeforePlan}{" "}
            <span className="text-accent font-semibold">{activePlanCode ? planNameByCode[activePlanCode] : ""}</span>
            {content.pricing.alreadySubscribedModalTextAfterPlan}
          </>
        }
        primaryLabel={content.pricing.alreadySubscribedModalOkLabel}
        onPrimary={() => setIsAlreadySubscribedModalOpen(false)}
        centerPrimaryButton
      />
    </section>
  );
}
