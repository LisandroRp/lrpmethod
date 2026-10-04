"use client";

import { useAccount } from "@/features/contexts/AccountContext";
import { useModal } from "@/features/contexts/ModalContext";
import { LandingContent } from "@/features/landing/i18n/types";

type ProfileSubscriptionActionsProps = {
  authContent: LandingContent["auth"];
  planName: string;
};

export function ProfileSubscriptionActions({ authContent, planName }: ProfileSubscriptionActionsProps) {
  const { openUnsubscribeModal } = useModal();
  const { refreshAccount } = useAccount();

  function handleCancelSubscription() {
    openUnsubscribeModal({
      planName,
      onConfirm: async () => {
        const response = await fetch("/api/subscription/cancel", { method: "POST" });
        const payload = (await response.json()) as { ok: boolean };
        if (!response.ok || !payload.ok) {
          throw new Error("cancel_failed");
        }
        await refreshAccount();
      }
    });
  }

  return (
    <button type="button" className="btn-secondary mt-5 inline-flex" onClick={handleCancelSubscription}>
      {authContent.cancelSubscriptionLabel}
    </button>
  );
}
