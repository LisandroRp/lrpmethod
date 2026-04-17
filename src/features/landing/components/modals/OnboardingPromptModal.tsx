"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";

import { useAccount } from "@/features/contexts/AccountContext";
import { useModal } from "@/features/contexts/ModalContext";
import { ActionModal } from "@/features/landing/components/ActionModal";
import { LandingContent } from "@/features/landing/i18n/types";

type OnboardingPromptModalProps = {
  content: LandingContent;
};

const DISMISS_STORAGE_KEY = "lrm_active_plan_prompt_dismissed";

export function OnboardingPromptModal({ content }: OnboardingPromptModalProps) {
  const { user, activePlanCode, onboardingSubmitted, isLoading } = useAccount();
  const pathname = usePathname();
  const lastUserIdRef = useRef<string | null>(null);
  const {
    onboardingPromptOpen,
    onboardingDismissVersion,
    openOnboardingPrompt,
    closeOnboardingPrompt,
    showOnboardingPromptBubble,
    hideOnboardingPromptBubble,
    dismissOnboardingPrompt
  } = useModal();
  const dismissStorageKey = useMemo(() => `${DISMISS_STORAGE_KEY}:${user?.id ?? "anon"}`, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      lastUserIdRef.current = null;
      return;
    }

    if (lastUserIdRef.current !== user.id) {
      window.sessionStorage.removeItem(`${DISMISS_STORAGE_KEY}:${user.id}`);
      lastUserIdRef.current = user.id;
    }
  }, [user?.id]);

  useEffect(() => {
    if (pathname !== "/") {
      closeOnboardingPrompt();
      return;
    }

    if (!user?.id || isLoading || !activePlanCode || onboardingSubmitted) {
      closeOnboardingPrompt();
      hideOnboardingPromptBubble();
      return;
    }

    const dismissed = window.sessionStorage.getItem(dismissStorageKey) === "1";
    if (dismissed) {
      closeOnboardingPrompt();
      showOnboardingPromptBubble();
      return;
    }

    openOnboardingPrompt();
    hideOnboardingPromptBubble();
  }, [
    user?.id,
    pathname,
    isLoading,
    activePlanCode,
    onboardingSubmitted,
    dismissStorageKey,
    onboardingDismissVersion,
    closeOnboardingPrompt,
    hideOnboardingPromptBubble,
    showOnboardingPromptBubble,
    openOnboardingPrompt
  ]);

  return (
    <ActionModal
      isOpen={onboardingPromptOpen}
      title={content.onboarding.title}
      description={content.onboarding.pageDescription}
      secondaryLabel={content.auth.closeLabel}
      onSecondary={() => {
        window.sessionStorage.setItem(dismissStorageKey, "1");
        dismissOnboardingPrompt();
      }}
      primaryLabel={content.onboarding.ctaLabel}
      onPrimary={() => {
        window.location.assign("/onboarding");
      }}
    />
  );
}
