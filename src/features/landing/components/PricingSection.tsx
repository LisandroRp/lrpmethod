import { SectionContainer } from "@/features/landing/components/SectionContainer";
import { LandingContent } from "@/features/landing/i18n/types";

type PricingSectionProps = {
  content: LandingContent;
};

export function PricingSection({ content }: PricingSectionProps) {
  return (
    <section id="plans" className="bg-surface section-space">
      <SectionContainer>
        <div className="max-w-2xl">
          <p className="section-kicker">{content.pricing.kicker}</p>
          <h2 className="section-title">{content.pricing.title}</h2>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3 sm:gap-6">
          {content.pricing.plans.map((plan) => (
            <article key={plan.name} className={plan.highlighted ? "card card-highlight flex h-full flex-col" : "card flex h-full flex-col"}>
              {plan.highlighted ? <p className="pill mb-3 inline-block self-start">{content.pricing.featuredLabel}</p> : null}
              <h3 className="text-xl font-semibold">{plan.name}</h3>
              <p className="text-muted mt-1 text-sm">{plan.description}</p>
              <p className="mt-4 text-3xl font-bold">
                {plan.price}
                <span className="text-muted text-base font-medium">{plan.period}</span>
              </p>

              <ul className="mt-4 grow space-y-2 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span className="dot-accent mt-1.5" aria-hidden="true" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <a href="#final-cta" className="btn-primary mt-6 block text-center">
                {plan.ctaLabel}
              </a>
            </article>
          ))}
        </div>
      </SectionContainer>
    </section>
  );
}
