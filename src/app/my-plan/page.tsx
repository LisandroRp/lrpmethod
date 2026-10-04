import { redirect } from "next/navigation";

import { MyPlanSections } from "@/features/my-plan/components/MyPlanSections";
import { LandingHeader } from "@/features/landing/components/LandingHeader";
import { getLandingContent } from "@/features/landing/i18n/messages";
import { AppLocale } from "@/features/landing/i18n/types";
import {
  findCurrentActiveSubscriptionByUserId,
  isUserAdmin,
  listBasicRoutineTemplates,
  listPersonalizedRoutineTemplatesByUserId
} from "@/lib/server/supabase-admin";
import { getCurrentAuthenticatedUser } from "@/lib/server/supabase-auth";
import { getRequestLocale } from "@/lib/i18n/get-request-locale";

function getMyPlanCopy(locale: AppLocale) {
  if (locale === "es") {
    return {
      pageTitle: "Mi Plan",
      pageDescription: "Aqui encontraras tus planes personalizados y tus planes basicos disponibles.",
      sectionSwitchLabel: "Selecciona seccion",
      customPlansTitle: "Planes personalizados",
      customPlansDescription: "Contenido exclusivo armado para tu objetivo y contexto actual.",
      customPlansEmpty: "No tienes planes personalizados todavía.",
      customPlansOpenCtaLabel: "Ver rutina",
      basicPlansTitle: "Planes basicos",
      basicPlansDescription: "Biblioteca de planes base disponible para usuarios con suscripcion activa.",
      basicPlansLocked: "Activa una suscripcion para desbloquear los planes basicos.",
      basicPlansEmpty: "Todavia no hay planes basicos publicados.",
      basicPlansOpenCtaLabel: "Ver rutina",
      basicPlansCtaLabel: "Adquirir plan"
    };
  }

  return {
    pageTitle: "My Plan",
    pageDescription: "Here you will find your personalized plans and your available basic plans.",
    sectionSwitchLabel: "Select section",
    customPlansTitle: "Personalized plans",
    customPlansDescription: "Exclusive content tailored to your current goal and context.",
    customPlansEmpty: "You do not have personalized plans yet.",
    customPlansOpenCtaLabel: "View routine",
    basicPlansTitle: "Basic plans",
    basicPlansDescription: "Base plan library available for users with an active subscription.",
    basicPlansLocked: "Activate a subscription to unlock the basic plans.",
    basicPlansEmpty: "No basic plans published yet.",
    basicPlansOpenCtaLabel: "View routine",
    basicPlansCtaLabel: "Get a plan"
  };
}

export default async function MyPlanPage() {
  const locale = await getRequestLocale();
  const content = getLandingContent(locale);
  const copy = getMyPlanCopy(locale);

  const user = await getCurrentAuthenticatedUser();
  if (!user) {
    redirect("/?auth=1");
  }

  const [subscription, basicPlans, personalizedPlans, admin] = await Promise.all([
    findCurrentActiveSubscriptionByUserId(user.id),
    listBasicRoutineTemplates(locale),
    listPersonalizedRoutineTemplatesByUserId(user.id),
    isUserAdmin(user.id)
  ]);
  const activePlanCode = subscription?.plan_code ?? null;
  const hasBasicPlansAccess = Boolean(activePlanCode) || admin;

  return (
    <div className="bg-canvas text-primary min-h-screen">
      <LandingHeader content={content} showSectionLinks={false} />

      <main className="px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto w-full">
          <header className="mb-6 max-w-4xl m-auto">
            <h1 className="text-2xl font-semibold sm:text-3xl">{copy.pageTitle}</h1>
            <p className="text-muted mt-2 text-sm sm:text-base">{copy.pageDescription}</p>
          </header>

          <MyPlanSections
            copy={copy}
            basicPlans={basicPlans}
            customPlans={personalizedPlans.map((plan) => ({
              id: String(plan.id),
              title: plan.name,
              description: plan.shortDescription ?? plan.description ?? ""
            }))}
            hasBasicPlansAccess={hasBasicPlansAccess}
          />
        </div>
      </main>
    </div>
  );
}
