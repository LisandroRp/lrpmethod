"use client";

import Image from "next/image";
import { MouseEvent, useMemo, useState } from "react";

import { SectionContainer } from "@/features/landing/components/SectionContainer";
import { LandingContent } from "@/features/landing/i18n/types";

type LandingHeaderProps = {
  content: LandingContent;
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

  const navItems = useMemo(
    () => [
      { label: content.nav.howItWorks, href: "#how-it-works" },
      { label: content.nav.benefits, href: "#benefits" },
      { label: content.nav.plans, href: "#plans" },
      { label: content.nav.faq, href: "#faq" }
    ],
    [content]
  );

  function handleNavClick(event: MouseEvent<HTMLAnchorElement>, href: string) {
    scrollToHash(event, href);
    setIsMobileMenuOpen(false);
  }

  return (
    <header id="landing-header" className="bg-canvas border-subtle sticky top-0 z-10 border-b">
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

        <nav className="text-muted hidden items-center gap-4 text-xs font-medium sm:flex sm:gap-6 sm:text-sm">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="header-link" onClick={(event) => handleNavClick(event, item.href)}>
              {item.label}
            </a>
          ))}
        </nav>
      </SectionContainer>

      <div
        id="mobile-nav"
        className={`bg-surface border-subtle overflow-hidden transition-all duration-300 ease-out sm:hidden ${
          isMobileMenuOpen ? "max-h-60 border-t opacity-100" : "max-h-0 border-t-0 opacity-0"
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
          </nav>
        </SectionContainer>
      </div>
    </header>
  );
}
