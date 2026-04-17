"use client";

import { ReactNode } from "react";

import { AccountProvider } from "@/features/contexts/AccountContext";
import { LandingContent } from "@/features/landing/i18n/types";
import { ModalProvider } from "@/features/contexts/ModalContext";

type AppProvidersProps = {
  children: ReactNode;
  content: LandingContent;
};

export function AppProviders({ children, content }: AppProvidersProps) {
  return (
    <AccountProvider>
      <ModalProvider content={content}>{children}</ModalProvider>
    </AccountProvider>
  );
}
