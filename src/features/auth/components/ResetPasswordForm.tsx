"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { LoadingButton } from "@/components/composed/LoadingButton";
import { LandingContent } from "@/features/landing/i18n/types";

type ResetPasswordFormProps = {
  authContent: LandingContent["auth"];
};

type RecoveryHashState = {
  accessToken: string;
  type: string;
};

function resolveResetError(message: string, authContent: LandingContent["auth"]) {
  const lower = message.toLowerCase();

  if (lower.includes("invalid recovery token") || lower.includes("invalid token") || lower.includes("expired")) {
    return authContent.resetPasswordInvalidTokenMessage;
  }

  return authContent.resetPasswordGenericError;
}

function isLikelyRecoveryToken(value: string) {
  return value.trim().length >= 20;
}

export function ResetPasswordForm({ authContent }: ResetPasswordFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [redirectDots, setRedirectDots] = useState(".");
  const [isHashReady, setIsHashReady] = useState(false);
  const [hashState, setHashState] = useState<RecoveryHashState>({ accessToken: "", type: "" });
  const [forceInvalidState, setForceInvalidState] = useState(false);

  const tokenHash = useMemo(() => searchParams.get("token_hash")?.trim() ?? "", [searchParams]);
  const queryType = useMemo(() => searchParams.get("type")?.trim().toLowerCase() ?? "", [searchParams]);

  useEffect(() => {
    const fragment = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
    const hashParams = new URLSearchParams(fragment);
    const accessToken = hashParams.get("access_token")?.trim() ?? "";
    const type = hashParams.get("type")?.trim().toLowerCase() ?? "";

    setHashState({ accessToken, type });
    setIsHashReady(true);
  }, []);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!successMessage) {
      setRedirectDots(".");
      return;
    }

    const intervalId = setInterval(() => {
      setRedirectDots((current) => {
        if (current === "...") {
          return ".";
        }
        return `${current}.`;
      });
    }, 450);

    return () => {
      clearInterval(intervalId);
    };
  }, [successMessage]);

  const hasValidTokenHash = isLikelyRecoveryToken(tokenHash) && (!queryType || queryType === "recovery");
  const hasValidAccessToken = isLikelyRecoveryToken(hashState.accessToken) && (!hashState.type || hashState.type === "recovery");
  const hasRecoveryToken = hasValidAccessToken || hasValidTokenHash;
  const isInvalidLinkState = forceInvalidState || (isHashReady && !hasRecoveryToken);
  const visibleErrorMessage = isInvalidLinkState ? null : errorMessage;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!hasRecoveryToken) {
      setForceInvalidState(true);
      setErrorMessage(authContent.resetPasswordInvalidLinkMessage);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(authContent.passwordMismatchMessage);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          accessToken: hashState.accessToken,
          tokenHash
        })
      });

      const payload = (await response.json()) as { ok: boolean; error?: string };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? authContent.resetPasswordGenericError);
      }

      setSuccessMessage(authContent.resetPasswordSuccessMessage);
      setPassword("");
      setConfirmPassword("");

      redirectTimerRef.current = setTimeout(() => {
        router.replace("/?auth=1");
      }, 2500);
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : authContent.resetPasswordGenericError;
      const resolvedMessage = resolveResetError(rawMessage, authContent);
      setErrorMessage(resolvedMessage);

      if (resolvedMessage === authContent.resetPasswordInvalidTokenMessage || resolvedMessage === authContent.resetPasswordInvalidLinkMessage) {
        setForceInvalidState(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="bg-surface border-subtle w-full max-w-md rounded-2xl border p-5 sm:p-6">
      <h1 className="text-xl font-semibold sm:text-2xl">{authContent.resetPasswordPageTitle}</h1>
      {!isInvalidLinkState ? <p className="text-muted mt-2 text-sm">{authContent.resetPasswordPageDescription}</p> : null}

      {visibleErrorMessage ? <p className="text-accent mt-4 text-sm">{visibleErrorMessage}</p> : null}
      {successMessage ? (
        <p className="text-accent mt-4 text-sm">
          {successMessage} {authContent.resetPasswordRedirectingMessage}
          {redirectDots}
        </p>
      ) : null}

      {isInvalidLinkState ? (
        <div className="mt-4">
          <p className="text-accent text-sm">{authContent.resetPasswordInvalidLinkMessage}</p>
          <Link href="/" className="btn-primary mt-4 inline-flex w-full items-center justify-center">
            {authContent.backToLoginLabel}
          </Link>
        </div>
      ) : (
        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-muted mb-1 block text-xs">{authContent.passwordLabel}</span>
            <input
              required
              type="password"
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="bg-canvas border-subtle w-full rounded-lg border px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="text-muted mb-1 block text-xs">{authContent.confirmPasswordLabel}</span>
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
            {authContent.resetPasswordConfirmCta}
          </LoadingButton>
        </form>
      )}
    </section>
  );
}
