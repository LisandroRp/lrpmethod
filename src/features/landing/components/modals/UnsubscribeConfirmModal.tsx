"use client";

import { useState } from "react";

import { useModal } from "@/features/contexts/ModalContext";
import { ActionModal } from "@/features/landing/components/ActionModal";
import { LandingContent } from "@/features/landing/i18n/types";

export type UnsubscribeRequest = {
  id: number;
  planName: string;
  onConfirm: () => Promise<void> | void;
};

type UnsubscribeConfirmModalProps = {
  content: LandingContent;
};

export function UnsubscribeConfirmModal({ content }: UnsubscribeConfirmModalProps) {
  const { unsubscribeRequest: request, closeUnsubscribeModal } = useModal();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!request) {
    return null;
  }

  async function handleConfirm() {
    if (!request) {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await request.onConfirm();
      closeUnsubscribeModal();
    } catch {
      setErrorMessage(content.auth.cancelSubscriptionErrorLabel);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ActionModal
      isOpen={Boolean(request)}
      title={content.auth.cancelSubscriptionConfirmTitle}
      description={
        <>
          {content.auth.cancelSubscriptionConfirmTextBeforePlan} <span className="text-accent font-semibold">{request.planName}</span>
          {content.auth.cancelSubscriptionConfirmTextAfterPlan}
        </>
      }
      errorMessage={errorMessage}
      secondaryLabel={content.auth.cancelSubscriptionConfirmCancelLabel}
      onSecondary={closeUnsubscribeModal}
      secondaryDisabled={isSubmitting}
      primaryLabel={isSubmitting ? content.auth.cancelSubscriptionLoadingLabel : content.auth.cancelSubscriptionLabel}
      primaryLoading={isSubmitting}
      onPrimary={() => {
        void handleConfirm();
      }}
    />
  );
}
