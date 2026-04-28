"use client";

import { FormEvent, useState } from "react";
import { TbChevronDown, TbLock, TbLockOpen2 } from "react-icons/tb";

import { LoadingButton } from "@/components/composed/LoadingButton";

type ChangePasswordCopy = {
  title: string;
  description: string;
  openLabel: string;
  closeLabel: string;
  currentPasswordLabel: string;
  newPasswordLabel: string;
  confirmPasswordLabel: string;
  submitLabel: string;
  loadingLabel: string;
  successMessage: string;
  mismatchMessage: string;
  invalidCurrentPasswordMessage: string;
  genericErrorMessage: string;
};

type ChangePasswordFormProps = {
  copy: ChangePasswordCopy;
};

function resolveChangePasswordError(rawMessage: string, copy: ChangePasswordCopy) {
  const lower = rawMessage.toLowerCase();

  if (lower.includes("invalid current password") || lower.includes("invalid login credentials") || lower.includes("invalid_credentials")) {
    return copy.invalidCurrentPasswordMessage;
  }

  return copy.genericErrorMessage;
}

export function ChangePasswordForm({ copy }: ChangePasswordFormProps) {
  const formId = "change-password-form";
  const [isOpen, setIsOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const toggleLabel = isOpen ? copy.closeLabel : copy.openLabel;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (newPassword !== confirmPassword) {
      setErrorMessage(copy.mismatchMessage);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? copy.genericErrorMessage);
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccessMessage(copy.successMessage);
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : copy.genericErrorMessage;
      setErrorMessage(resolveChangePasswordError(rawMessage, copy));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="panel border-accent/30 mt-5 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">{copy.title}</h2>
          <p className="text-muted mt-1 text-sm">{copy.description}</p>
        </div>

        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={formId}
          className="btn-primary inline-flex h-9 w-32 cursor-pointer items-center self-end rounded-full px-3 text-xs font-medium shadow-sm transition-all hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
          onClick={() => {
            setIsOpen((current) => !current);
            setErrorMessage(null);
            setSuccessMessage(null);
          }}
        >
          {isOpen ? <TbLockOpen2 className="h-4 w-4 shrink-0" aria-hidden="true" /> : <TbLock className="h-4 w-4 shrink-0" aria-hidden="true" />}
          <span className="flex-1 text-center">{toggleLabel}</span>
          <TbChevronDown className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
      </div>

      {successMessage ? <p className="text-accent mt-4 text-sm">{successMessage}</p> : null}
      {errorMessage ? <p className="text-accent mt-4 text-sm">{errorMessage}</p> : null}

      {isOpen ? (
        <form id={formId} className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-muted mb-1 block text-xs">{copy.currentPasswordLabel}</span>
            <input
              required
              type="password"
              minLength={6}
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="bg-canvas border-subtle w-full rounded-lg border px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="text-muted mb-1 block text-xs">{copy.newPasswordLabel}</span>
            <input
              required
              type="password"
              minLength={6}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="bg-canvas border-subtle w-full rounded-lg border px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="text-muted mb-1 block text-xs">{copy.confirmPasswordLabel}</span>
            <input
              required
              type="password"
              minLength={6}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="bg-canvas border-subtle w-full rounded-lg border px-3 py-2 text-sm"
            />
          </label>

          <LoadingButton
            type="submit"
            isLoading={isSubmitting}
            className="btn-primary mt-2 inline-flex w-full cursor-pointer items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-75"
          >
            {isSubmitting ? copy.loadingLabel : copy.submitLabel}
          </LoadingButton>
        </form>
      ) : null}
    </section>
  );
}
