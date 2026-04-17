"use client";

import Link from "next/link";
import { HiOutlineDocumentText } from "react-icons/hi2";
import { FaWhatsapp } from "react-icons/fa";

import { useModal } from "@/features/contexts/ModalContext";
import { LandingContent } from "@/features/landing/i18n/types";

type ActivePlanPromptProps = {
  content: LandingContent;
};

export function ActivePlanPrompt({ content }: ActivePlanPromptProps) {
  const { showOnboardingBubble } = useModal();
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() ?? "";
  const whatsappText = process.env.NEXT_PUBLIC_WHATSAPP_TEXT?.trim() ?? "Hola! Quiero mas info sobre LRP Method.";
  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(whatsappText)}`
    : "";

  return (
    <div className="fixed right-4 bottom-4 z-20 flex flex-col items-end gap-3 sm:right-6 sm:bottom-6">
      {showOnboardingBubble ? (
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
  );
}
