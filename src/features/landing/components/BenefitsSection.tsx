import { SectionContainer } from "@/features/landing/components/SectionContainer";
import { LandingContent } from "@/features/landing/i18n/types";

type BenefitsSectionProps = {
  content: LandingContent;
};

export function BenefitsSection({ content }: BenefitsSectionProps) {
  return (
    <section id="benefits" className="section-space relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-40 blur-md"
        style={{ backgroundImage: "url('/images/landing/benefits-training.jpg')" }}
      />
      <SectionContainer>
        <div className="relative grid gap-8 sm:grid-cols-[1fr_1.2fr] sm:items-start">
          <div className="rounded-2xl p-4">
            <p className="section-kicker">{content.benefits.kicker}</p>
            <h2 className="section-title">{content.benefits.title}</h2>
            <p className="text-muted mt-3 text-sm leading-relaxed sm:text-base">{content.benefits.description}</p>
          </div>

          <ul className="grid gap-3">
            {content.benefits.items.map((benefit) => (
              <li key={benefit} className="card text-sm">
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      </SectionContainer>
    </section>
  );
}
