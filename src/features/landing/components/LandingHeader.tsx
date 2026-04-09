"use client";

import Image from "next/image";
import { MouseEvent, useEffect, useMemo, useState } from "react";

import { LoadingButton } from "@/components/composed/LoadingButton";
import { AuthModal } from "@/features/landing/components/AuthModal";
import { SectionContainer } from "@/features/landing/components/SectionContainer";
import { LandingContent, PlanTier } from "@/features/landing/i18n/types";

type LandingHeaderProps = {
  content: LandingContent;
};

type AccountResponse = {
  ok: boolean;
  user?: {
    id: string;
    email: string | null;
    fullName: string | null;
  };
  subscription?: {
    planCode: PlanTier["code"];
  } | null;
};

function scrollToHash(event: MouseEvent<HTMLAnchorElement>, href: string) {
  event.preventDefault();

  const targetId = href.replace("#", "");
  const target = document.getElementById(targetId);
  const header = document.getElementById("landing-header");

  if (!target) {
    return;
  }

  const headerOffset = header?.offsetHeight ?? 64;
  const targetY = target.getBoundingClientRect().top + window.scrollY - headerOffset + 2;

  window.history.replaceState(null, "", href);
  window.scrollTo({
    top: Math.max(targetY, 0),
    behavior: "smooth"
  });
}

export function LandingHeader({ content }: LandingHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAccountLoading, setIsAccountLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [account, setAccount] = useState<AccountResponse["user"] | null>(null);
  const [activePlanCode, setActivePlanCode] = useState<PlanTier["code"] | null>(null);

  const navItems = useMemo(
    () => [
      { label: content.nav.howItWorks, href: "#how-it-works" },
      { label: content.nav.benefits, href: "#benefits" },
      { label: content.nav.plans, href: "#plans" },
      { label: content.nav.faq, href: "#faq" }
    ],
    [content]
  );

  const planNameByCode = useMemo(
    () =>
      content.pricing.plans.reduce<Record<string, string>>((acc, plan) => {
        acc[plan.code] = plan.name;
        return acc;
      }, {}),
    [content.pricing.plans]
  );

  useEffect(() => {
    async function loadAccount() {
      try {
        const response = await fetch("/api/auth/account", { method: "GET" });
        if (!response.ok) {
          setAccount(null);
          setActivePlanCode(null);
          setIsAccountLoading(false);
          return;
        }

        const payload = (await response.json()) as AccountResponse;
        if (!payload.ok || !payload.user) {
          setAccount(null);
          setActivePlanCode(null);
          setIsAccountLoading(false);
          return;
        }

        setAccount(payload.user);
        setActivePlanCode(payload.subscription?.planCode ?? null);
      } catch {
        setAccount(null);
        setActivePlanCode(null);
      } finally {
        setIsAccountLoading(false);
      }
    }

    void loadAccount();
  }, []);

  function handleNavClick(event: MouseEvent<HTMLAnchorElement>, href: string) {
    scrollToHash(event, href);
    setIsMobileMenuOpen(false);
  }

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST"
      });

      setAccount(null);
      setActivePlanCode(null);
      setIsUserMenuOpen(false);
    } finally {
      setIsLoggingOut(false);
    }
  }

  function handleAuthenticated() {
    setIsAuthModalOpen(false);
    window.location.reload();
  }

  const accountName = account?.fullName || account?.email || content.auth.accountLabel;
  const activePlanLabel = activePlanCode ? planNameByCode[activePlanCode] : content.auth.noPlanLabel;

  return (
    <header id="landing-header" className="bg-canvas border-subtle sticky top-0 z-20 border-b">
      <SectionContainer className="flex h-16 items-center justify-between">
        <a href="#top" className="flex items-center" onClick={(event) => handleNavClick(event, "#top")}>
          <Image
            src="/brand/lrp-method-logo.png"
            alt={content.brand.name}
            width={150}
            height={36}
            className="h-9 w-auto object-contain"
          />
        </a>

        <div className="hidden items-center gap-4 sm:flex">
          <nav className="text-muted flex items-center gap-6 text-sm font-medium">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="header-link" onClick={(event) => handleNavClick(event, item.href)}>
                {item.label}
              </a>
            ))}
          </nav>

          {isAccountLoading ? (
            <span className="header-account-skeleton" aria-hidden="true" />
          ) : account ? (
            <div className="relative">
              <button
                type="button"
                className="user-menu-trigger"
                aria-label={content.auth.accountLabel}
                onClick={() => setIsUserMenuOpen((current) => !current)}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M12 12C14.4853 12 16.5 9.98528 16.5 7.5C16.5 5.01472 14.4853 3 12 3C9.51472 3 7.5 5.01472 7.5 7.5C7.5 9.98528 9.51472 12 12 12Z" stroke="currentColor" strokeWidth="1.8" />
                  <path
                    d="M4 20.1C4.7 16.7 7.7 14.5 12 14.5C16.3 14.5 19.3 16.7 20 20.1"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>

              {isUserMenuOpen ? (
                <div className="bg-surface border-subtle absolute right-0 top-12 z-30 w-64 rounded-xl border p-3 shadow-lg">
                  <p className="text-primary truncate text-sm font-semibold">{accountName}</p>
                  {account?.email ? <p className="text-muted mt-1 truncate text-xs">{account.email}</p> : null}
                  <p className="text-accent mt-2 text-xs">
                    {content.auth.planLabel}: <span className="text-primary">{activePlanLabel}</span>
                  </p>
                  <LoadingButton type="button" isLoading={isLoggingOut} className="btn-secondary mt-3 w-full text-center" onClick={handleLogout}>
                    {content.nav.logout}
                  </LoadingButton>
                </div>
              ) : null}
            </div>
          ) : (
            <button type="button" className="header-login-cta" onClick={() => setIsAuthModalOpen(true)}>
              {content.nav.login}
            </button>
          )}
        </div>

        <button
          type="button"
          className="menu-toggle text-primary flex h-10 w-10 items-center justify-center rounded-md sm:hidden"
          aria-label={isMobileMenuOpen ? content.nav.closeMenuAriaLabel : content.nav.openMenuAriaLabel}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-nav"
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
        >
          {isMobileMenuOpen ? (
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M4 7H20M4 12H20M4 17H20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </SectionContainer>

      <div
        id="mobile-nav"
        className={`bg-surface border-subtle overflow-hidden transition-all duration-300 ease-out sm:hidden ${
          isMobileMenuOpen ? "max-h-72 border-t opacity-100" : "max-h-0 border-t-0 opacity-0"
        }`}
      >
        <SectionContainer className="py-3">
          <nav className="flex flex-col items-center gap-1 text-center text-sm font-medium">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="header-link w-full rounded-lg px-2 py-2 text-center"
                onClick={(event) => handleNavClick(event, item.href)}
              >
                {item.label}
              </a>
            ))}

            {isAccountLoading ? (
              <span className="header-account-skeleton mt-2" aria-hidden="true" />
            ) : account ? (
              <LoadingButton
                type="button"
                isLoading={isLoggingOut}
                className="btn-secondary mt-2 w-full text-center"
                onClick={() => {
                  void handleLogout();
                  setIsMobileMenuOpen(false);
                }}
              >
                {content.nav.logout}
              </LoadingButton>
            ) : (
              <button
                type="button"
                className="header-login-cta mt-2 w-full text-center"
                onClick={() => {
                  setIsAuthModalOpen(true);
                  setIsMobileMenuOpen(false);
                }}
              >
                {content.nav.login}
              </button>
            )}
          </nav>
        </SectionContainer>
      </div>

      <AuthModal
        content={content.auth}
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthenticated={handleAuthenticated}
      />
    </header>
  );
}
