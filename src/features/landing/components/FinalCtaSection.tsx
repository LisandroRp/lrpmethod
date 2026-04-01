import { SectionContainer } from "@/features/landing/components/SectionContainer";
import { LandingContent } from "@/features/landing/i18n/types";

type FinalCtaSectionProps = {
  content: LandingContent;
};

export function FinalCtaSection({ content }: FinalCtaSectionProps) {
  const { finalCta } = content;

  return (
    <section id="final-cta" className="p-5 sm:p-[55px]">
      <SectionContainer className="w-full">
        <div className="panel-strong relative flex min-h-[380px] items-center justify-center overflow-hidden rounded-3xl px-5 py-10 text-center">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-35 blur-md"
            style={{ backgroundImage: "url('/images/landing/cta-gym.jpg')" }}
          />
          <div className="relative mx-auto max-w-3xl text-center">
            <h2 className="text-balance text-2xl font-bold sm:text-3xl">{finalCta.title}</h2>
            <p className="text-strong-muted mx-auto mt-3 max-w-2xl text-pretty text-sm sm:text-base">{finalCta.description}</p>
            <a
              href={finalCta.action.href}
              target="_blank"
              rel="noreferrer"
              className="btn-primary mt-6 inline-block"
            >
              {finalCta.action.label}
            </a>
          </div>
        </div>
      </SectionContainer>
    </section>
  );
}
