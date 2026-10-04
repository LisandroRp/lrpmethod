import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { LandingHeader } from "@/features/landing/components/LandingHeader";
import { getLandingContent } from "@/features/landing/i18n/messages";
import { AdminOnboardingAnswers } from "@/features/onboarding/components/AdminOnboardingAnswers";
import { AdminRoutineImportPanel } from "@/features/admin/routine-import/AdminRoutineImportPanel";
import { getCurrentAuthenticatedUser } from "@/lib/server/supabase-auth";
import { getOnboardingByUserId } from "@/lib/server/onboarding-admin";
import { isUserAdmin } from "@/lib/server/supabase-admin";

type AdminSubscriberOnboardingPageProps = {
  params: Promise<{
    userId: string;
  }>;
  searchParams?: Promise<{
    routineSaved?: string;
  }>;
};

export default async function AdminSubscriberOnboardingPage({ params, searchParams }: AdminSubscriberOnboardingPageProps) {
  const content = getLandingContent("es");
  const user = await getCurrentAuthenticatedUser();

  if (!user?.id) {
    redirect("/");
  }

  const admin = await isUserAdmin(user.id);
  if (!admin) {
    redirect("/");
  }

  const { userId } = await params;
  const resolvedSearchParams = await searchParams;
  const onboarding = await getOnboardingByUserId(userId);

  if (!onboarding?.answers) {
    notFound();
  }

  return (
    <div className="bg-canvas text-primary min-h-screen">
      <LandingHeader content={content} showSectionLinks={false} />
      <main className="px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="section-kicker">Formulario</p>
              <h1 className="text-2xl font-semibold sm:text-3xl">{onboarding.answers.fullName}</h1>
              <p className="text-muted mt-2 text-sm sm:text-base">
                {onboarding.answers.email} · Estado: <span className="capitalize">{onboarding.status}</span>
              </p>
              <p className="text-muted mt-1 text-xs sm:text-sm">
                Última actualización: {new Date(onboarding.updatedAt).toLocaleString("es-AR")}
              </p>
            </div>

            <Link href="/admin/subscribers" className="btn-secondary inline-block">
              Volver a suscriptores
            </Link>
          </div>

          {resolvedSearchParams?.routineSaved === "1" ? (
            <p className="mb-6 rounded-lg border border-subtle p-3 text-sm font-semibold text-accent">
              Rutina guardada correctamente.
            </p>
          ) : null}

          <AdminRoutineImportPanel userId={userId} answers={onboarding.answers} />
          <AdminOnboardingAnswers answers={onboarding.answers} />
        </div>
      </main>
    </div>
  );
}
