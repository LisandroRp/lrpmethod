"use client";

import { ReactNode } from "react";

import { LoadingButton } from "@/components/composed/LoadingButton";

type ActionModalProps = {
  isOpen: boolean;
  title: string;
  description: ReactNode;
  errorMessage?: string | null;
  primaryLabel: string;
  onPrimary: () => void;
  primaryLoading?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
  secondaryDisabled?: boolean;
};

export function ActionModal({
  isOpen,
  title,
  description,
  errorMessage,
  primaryLabel,
  onPrimary,
  primaryLoading = false,
  secondaryLabel,
  onSecondary,
  secondaryDisabled = false
}: ActionModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/65 p-4">
      <div className="bg-surface border-subtle w-full max-w-md rounded-2xl border p-5 sm:p-6">
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="text-muted mt-2 text-sm sm:text-base">{description}</p>
        {errorMessage ? <p className="text-accent mt-3 text-sm">{errorMessage}</p> : null}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          {secondaryLabel && onSecondary ? (
            <button type="button" onClick={onSecondary} className="btn-secondary inline-block w-full text-center" disabled={secondaryDisabled}>
              {secondaryLabel}
            </button>
          ) : null}
          <LoadingButton type="button" isLoading={primaryLoading} className="btn-primary inline-block w-full text-center" onClick={onPrimary}>
            {primaryLabel}
          </LoadingButton>
        </div>
      </div>
    </div>
  );
}
