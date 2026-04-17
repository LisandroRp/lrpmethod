import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getLandingContent } from "@/features/landing/i18n/messages";
import { LandingHeader } from "@/features/landing/components/LandingHeader";
import { OnboardingForm } from "@/features/onboarding/components/OnboardingForm";
import { findCurrentActiveSubscriptionByUserId } from "@/lib/server/supabase-admin";
import { getCurrentAuthenticatedUser } from "@/lib/server/supabase-auth";
import { getRequestLocale } from "@/lib/i18n/get-request-locale";

type OnboardingPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const locale = await getRequestLocale();
  const content = getLandingContent(locale);
  const { onboarding } = content;
  const user = await getCurrentAuthenticatedUser();
  await searchParams;

  if (!user) {
    redirect("/?auth=1");
  }

  let activeSubscription = await findCurrentActiveSubscriptionByUserId(user.id);

  // Fallback sync intentionally disabled while validating strict webhook-first behavior.

  if (!activeSubscription) {
    return (
      <main className="bg-canvas text-primary flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
        <div className="card max-w-xl text-center">
          <h1 className="section-title">{onboarding.pendingApprovalTitle}</h1>
          <p className="text-muted mt-3 text-sm sm:text-base">{onboarding.pendingApprovalDescription}</p>
          <Link href="/onboarding" className="btn-primary mt-6 inline-block">
            {onboarding.pendingApprovalCtaLabel}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="bg-canvas text-primary min-h-screen">
      <LandingHeader content={content} showSectionLinks={false} />
      <main className="px-4 pt-8 pb-10 sm:px-6 sm:pt-10 lg:px-8">
        <div className="mx-auto w-full max-w-5xl">
          <header className="pb-4">
            <p className="section-kicker">{onboarding.title}</p>
            <h1 className="section-title mt-2">{onboarding.pageTitle}</h1>
            <p className="text-muted mt-3 text-sm sm:text-base">{onboarding.pageDescription}</p>
          </header>

          <div className="pb-4">
            <Image src="/brand/lrp-mark.png" alt="LRP Method mark" width={72} height={72} className="h-[4.5rem] w-[4.5rem] object-contain" />
          </div>

          <OnboardingForm userEmail={user.email ?? ""} />
        </div>
      </main>
    </div>
  );
}
