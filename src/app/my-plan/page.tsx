import { redirect } from "next/navigation";

import { MyPlanSections } from "@/features/my-plan/components/MyPlanSections";
import { LandingHeader } from "@/features/landing/components/LandingHeader";
import { getLandingContent } from "@/features/landing/i18n/messages";
import { AppLocale } from "@/features/landing/i18n/types";
import { findCurrentActiveSubscriptionByUserId, listBasicRoutineTemplates } from "@/lib/server/supabase-admin";
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
      customPlansAssigned: "Tu plan personalizado ya esta asignado.",
      customPlansAssignedHelp: "Pronto veras aqui el contenido completo de entrenamiento y nutricion.",
      basicPlansTitle: "Planes basicos",
      basicPlansDescription: "Biblioteca de planes base disponible para usuarios con suscripcion activa.",
      basicPlansLocked: "Activa una suscripcion para desbloquear los planes basicos.",
      basicPlansEmpty: "Todavia no hay planes basicos publicados.",
      basicPlansOpenCtaLabel: "Ver rutina",
      basicPlansCtaLabel: "Disponible pronto"
    };
  }

  return {
    pageTitle: "My Plan",
    pageDescription: "Here you will find your personalized plans and your available basic plans.",
    sectionSwitchLabel: "Select section",
    customPlansTitle: "Personalized plans",
    customPlansDescription: "Exclusive content tailored to your current goal and context.",
    customPlansEmpty: "You do not have personalized plans yet.",
    customPlansAssigned: "Your personalized plan is already assigned.",
    customPlansAssignedHelp: "You will soon see the full training and nutrition content here.",
    basicPlansTitle: "Basic plans",
    basicPlansDescription: "Base plan library available for users with an active subscription.",
    basicPlansLocked: "Activate a subscription to unlock the basic plans.",
    basicPlansEmpty: "No basic plans published yet.",
    basicPlansOpenCtaLabel: "View routine",
    basicPlansCtaLabel: "Coming soon"
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

  const [subscription, basicPlans] = await Promise.all([
    findCurrentActiveSubscriptionByUserId(user.id),
    listBasicRoutineTemplates(locale)
  ]);
  const activePlanCode = subscription?.plan_code ?? null;
  const hasCustomPlanAssigned = activePlanCode === "intermediate" || activePlanCode === "premium";
  const hasBasicPlansAccess = Boolean(activePlanCode);

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
            hasCustomPlanAssigned={hasCustomPlanAssigned}
            hasBasicPlansAccess={hasBasicPlansAccess}
          />
        </div>
      </main>
    </div>
  );
}
