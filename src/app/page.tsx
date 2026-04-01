import { BenefitsSection } from "@/features/landing/components/BenefitsSection";
import { FaqSection } from "@/features/landing/components/FaqSection";
import { FinalCtaSection } from "@/features/landing/components/FinalCtaSection";
import { FooterSection } from "@/features/landing/components/FooterSection";
import { HeroSection } from "@/features/landing/components/HeroSection";
import { HowItWorksSection } from "@/features/landing/components/HowItWorksSection";
import { LandingHeader } from "@/features/landing/components/LandingHeader";
import { PricingSection } from "@/features/landing/components/PricingSection";
import { getLandingContent } from "@/features/landing/i18n/messages";
import { getRequestLocale } from "@/lib/i18n/get-request-locale";

export default async function HomePage() {
  const locale = await getRequestLocale();
  const content = getLandingContent(locale);

  return (
    <div className="bg-canvas text-primary min-h-screen">
      <span id="top" />
      <LandingHeader content={content} />
      <main>
        <HeroSection content={content} />
        <HowItWorksSection content={content} />
        <PricingSection content={content} />
        <BenefitsSection content={content} />
        <FaqSection content={content} />
        <FinalCtaSection content={content} />
      </main>

      <FooterSection content={content} />
    </div>
  );
}
