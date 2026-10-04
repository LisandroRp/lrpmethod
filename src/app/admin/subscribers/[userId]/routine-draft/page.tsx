import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminRoutineDraftEditor } from "@/features/admin/routine-import/AdminRoutineDraftEditor";
import { LandingHeader } from "@/features/landing/components/LandingHeader";
import { getLandingContent } from "@/features/landing/i18n/messages";
import { RoutineImportDraft } from "@/lib/routines/routine-import-schema";
import { getCurrentAuthenticatedUser } from "@/lib/server/supabase-auth";
import { findProfileById, findRoutineTemplateDetailById, isUserAdmin } from "@/lib/server/supabase-admin";

type AdminRoutineDraftPageProps = {
  params: Promise<{
    userId: string;
  }>;
  searchParams?: Promise<{
    routineId?: string;
  }>;
};

type RoutineTemplateDetail = NonNullable<Awaited<ReturnType<typeof findRoutineTemplateDetailById>>>;

function buildRoutineDraftFromDetail(routine: RoutineTemplateDetail): RoutineImportDraft {
  return {
    schemaVersion: "lrp-routine-v1",
    routine: {
      name: routine.name,
      description: routine.description ?? routine.shortDescription ?? routine.name,
      shortDescription: routine.shortDescription ?? "",
      longDescriptionMd: routine.longDescriptionMd ?? "",
      difficulty: null,
      days: routine.days.map((day) => {
        const items: RoutineImportDraft["routine"]["days"][number]["items"] = [];
        const combinedItemIndexByGroup = new Map<number, number>();

        for (const exercise of [...day.exercises].sort((a, b) => a.orderIndex - b.orderIndex || (a.combinedIndex ?? 0) - (b.combinedIndex ?? 0))) {
          const exerciseDraft = {
            exerciseId: exercise.id,
            exerciseName: exercise.name,
            exerciseInfo: {
              description: exercise.description,
              overview: exercise.overview,
              instructions: exercise.instructions,
              tips: exercise.tips,
              videoUrl: exercise.videoUrl,
              sourceUrl: exercise.sourceUrl
            },
            sets: exercise.sets,
            repsMin: exercise.repsMin,
            repsMax: exercise.repsMax,
            restSeconds: exercise.restSeconds,
            rir: exercise.rir,
            notes: exercise.notes ?? ""
          };

          if (!exercise.isCombined || exercise.combinedGroup === null) {
            items.push({
              type: "single",
              ...exerciseDraft
            });
            continue;
          }

          const existingItemIndex = combinedItemIndexByGroup.get(exercise.combinedGroup);
          if (typeof existingItemIndex === "number") {
            const existingItem = items[existingItemIndex];
            if (existingItem.type === "combined") {
              existingItem.exercises.push(exerciseDraft);
            }
            continue;
          }

          combinedItemIndexByGroup.set(exercise.combinedGroup, items.length);
          items.push({
            type: "combined" as const,
            label: exercise.combinedLabel ?? `Bloque ${exercise.combinedGroup}`,
            mode: "combined" as const,
            exercises: [exerciseDraft]
          });
        }

        return {
          dayNumber: day.dayNumber,
          title: day.title,
          notes: day.notes ?? "",
          items
        };
      })
    }
  };
}

export default async function AdminRoutineDraftPage({ params, searchParams }: AdminRoutineDraftPageProps) {
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
  const routineId = resolvedSearchParams?.routineId ? Number(resolvedSearchParams.routineId) : null;
  const [profile, routine] = await Promise.all([
    findProfileById(userId),
    routineId && Number.isInteger(routineId) ? findRoutineTemplateDetailById(routineId, "es") : Promise.resolve(null)
  ]);
  const formHref = `/admin/subscribers/${userId}/onboarding`;
  const routinesHref = `/admin/subscribers/${userId}/routines`;
  const initialDraft = routine?.ownerUserId === userId ? buildRoutineDraftFromDetail(routine) : null;

  return (
    <div className="bg-canvas text-primary min-h-screen">
      <LandingHeader content={content} showSectionLinks={false} />
      <main className="px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="section-kicker">{routineId ? "Editar rutina" : "Borrador de rutina"}</p>
              <h1 className="text-2xl font-semibold sm:text-3xl">{profile?.fullName ?? profile?.email ?? "Alumno"}</h1>
              {profile?.email ? <p className="text-muted mt-2 text-sm sm:text-base">{profile.email}</p> : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href={formHref} className="btn-secondary inline-block">
                Volver al formulario
              </Link>
              <Link href={routinesHref} className="btn-secondary inline-block">
                Volver a rutinas
              </Link>
            </div>
          </div>

          <AdminRoutineDraftEditor userId={userId} formHref={formHref} locale="es" initialDraft={initialDraft} routineId={routineId ?? undefined} />
        </div>
      </main>
    </div>
  );
}
