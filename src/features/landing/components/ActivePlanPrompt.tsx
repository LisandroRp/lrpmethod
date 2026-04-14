"use client";

import Link from "next/link";
import { useState } from "react";
import { HiOutlineDocumentText } from "react-icons/hi2";
import { FaWhatsapp } from "react-icons/fa";

import { useAccountSubscription } from "@/features/landing/hooks/useAccountSubscription";
import { LandingContent } from "@/features/landing/i18n/types";

const DISMISS_STORAGE_KEY = "lrm_active_plan_prompt_dismissed";

type ActivePlanPromptProps = {
  content: LandingContent;
};

export function ActivePlanPrompt({ content }: ActivePlanPromptProps) {
  const { hasActivePlan, onboardingSubmitted, isLoading } = useAccountSubscription();
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }
    return window.sessionStorage.getItem(DISMISS_STORAGE_KEY) === "1";
  });
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() ?? "";
  const whatsappText = process.env.NEXT_PUBLIC_WHATSAPP_TEXT?.trim() ?? "Hola! Quiero mas info sobre LRP Method.";
  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(whatsappText)}`
    : "";

  function handleDismiss() {
    window.sessionStorage.setItem(DISMISS_STORAGE_KEY, "1");
    setIsDismissed(true);
  }

  const shouldShowModal = !isLoading && hasActivePlan && !onboardingSubmitted && !isDismissed;
  const shouldShowOnboardingBubble = !isLoading && hasActivePlan && !onboardingSubmitted && isDismissed;

  return (
    <>
      {shouldShowModal ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/65 p-4">
          <div className="bg-surface border-subtle w-full max-w-md rounded-2xl border p-5 sm:p-6">
            <h3 className="text-xl font-semibold">{content.onboarding.title}</h3>
            <p className="text-muted mt-2 text-sm sm:text-base">{content.onboarding.pageDescription}</p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Link href="/onboarding" className="btn-primary inline-block w-full text-center">
                {content.onboarding.ctaLabel}
              </Link>
              <button type="button" onClick={handleDismiss} className="btn-secondary inline-block w-full text-center">
                {content.auth.closeLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="fixed right-4 bottom-4 z-20 flex flex-col items-end gap-3 sm:right-6 sm:bottom-6">
        {shouldShowOnboardingBubble ? (
          <Link
            href="/onboarding"
            className="fab-button fab-onboarding fab-bounce"
            aria-label={content.onboarding.ctaLabel}
            title={content.onboarding.ctaLabel}
          >
            <HiOutlineDocumentText className="h-5 w-5" aria-hidden="true" />
          </Link>
        ) : null}

        {whatsappHref ? (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="fab-button fab-whatsapp"
            aria-label="WhatsApp"
            title="WhatsApp"
          >
            <FaWhatsapp className="h-6 w-6" aria-hidden="true" />
          </a>
        ) : (
          <button
            type="button"
            className="fab-button fab-whatsapp"
            aria-label="WhatsApp"
            title="Set NEXT_PUBLIC_WHATSAPP_NUMBER to enable WhatsApp."
          >
            <FaWhatsapp className="h-6 w-6" aria-hidden="true" />
          </button>
        )}
      </div>
    </>
  );
}
