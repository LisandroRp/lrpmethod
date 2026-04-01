"use client";

import { KeyboardEvent, useState } from "react";

import { SectionContainer } from "@/features/landing/components/SectionContainer";
import { LandingContent } from "@/features/landing/i18n/types";

type FaqSectionProps = {
  content: LandingContent;
};

export function FaqSection({ content }: FaqSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  function toggleItem(index: number) {
    setOpenIndex((current) => (current === index ? null : index));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>, index: number) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleItem(index);
    }
  }

  return (
    <section id="faq" className="bg-surface section-space">
      <SectionContainer>
        <div className="max-w-2xl">
          <p className="section-kicker">{content.faq.kicker}</p>
          <h2 className="section-title">{content.faq.title}</h2>
        </div>

        <div className="mt-8 space-y-3">
          {content.faq.items.map((item, index) => (
            <article
              key={item.question}
              className="card cursor-pointer"
              role="button"
              tabIndex={0}
              aria-expanded={openIndex === index}
              onClick={() => toggleItem(index)}
              onKeyDown={(event) => handleKeyDown(event, index)}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold sm:text-base">{item.question}</p>
                <span
                  aria-hidden="true"
                  className={`text-accent flex h-7 w-7 shrink-0 items-center justify-center transition-transform duration-200 ${
                    openIndex === index ? "rotate-180" : "rotate-0"
                  }`}
                >
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
              {openIndex === index ? <p className="text-muted mt-3 text-sm leading-relaxed">{item.answer}</p> : null}
            </article>
          ))}
        </div>
      </SectionContainer>
    </section>
  );
}
