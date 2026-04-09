import Image from "next/image";

import { getLandingContent } from "@/features/landing/i18n/messages";
import { getRequestLocale } from "@/lib/i18n/get-request-locale";

export default async function OnboardingPage() {
  const locale = await getRequestLocale();
  const content = getLandingContent(locale);
  const { onboarding } = content;

  return (
    <main className="bg-canvas text-primary h-screen overflow-hidden px-4 pt-8 pb-4 sm:px-6 sm:pt-10 lg:px-8">
      <div className="mx-auto flex h-full w-full max-w-5xl flex-col">
        <header className="shrink-0 pb-4">
          <p className="section-kicker">{onboarding.title}</p>
          <h1 className="section-title mt-2">{onboarding.pageTitle}</h1>
          <p className="text-muted mt-3 text-sm sm:text-base">{onboarding.pageDescription}</p>
        </header>

        <div className="shrink-0 pb-4">
          <Image src="/brand/lrp-mark.png" alt="LRP Method mark" width={72} height={72} className="h-[4.5rem] w-[4.5rem] object-contain" />
        </div>

        <div className="min-h-0 flex-1">
          <iframe src={onboarding.embedUrl} title={onboarding.title} loading="lazy" className="block h-full w-full border-0" />
        </div>
      </div>
    </main>
  );
}
