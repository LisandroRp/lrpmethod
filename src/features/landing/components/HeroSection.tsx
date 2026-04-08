import { SectionContainer } from "@/features/landing/components/SectionContainer";
import { LandingContent } from "@/features/landing/i18n/types";

type HeroSectionProps = {
  content: LandingContent;
};

export function HeroSection({ content }: HeroSectionProps) {
  const { hero } = content;
  const primaryIsExternal = hero.primaryAction.href.startsWith("http");
  const secondaryIsExternal = hero.secondaryAction.href.startsWith("http");

  return (
    <section className="bg-hero border-subtle relative flex min-h-screen items-center overflow-hidden border-b py-16 sm:py-24">
      <div
        aria-hidden="true"
        className="hero-bg-motion pointer-events-none absolute inset-0 bg-cover bg-center opacity-45 blur-md"
        style={{ backgroundImage: "url('/images/landing/hero-muscular-lifting.jpg')" }}
      />
      <SectionContainer>
        <div className="relative mx-auto max-w-3xl text-center">
          <h1 className="hero-title-animated text-balance text-3xl font-bold sm:text-5xl">
            <span className="hero-title-inner">{hero.title}</span>
          </h1>
          <p className="hero-reveal hero-reveal-delay-1 text-muted mx-auto mt-4 max-w-2xl text-pretty text-base sm:text-lg">
            {hero.description}
          </p>

          <div className="hero-reveal hero-reveal-delay-2 mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a
              href={hero.primaryAction.href}
              className="btn-primary cta-pulse"
              target={primaryIsExternal ? "_blank" : undefined}
              rel={primaryIsExternal ? "noopener noreferrer" : undefined}
            >
              {hero.primaryAction.label}
            </a>
            <a
              href={hero.secondaryAction.href}
              className="btn-secondary"
              target={secondaryIsExternal ? "_blank" : undefined}
              rel={secondaryIsExternal ? "noopener noreferrer" : undefined}
            >
              {hero.secondaryAction.label}
            </a>
          </div>

          <ul className="hero-reveal hero-reveal-delay-3 mt-8 flex flex-wrap justify-center gap-2 text-sm">
            {hero.trustPoints.map((point) => (
              <li key={point} className="chip">
                {point}
              </li>
            ))}
          </ul>
        </div>
      </SectionContainer>
    </section>
  );
}
