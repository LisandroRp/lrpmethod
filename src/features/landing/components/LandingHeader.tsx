"use client";

import Image from "next/image";
import Link from "next/link";
import { MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { TbLogout2 } from "react-icons/tb";

import { LoadingButton } from "@/components/composed/LoadingButton";
import { useAccount } from "@/features/contexts/AccountContext";
import { AuthModal } from "@/features/landing/components/AuthModal";
import { SectionContainer } from "@/features/landing/components/SectionContainer";
import { LandingContent } from "@/features/landing/i18n/types";
import { useModal } from "@/features/contexts/ModalContext";
import { Avatar } from "./Avatar";

type LandingHeaderProps = {
  content: LandingContent;
  showSectionLinks?: boolean;
};

function LogoutLabel({ text }: { text: string }) {
  return (
    <>
      <TbLogout2 className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{text}</span>
    </>
  );
}

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

export function LandingHeader({ content, showSectionLinks = true }: LandingHeaderProps) {
  const { user: accountUser, activePlanCode, isLoading: isAccountLoading, refreshAccount, clearAccount } = useAccount();
  const { openUnsubscribeModal } = useModal();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const navItems = useMemo(() => {
    if (!showSectionLinks) {
      return [];
    }
    return [
      { label: content.nav.howItWorks, href: "#how-it-works" },
      { label: content.nav.benefits, href: "#benefits" },
      { label: content.nav.plans, href: "#plans" },
      { label: content.nav.faq, href: "#faq" }
    ];
  }, [content, showSectionLinks]);

  const planNameByCode = useMemo(
    () =>
      content.pricing.plans.reduce<Record<string, string>>((acc, plan) => {
        acc[plan.code] = plan.name;
        return acc;
      }, {}),
    [content.pricing.plans]
  );

  useEffect(() => {
    if (!isUserMenuOpen) {
      return;
    }

    const handlePointerDown = (event: globalThis.MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) {
        return;
      }

      if (!userMenuRef.current?.contains(target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [isUserMenuOpen]);

  function handleNavClick(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (!href.startsWith("#")) {
      return;
    }
    scrollToHash(event, href);
    setIsMobileMenuOpen(false);
  }

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST"
      });

      clearAccount();
      setIsUserMenuOpen(false);
    } finally {
      setIsLoggingOut(false);
    }
  }

  function handleAuthenticated() {
    setIsAuthModalOpen(false);
    void refreshAccount();
  }

  const accountName = accountUser?.fullName || accountUser?.email || content.auth.accountLabel;
  const activePlanLabel = accountUser?.isAdmin ? content.auth.adminPlanLabel : activePlanCode ? planNameByCode[activePlanCode] : content.auth.noPlanLabel;
  const logoHref = showSectionLinks ? "#top" : "/";

  return (
    <header id="landing-header" className="bg-canvas border-subtle sticky top-0 z-20 border-b">
      <SectionContainer className="flex h-16 items-center justify-between">
        <a href={logoHref} className="flex items-center" onClick={(event) => handleNavClick(event, logoHref)}>
          <Image
            src="/brand/lrp-method-logo.png"
            alt={content.brand.name}
            width={150}
            height={36}
            className="h-9 w-auto object-contain"
          />
        </a>

        <div className="hidden items-center gap-4 sm:flex">
          {navItems.length ? (
            <nav className="text-muted flex items-center gap-6 text-sm font-medium">
              {navItems.map((item) => (
                <a key={item.href} href={item.href} className="header-link" onClick={(event) => handleNavClick(event, item.href)}>
                  {item.label}
                </a>
              ))}
            </nav>
          ) : null}

          {isAccountLoading ? (
            <span className="header-account-skeleton" aria-hidden="true" />
          ) : accountUser ? (
            <div ref={userMenuRef} className="relative">
              <button
                type="button"
                aria-label={content.auth.accountLabel}
                onClick={() => setIsUserMenuOpen((current) => !current)}
              >
                <Avatar {...{content}}/>
              </button>

              {isUserMenuOpen ? (
                <div className="bg-surface border-subtle absolute right-0 top-12 z-30 w-64 rounded-xl border p-3 shadow-lg">
                  <p className="text-primary truncate text-sm font-semibold">{accountName}</p>
                  {accountUser?.email ? <p className="text-muted mt-1 truncate text-xs">{accountUser.email}</p> : null}
                  <p className="text-accent mt-2 text-xs">
                    {content.auth.planLabel}: <span className="text-primary">{activePlanLabel}</span>
                  </p>
                  <div className="profile-menu-actions mt-3">
                    <Link href="/profile" className="profile-menu-action" onClick={() => setIsUserMenuOpen(false)}>
                      {content.auth.profileLabel}
                    </Link>
                    {activePlanCode ? (
                      <Link href="/onboarding" className="profile-menu-action" onClick={() => setIsUserMenuOpen(false)}>
                        {content.auth.formLabel}
                      </Link>
                    ) : null}
                    {accountUser?.isAdmin ? (
                      <Link href="/admin/subscribers" className="profile-menu-action" onClick={() => setIsUserMenuOpen(false)}>
                        {content.auth.subscribersLabel}
                      </Link>
                    ) : null}
                    {activePlanCode ? (
                      <button
                        type="button"
                        className="profile-menu-action"
                        onClick={() => {
                          openUnsubscribeModal({
                            planName: planNameByCode[activePlanCode],
                            onConfirm: async () => {
                              const response = await fetch("/api/subscription/cancel", { method: "POST" });
                              const payload = (await response.json()) as { ok: boolean };
                              if (!response.ok || !payload.ok) {
                                throw new Error("cancel_failed");
                              }
                              await refreshAccount();
                            }
                          });
                          setIsUserMenuOpen(false);
                        }}
                      >
                        {content.auth.cancelSubscriptionLabel}
                      </button>
                    ) : null}
                    <LoadingButton type="button" isLoading={isLoggingOut} className="profile-menu-action" onClick={handleLogout}>
                      <LogoutLabel text={content.nav.logout} />
                    </LoadingButton>
                  </div>
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
            ) : accountUser ? (
              <>
                <div className="profile-menu-actions mt-2 w-full">
                  <Link href="/profile" className="profile-menu-action w-full" onClick={() => setIsMobileMenuOpen(false)}>
                    {content.auth.profileLabel}
                  </Link>
                  {activePlanCode ? (
                    <Link href="/onboarding" className="profile-menu-action w-full" onClick={() => setIsMobileMenuOpen(false)}>
                      {content.auth.formLabel}
                    </Link>
                  ) : null}
                  {accountUser?.isAdmin ? (
                    <Link href="/admin/subscribers" className="profile-menu-action w-full" onClick={() => setIsMobileMenuOpen(false)}>
                      {content.auth.subscribersLabel}
                    </Link>
                  ) : null}
                  {activePlanCode ? (
                    <button
                      type="button"
                      className="profile-menu-action w-full"
                      onClick={() => {
                        openUnsubscribeModal({
                          planName: planNameByCode[activePlanCode],
                          onConfirm: async () => {
                            const response = await fetch("/api/subscription/cancel", { method: "POST" });
                            const payload = (await response.json()) as { ok: boolean };
                            if (!response.ok || !payload.ok) {
                              throw new Error("cancel_failed");
                            }
                            await refreshAccount();
                          }
                        });
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      {content.auth.cancelSubscriptionLabel}
                    </button>
                  ) : null}
                  <LoadingButton
                    type="button"
                    isLoading={isLoggingOut}
                    className="profile-menu-action w-full"
                    onClick={() => {
                      void handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <LogoutLabel text={content.nav.logout} />
                  </LoadingButton>
                </div>
              </>
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
