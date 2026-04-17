"use client";

import { createContext, ReactNode, useContext, useMemo, useState } from "react";

import { OnboardingPromptModal } from "@/features/landing/components/modals/OnboardingPromptModal";
import { UnsubscribeConfirmModal, UnsubscribeRequest } from "@/features/landing/components/modals/UnsubscribeConfirmModal";
import { LandingContent } from "@/features/landing/i18n/types";

type OpenUnsubscribeParams = {
  planName: string;
  onConfirm: () => Promise<void> | void;
};

type ModalContextValue = {
  onboardingPromptOpen: boolean;
  showOnboardingBubble: boolean;
  onboardingDismissVersion: number;
  openOnboardingPrompt: () => void;
  closeOnboardingPrompt: () => void;
  showOnboardingPromptBubble: () => void;
  hideOnboardingPromptBubble: () => void;
  dismissOnboardingPrompt: () => void;
  resetOnboardingPromptDismiss: () => void;
  unsubscribeRequest: UnsubscribeRequest | null;
  openUnsubscribeModal: (params: OpenUnsubscribeParams) => void;
  closeUnsubscribeModal: () => void;
};

const ModalContext = createContext<ModalContextValue | null>(null);

type ModalProviderProps = {
  content: LandingContent;
  children: ReactNode;
};

export function ModalProvider({ content, children }: ModalProviderProps) {
  const [onboardingPromptOpen, setOnboardingPromptOpen] = useState(false);
  const [showOnboardingBubble, setShowOnboardingBubble] = useState(false);
  const [onboardingDismissVersion, setOnboardingDismissVersion] = useState(0);
  const [unsubscribeRequest, setUnsubscribeRequest] = useState<UnsubscribeRequest | null>(null);

  function openOnboardingPrompt() {
    setOnboardingPromptOpen(true);
  }

  function closeOnboardingPrompt() {
    setOnboardingPromptOpen(false);
  }

  function showOnboardingPromptBubble() {
    setShowOnboardingBubble(true);
  }

  function hideOnboardingPromptBubble() {
    setShowOnboardingBubble(false);
  }

  function dismissOnboardingPrompt() {
    setOnboardingPromptOpen(false);
    setShowOnboardingBubble(true);
    setOnboardingDismissVersion((current) => current + 1);
  }

  function resetOnboardingPromptDismiss() {
    setOnboardingPromptOpen(false);
    setShowOnboardingBubble(false);
    setOnboardingDismissVersion((current) => current + 1);
  }

  function openUnsubscribeModal(params: OpenUnsubscribeParams) {
    setUnsubscribeRequest({
      id: Date.now(),
      planName: params.planName,
      onConfirm: params.onConfirm
    });
  }

  function closeUnsubscribeModal() {
    setUnsubscribeRequest(null);
  }

  const value = useMemo<ModalContextValue>(
    () => ({
      onboardingPromptOpen,
      showOnboardingBubble,
      onboardingDismissVersion,
      openOnboardingPrompt,
      closeOnboardingPrompt,
      showOnboardingPromptBubble,
      hideOnboardingPromptBubble,
      dismissOnboardingPrompt,
      resetOnboardingPromptDismiss,
      unsubscribeRequest,
      openUnsubscribeModal,
      closeUnsubscribeModal
    }),
    [onboardingPromptOpen, showOnboardingBubble, onboardingDismissVersion, unsubscribeRequest]
  );

  return (
    <ModalContext.Provider value={value}>
      {children}
      <OnboardingPromptModal content={content} />
      <UnsubscribeConfirmModal content={content} />
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within ModalProvider");
  }
  return context;
}
