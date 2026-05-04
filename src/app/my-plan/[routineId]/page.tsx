import Link from "next/link";
import { redirect } from "next/navigation";
import { TbArrowLeft } from "react-icons/tb";

import { LandingHeader } from "@/features/landing/components/LandingHeader";
import { getLandingContent } from "@/features/landing/i18n/messages";
import { AppLocale } from "@/features/landing/i18n/types";
import { DownloadRoutinePdfButton } from "@/features/my-plan/components/DownloadRoutinePdfButton";
import { RoutineExerciseCard } from "@/features/my-plan/components/RoutineExerciseCard";
import { RoutineGuidePanel } from "@/features/my-plan/components/RoutineGuidePanel";
import { findCurrentActiveSubscriptionByUserId, findRoutineTemplateDetailById } from "@/lib/server/supabase-admin";
import { getCurrentAuthenticatedUser } from "@/lib/server/supabase-auth";
import { getRequestLocale } from "@/lib/i18n/get-request-locale";

type RoutineDetailPageProps = {
  params: Promise<{ routineId: string }>;
};

function getRoutineDetailCopy(locale: AppLocale) {
  if (locale === "es") {
    return {
      backLabel: "Volver a Mi Plan",
      dayLabel: "Dia",
      combinedDefaultLabel: "Superserie",
      combinedGroupPrefix: "Bloque",
      setsRepsLabel: "Series x reps",
      primaryMuscleLabel: "Musculo principal",
      restLabel: "Descanso",
      rirLabel: "RIR",
      tempoLabel: "Tempo",
      notesLabel: "Notas",
      secondsSuffix: "seg",
      noDaysMessage: "Esta rutina todavia no tiene dias cargados.",
      noExercisesMessage: "Todavia no hay ejercicios cargados para este dia.",
      downloadPdfLabel: "Descargar PDF",
      guideTitle: "Guia de la rutina",
      guideExpandLabel: "Ver mas",
      guideCollapseLabel: "Ver menos",
      exerciseExpandLabel: "Ver mas",
      exerciseCollapseLabel: "Ver menos",
      overviewLabel: "Overview",
      instructionsLabel: "Instrucciones",
      tipsLabel: "Tips",
      videoCtaLabel: "Ver video",
      openExternalLabel: "Se abre en una nueva pestaña"
    };
  }

  return {
    backLabel: "Back to My Plan",
    dayLabel: "Day",
    combinedDefaultLabel: "Superset",
    combinedGroupPrefix: "Block",
    setsRepsLabel: "Sets x reps",
    primaryMuscleLabel: "Primary muscle",
    restLabel: "Rest",
    rirLabel: "RIR",
    tempoLabel: "Tempo",
    notesLabel: "Notes",
    secondsSuffix: "sec",
    noDaysMessage: "This routine has no days loaded yet.",
    noExercisesMessage: "There are no exercises loaded for this day yet.",
    downloadPdfLabel: "Download PDF",
    guideTitle: "Routine guide",
    guideExpandLabel: "Show more",
    guideCollapseLabel: "Show less",
    exerciseExpandLabel: "Show more",
    exerciseCollapseLabel: "Show less",
    overviewLabel: "Overview",
    instructionsLabel: "Instructions",
    tipsLabel: "Tips",
    videoCtaLabel: "View video",
    openExternalLabel: "Opens in a new tab"
  };
}

function formatRepsLabel(repsMin: number | null, repsMax: number | null) {
  if (repsMin === null && repsMax === null) {
    return "-";
  }

  if (repsMin !== null && repsMax !== null) {
    return repsMin === repsMax ? `${repsMin}` : `${repsMin}-${repsMax}`;
  }

  if (repsMin !== null) {
    return `${repsMin}`;
  }

  return `${repsMax}`;
}

function formatSummaryItem(label: string, value: string | null) {
  if (!value) {
    return null;
  }

  return `${label}: ${value}`;
}

type RoutineExercise = {
  id: number;
  name: string;
  description: string | null;
  overview: string | null;
  instructions: string | null;
  tips: string | null;
  videoUrl: string | null;
  sourceUrl: string | null;
  primaryMuscleName: string | null;
  isCombined: boolean;
  combinedGroup: number | null;
  combinedIndex: number | null;
  combinedLabel: string | null;
  orderIndex: number;
  sets: number;
  repsMin: number | null;
  repsMax: number | null;
  restSeconds: number | null;
  rir: number | null;
  tempo: string | null;
  notes: string | null;
};

type DayRenderItem =
  | { kind: "single"; exercise: RoutineExercise }
  | { kind: "combined"; group: number; label: string | null; exercises: RoutineExercise[] };

function buildDayRenderItems(exercises: RoutineExercise[]) {
  const sorted = [...exercises].sort((a, b) => a.orderIndex - b.orderIndex);
  const combinedByGroup = new Map<number, { group: number; label: string | null; exercises: RoutineExercise[] }>();
  const itemOrder: Array<{ kind: "single"; exercise: RoutineExercise } | { kind: "combined"; group: number }> = [];

  for (const exercise of sorted) {
    if (exercise.isCombined && exercise.combinedGroup !== null) {
      const existingGroup = combinedByGroup.get(exercise.combinedGroup);
      if (!existingGroup) {
        combinedByGroup.set(exercise.combinedGroup, {
          group: exercise.combinedGroup,
          label: exercise.combinedLabel,
          exercises: [exercise]
        });
        itemOrder.push({ kind: "combined", group: exercise.combinedGroup });
      } else {
        existingGroup.exercises.push(exercise);
        if (!existingGroup.label && exercise.combinedLabel) {
          existingGroup.label = exercise.combinedLabel;
        }
      }
      continue;
    }

    itemOrder.push({ kind: "single", exercise });
  }

  const items: DayRenderItem[] = [];
  for (const item of itemOrder) {
    if (item.kind === "single") {
      items.push({ kind: "single", exercise: item.exercise });
      continue;
    }

    const group = combinedByGroup.get(item.group);
    if (!group) {
      continue;
    }

    const orderedGroupExercises = [...group.exercises].sort((a, b) => {
      const aIndex = a.combinedIndex ?? 0;
      const bIndex = b.combinedIndex ?? 0;
      if (aIndex !== bIndex) {
        return bIndex - aIndex;
      }
      return a.orderIndex - b.orderIndex;
    });

    items.push({
      kind: "combined",
      group: group.group,
      label: group.label,
      exercises: orderedGroupExercises
    });
  }

  return items;
}

export default async function RoutineDetailPage({ params }: RoutineDetailPageProps) {
  const [{ routineId }, locale] = await Promise.all([params, getRequestLocale()]);
  const content = getLandingContent(locale);
  const copy = getRoutineDetailCopy(locale);

  const numericRoutineId = Number(routineId);
  if (!Number.isInteger(numericRoutineId) || numericRoutineId <= 0) {
    redirect("/my-plan");
  }

  const user = await getCurrentAuthenticatedUser();
  if (!user) {
    redirect("/?auth=1");
  }

  const [subscription, routine] = await Promise.all([
    findCurrentActiveSubscriptionByUserId(user.id),
    findRoutineTemplateDetailById(numericRoutineId, locale)
  ]);

  if (!routine) {
    redirect("/my-plan");
  }

  const hasActiveSubscription = Boolean(subscription);
  const canDownloadRoutinePdf = subscription?.plan_code === "intermediate" || subscription?.plan_code === "premium";
  const canAccessBasicRoutine = routine.isBasic && hasActiveSubscription;
  const canAccessPersonalRoutine = !routine.isBasic && routine.ownerUserId === user.id;

  if (!canAccessBasicRoutine && !canAccessPersonalRoutine) {
    redirect("/my-plan");
  }

  return (
    <div className="bg-canvas text-primary routine-print min-h-screen">
      <div className="print:hidden">
        <LandingHeader content={content} showSectionLinks={false} />
      </div>

      <main className="px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto w-full max-w-4xl">
          <div className="flex items-start justify-between gap-3">
            <Link
              href="/my-plan"
              className="text-accent group routine-print-action inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-accent-hover"
            >
              <TbArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="group-hover:underline group-hover:decoration-2 group-hover:underline-offset-4">{copy.backLabel}</span>
            </Link>
            {canDownloadRoutinePdf ? (
              <div className="routine-print-action">
                <DownloadRoutinePdfButton label={copy.downloadPdfLabel} />
              </div>
            ) : null}
          </div>

          <header className="mt-4">
            <h1 className="text-primary text-2xl font-semibold sm:text-3xl">{routine.name}</h1>
            {routine.shortDescription || routine.description ? (
              <p className="text-muted mt-2 text-sm sm:text-base">{routine.shortDescription ?? routine.description}</p>
            ) : null}
          </header>

          {routine.longDescriptionMd ? (
            <section className="panel border-accent/30 mt-6 p-5 sm:p-6">
              <h2 className="text-accent text-lg font-semibold">{copy.guideTitle}</h2>
              <div className="mt-3">
                <RoutineGuidePanel
                  content={routine.longDescriptionMd}
                  expandLabel={copy.guideExpandLabel}
                  collapseLabel={copy.guideCollapseLabel}
                />
              </div>
            </section>
          ) : null}

          {!routine.days.length ? (
            <section className="panel border-accent/30 mt-6 p-5 sm:p-6">
              <p className="text-muted text-sm">{copy.noDaysMessage}</p>
            </section>
          ) : (
            <div className="mt-6 space-y-5">
              {routine.days.map((day) => (
                <section key={day.id} className="panel border-accent/30 p-5 sm:p-6">
                  <h2 className="text-accent text-lg font-semibold">
                    {copy.dayLabel} {day.dayNumber}: {day.title}
                  </h2>
                  {day.notes ? <p className="text-muted mt-1 text-sm">{day.notes}</p> : null}

                  {!day.exercises.length ? (
                    <div className="bg-canvas border-subtle mt-4 rounded-xl border p-4">
                      <p className="text-muted text-sm">{copy.noExercisesMessage}</p>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {buildDayRenderItems(day.exercises).map((item) => {
                        if (item.kind === "combined") {
                          const combinedOrderIndex = Math.min(...item.exercises.map((exercise) => exercise.orderIndex));
                          return (
                            <article key={`${day.id}-combined-${item.group}`} className="card">
                              <h3 className="text-accent text-sm font-semibold">
                                {combinedOrderIndex}. {item.label ?? `${copy.combinedDefaultLabel} ${copy.combinedGroupPrefix} ${item.group}`}
                              </h3>

                              <div className="mt-3 space-y-2">
                                {item.exercises.map((exercise) => {
                                  const reps = formatRepsLabel(exercise.repsMin, exercise.repsMax);
                                  const rest = exercise.restSeconds === null ? null : `${exercise.restSeconds} ${copy.secondsSuffix}`;
                                  const summaryItems = [
                                    formatSummaryItem(copy.setsRepsLabel, `${exercise.sets} x ${reps}`),
                                    formatSummaryItem(copy.restLabel, rest),
                                    formatSummaryItem(copy.rirLabel, exercise.rir === null ? null : `${exercise.rir}`),
                                    formatSummaryItem(copy.tempoLabel, exercise.tempo)
                                  ].filter(Boolean);

                                  return (
                                    <RoutineExerciseCard
                                      key={`${day.id}-${exercise.orderIndex}-${exercise.id}`}
                                      heading={exercise.name}
                                      primaryMuscleLabel={copy.primaryMuscleLabel}
                                      primaryMuscleName={exercise.primaryMuscleName}
                                      summary={summaryItems.length ? summaryItems.join(" | ") : null}
                                      description={exercise.description}
                                      overview={exercise.overview}
                                      instructions={exercise.instructions}
                                      tips={exercise.tips}
                                      notesLabel={copy.notesLabel}
                                      notes={exercise.notes}
                                      expandLabel={copy.exerciseExpandLabel}
                                      collapseLabel={copy.exerciseCollapseLabel}
                                      overviewLabel={copy.overviewLabel}
                                      instructionsLabel={copy.instructionsLabel}
                                      tipsLabel={copy.tipsLabel}
                                      videoCtaLabel={copy.videoCtaLabel}
                                      openExternalLabel={copy.openExternalLabel}
                                      videoUrl={exercise.videoUrl}
                                      sourceUrl={exercise.sourceUrl}
                                    />
                                  );
                                })}
                              </div>
                            </article>
                          );
                        }

                        const exercise = item.exercise;
                        const reps = formatRepsLabel(exercise.repsMin, exercise.repsMax);
                        const rest = exercise.restSeconds === null ? null : `${exercise.restSeconds} ${copy.secondsSuffix}`;
                        const summaryItems = [
                          formatSummaryItem(copy.setsRepsLabel, `${exercise.sets} x ${reps}`),
                          formatSummaryItem(copy.restLabel, rest),
                          formatSummaryItem(copy.rirLabel, exercise.rir === null ? null : `${exercise.rir}`),
                          formatSummaryItem(copy.tempoLabel, exercise.tempo)
                        ].filter(Boolean);

                        return (
                          <RoutineExerciseCard
                            key={`${day.id}-${exercise.orderIndex}-${exercise.id}`}
                            heading={`${exercise.orderIndex}. ${exercise.name}`}
                            primaryMuscleLabel={copy.primaryMuscleLabel}
                            primaryMuscleName={exercise.primaryMuscleName}
                            summary={summaryItems.length ? summaryItems.join(" | ") : null}
                            description={exercise.description}
                            overview={exercise.overview}
                            instructions={exercise.instructions}
                            tips={exercise.tips}
                            notesLabel={copy.notesLabel}
                            notes={exercise.notes}
                            expandLabel={copy.exerciseExpandLabel}
                            collapseLabel={copy.exerciseCollapseLabel}
                            overviewLabel={copy.overviewLabel}
                            instructionsLabel={copy.instructionsLabel}
                            tipsLabel={copy.tipsLabel}
                            videoCtaLabel={copy.videoCtaLabel}
                            openExternalLabel={copy.openExternalLabel}
                            videoUrl={exercise.videoUrl}
                            sourceUrl={exercise.sourceUrl}
                          />
                        );
                      })}
                    </div>
                  )}
                </section>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
