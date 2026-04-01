import { SectionContainer } from "@/features/landing/components/SectionContainer";
import { LandingContent } from "@/features/landing/i18n/types";

type HowItWorksSectionProps = {
  content: LandingContent;
};

export function HowItWorksSection({ content }: HowItWorksSectionProps) {
  return (
    <section id="how-it-works" className="section-space">
      <SectionContainer>
        <div className="max-w-2xl">
          <p className="section-kicker">{content.howItWorks.kicker}</p>
          <h2 className="section-title">{content.howItWorks.title}</h2>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3 sm:gap-6">
          {content.howItWorks.items.map((step, index) => (
            <article key={step.title} className="card">
              <p className="text-accent text-sm font-semibold">
                {content.howItWorks.stepLabel} {index + 1}
              </p>
              <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
              <p className="text-muted mt-2 text-sm leading-relaxed">{step.description}</p>
            </article>
          ))}
        </div>
      </SectionContainer>
    </section>
  );
}
