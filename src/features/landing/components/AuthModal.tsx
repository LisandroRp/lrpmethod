"use client";

import { FormEvent, useState } from "react";

import { LoadingButton } from "@/components/composed/LoadingButton";
import { LandingContent } from "@/features/landing/i18n/types";

type AuthModalProps = {
  content: LandingContent["auth"];
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: () => void;
  checkoutMessage?: string | null;
};

type Mode = "login" | "signup";

function resolveAuthErrorMessage(rawMessage: string, content: LandingContent["auth"]) {
  const lower = rawMessage.toLowerCase();

  if (lower.includes("email_not_confirmed") || lower.includes("email not confirmed")) {
    return content.emailNotConfirmedMessage;
  }

  const supabaseJsonMatch = rawMessage.match(/:\s*(\{.*\})$/);
  if (supabaseJsonMatch?.[1]) {
    try {
      const parsed = JSON.parse(supabaseJsonMatch[1]) as { error_code?: string; msg?: string };
      const errorCode = parsed.error_code?.toLowerCase();
      const msg = parsed.msg?.trim();
      const msgLower = msg?.toLowerCase() ?? "";

      if (errorCode === "invalid_credentials" || msgLower.includes("invalid login credentials")) {
        return content.invalidCredentialsMessage;
      }

      if (msg) {
        return msg;
      }
    } catch {
      // Ignore parse error and fallback to default handling.
    }
  }

  if (lower.includes("invalid login credentials") || lower.includes("invalid_credentials")) {
    return content.invalidCredentialsMessage;
  }

  return rawMessage;
}

export function AuthModal({ content, isOpen, onClose, onAuthenticated, checkoutMessage }: AuthModalProps) {
  const [mode, setMode] = useState<Mode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);
    setIsSubmitting(true);

    try {
      if (mode === "signup") {
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName,
            email,
            password
          })
        });
        const payload = (await response.json()) as { ok: boolean; needsEmailVerification?: boolean; error?: string };

        if (!response.ok || !payload.ok) {
          throw new Error(payload.error ?? content.genericError);
        }

        if (payload.needsEmailVerification) {
          setInfoMessage(content.verifyEmailMessage);
          setMode("login");
          return;
        }

        onAuthenticated();
        return;
      }

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password
        })
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? content.genericError);
      }

      onAuthenticated();
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : content.genericError;
      const message = resolveAuthErrorMessage(rawMessage, content);
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/65 p-4">
      <div className="bg-surface border-subtle w-full max-w-md rounded-2xl border p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold">{content.modalTitle}</h3>
            <p className="text-muted mt-1 text-sm">{content.modalSubtitle}</p>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label={content.closeLabel}>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {checkoutMessage ? <p className="text-accent mt-4 text-sm font-medium">{checkoutMessage}</p> : null}
        {infoMessage ? <p className="text-accent mt-4 text-sm">{infoMessage}</p> : null}
        {errorMessage ? <p className="text-accent mt-4 text-sm">{errorMessage}</p> : null}

        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          {mode === "signup" ? (
            <label className="block">
              <span className="text-muted mb-1 block text-xs">{content.nameLabel}</span>
              <input
                required
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="bg-canvas border-subtle w-full rounded-lg border px-3 py-2 text-sm"
              />
            </label>
          ) : null}

          <label className="block">
            <span className="text-muted mb-1 block text-xs">{content.emailLabel}</span>
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="bg-canvas border-subtle w-full rounded-lg border px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="text-muted mb-1 block text-xs">{content.passwordLabel}</span>
            <input
              required
              type="password"
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="bg-canvas border-subtle w-full rounded-lg border px-3 py-2 text-sm"
            />
          </label>

          <LoadingButton
            type="submit"
            isLoading={isSubmitting}
            className="btn-primary mt-2 inline-flex w-full cursor-pointer items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-75"
          >
            {mode === "signup" ? content.signupCta : content.loginCta}
          </LoadingButton>
        </form>

        <button
          type="button"
          className="header-link mt-4 cursor-pointer text-xs"
          onClick={() => {
            setMode((current) => (current === "login" ? "signup" : "login"));
            setErrorMessage(null);
            setInfoMessage(null);
          }}
        >
          {mode === "login" ? content.switchToSignup : content.switchToLogin}
        </button>
      </div>
    </div>
  );
}
