import { SectionContainer } from "@/features/landing/components/SectionContainer";
import { LandingContent } from "@/features/landing/i18n/types";

type HeroSectionProps = {
  content: LandingContent;
};

export function HeroSection({ content }: HeroSectionProps) {
  const { hero } = content;

  return (
    <section className="bg-hero border-subtle relative flex min-h-screen items-center overflow-hidden border-b py-16 sm:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-45 blur-md"
        style={{ backgroundImage: "url('/images/landing/hero-muscular-lifting.jpg')" }}
      />
      <SectionContainer>
        <div className="relative mx-auto max-w-3xl text-center">
          <h1 className="text-balance text-3xl font-bold sm:text-5xl">{hero.title}</h1>
          <p className="text-muted mx-auto mt-4 max-w-2xl text-pretty text-base sm:text-lg">{hero.description}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a href={hero.primaryAction.href} className="btn-primary">
              {hero.primaryAction.label}
            </a>
            <a href={hero.secondaryAction.href} className="btn-secondary">
              {hero.secondaryAction.label}
            </a>
          </div>

          <ul className="mt-8 flex flex-wrap justify-center gap-2 text-sm">
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
