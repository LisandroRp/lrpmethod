import { redirect } from "next/navigation";

import { LandingHeader } from "@/features/landing/components/LandingHeader";
import { getLandingContent } from "@/features/landing/i18n/messages";
import { AppLocale } from "@/features/landing/i18n/types";
import { hasSubmittedOnboardingAnswerByUserId } from "@/lib/server/onboarding-admin";
import { findCurrentActiveSubscriptionByUserId } from "@/lib/server/supabase-admin";
import { getCurrentAuthenticatedUser } from "@/lib/server/supabase-auth";
import { getRequestLocale } from "@/lib/i18n/get-request-locale";
import { Avatar } from "@/features/landing/components/Avatar";

function getProfileCopy(locale: AppLocale) {
  if (locale === "es") {
    return {
      pageTitle: "Perfil",
      pageDescription: "Informacion de tu cuenta y estado actual.",
      sectionKicker: "Mi cuenta",
      fullName: "Nombre",
      email: "Email",
      plan: "Plan",
      onboarding: "Formulario",
      noName: "No definido",
      noEmail: "Sin email",
      noPlan: "Sin plan activo",
      onboardingSubmitted: "Completado",
      onboardingPending: "Pendiente"
    };
  }

  return {
    pageTitle: "Profile",
    pageDescription: "Your account information and current status.",
    sectionKicker: "My account",
    fullName: "Name",
    email: "Email",
    plan: "Plan",
    onboarding: "Form",
    noName: "Not set",
    noEmail: "No email",
    noPlan: "No active plan",
    onboardingSubmitted: "Completed",
    onboardingPending: "Pending"
  };
}

export default async function ProfilePage() {
  const locale = await getRequestLocale();
  const content = getLandingContent(locale);
  const profileCopy = getProfileCopy(locale);

  const user = await getCurrentAuthenticatedUser();
  if (!user) {
    redirect("/?auth=1");
  }

  const [subscriptionResult, onboardingResult] = await Promise.allSettled([
    findCurrentActiveSubscriptionByUserId(user.id),
    hasSubmittedOnboardingAnswerByUserId(user.id)
  ]);

  const activePlanCode = subscriptionResult.status === "fulfilled" ? subscriptionResult.value?.plan_code ?? null : null;
  const onboardingSubmitted = onboardingResult.status === "fulfilled" ? onboardingResult.value : false;
  const planNameByCode = content.pricing.plans.reduce<Record<string, string>>((acc, plan) => {
    acc[plan.code] = plan.name;
    return acc;
  }, {});

  const displayedPlanName = activePlanCode ? planNameByCode[activePlanCode] ?? profileCopy.noPlan : profileCopy.noPlan;
  const fullName = user.user_metadata?.full_name?.trim() || profileCopy.noName;
  const email = user.email?.trim() || profileCopy.noEmail;

  return (
    <div className="bg-canvas text-primary min-h-screen">
      <LandingHeader content={content} showSectionLinks={false} />

      <main className="px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto w-full max-w-3xl">
          <div className="flex flex-row gap-5">
          <Avatar {...{content}} containerClassName="h-20 w-20" iconClassName="h-14 w-14"/>
          <div>
          <header className="mb-5">
            <p className="text-accent text-xs font-semibold tracking-[0.2em] uppercase">{profileCopy.sectionKicker}</p>
            <h1 className="text-2xl font-semibold sm:text-3xl">{profileCopy.pageTitle}</h1>
            <p className="text-muted mt-2 text-sm sm:text-base">{profileCopy.pageDescription}</p>
          </header>
          <section className="panel border-accent/30 p-5 sm:p-6">
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-accent text-xs">{profileCopy.fullName}</dt>
                <dd className="text-primary mt-1 text-sm font-medium sm:text-base">{fullName}</dd>
              </div>

              <div>
                <dt className="text-accent text-xs">{profileCopy.email}</dt>
                <dd className="text-primary mt-1 text-sm font-medium sm:text-base">{email}</dd>
              </div>

              <div>
                <dt className="text-accent text-xs">{profileCopy.plan}</dt>
                <dd className="text-primary mt-1 text-sm font-semibold sm:text-base">{displayedPlanName}</dd>
              </div>

              <div>
                <dt className="text-accent text-xs">{profileCopy.onboarding}</dt>
                <dd className="text-primary mt-1 text-sm font-semibold sm:text-base">
                  {onboardingSubmitted ? profileCopy.onboardingSubmitted : profileCopy.onboardingPending}
                </dd>
              </div>
            </dl>
          </section>
          </div>
          </div>
        </div>
      </main>
    </div>
  );
}
