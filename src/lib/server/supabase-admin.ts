import type { RoutineImportDraft } from "@/lib/routines/routine-import-schema";

type JsonObject = Record<string, unknown>;
type PlanCode = "basic" | "intermediate" | "premium";
type SubscriptionStatus = "active" | "pending" | "canceled";
type AppLocale = "en" | "es";

type RoutineDayExerciseInsertRow = {
  routine_day_id: number;
  exercise_id: number;
  order_index: number;
  is_combined: boolean;
  combined_group: number | null;
  combined_index: number | null;
  combined_label: string | null;
  sets: number;
  reps_min: number | null;
  reps_max: number | null;
  rest_seconds: number | null;
  rir: number | null;
  notes: string | null;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function ensureSupabaseEnv() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  }
}

async function supabaseFetch(path: string, init: RequestInit) {
  ensureSupabaseEnv();

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY as string,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY as string}`,
      "Content-Type": "application/json",
      ...init.headers
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Supabase request failed (${response.status}): ${errorBody}`);
  }

  return response;
}

export async function insertRow(table: string, row: JsonObject) {
  await supabaseFetch(table, {
    method: "POST",
    headers: {
      Prefer: "return=minimal"
    },
    body: JSON.stringify(row)
  });
}

export async function upsertRow(table: string, row: JsonObject, conflictColumn: string) {
  const path = `${table}?on_conflict=${encodeURIComponent(conflictColumn)}`;

  await supabaseFetch(path, {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=minimal"
    },
    body: JSON.stringify(row)
  });
}

export async function findProfileIdByEmail(email: string): Promise<string | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const path = `profiles?select=id&email=eq.${encodeURIComponent(normalizedEmail)}&limit=1`;
  const response = await supabaseFetch(path, { method: "GET" });
  const rows = (await response.json()) as Array<{ id: string }>;

  if (!rows.length) {
    return null;
  }

  return rows[0].id;
}

export async function findCurrentActiveSubscriptionByUserId(userId: string) {
  const path = `subscriptions?select=id,plan_code,status&user_id=eq.${encodeURIComponent(userId)}&status=eq.active&order=created_at.desc&limit=1`;
  const response = await supabaseFetch(path, { method: "GET" });
  const rows = (await response.json()) as Array<{
    id: number;
    plan_code: "basic" | "intermediate" | "premium";
    status: "active";
  }>;

  if (!rows.length) {
    return null;
  }

  return rows[0];
}

export async function findCurrentActiveSubscriptionForCancellation(userId: string) {
  const path = `subscriptions?select=id,plan_code,status,mercadopago_payment_id,mercadopago_preference_id,metadata&user_id=eq.${encodeURIComponent(userId)}&status=eq.active&order=created_at.desc&limit=1`;
  const response = await supabaseFetch(path, { method: "GET" });
  const rows = (await response.json()) as Array<{
    id: number;
    plan_code: "basic" | "intermediate" | "premium";
    status: "active";
    mercadopago_payment_id: string | null;
    mercadopago_preference_id: string | null;
    metadata: Record<string, unknown> | null;
  }>;

  if (!rows.length) {
    return null;
  }

  return rows[0];
}

export async function cancelSubscriptionById(subscriptionId: number, cancelReason = "user_request") {
  const path = `subscriptions?id=eq.${subscriptionId}`;
  await supabaseFetch(path, {
    method: "PATCH",
    headers: {
      Prefer: "return=minimal"
    },
    body: JSON.stringify({
      status: "canceled",
      canceled_at: new Date().toISOString(),
      cancel_reason: cancelReason
    })
  });
}

export async function createActiveSubscriptionForUser(params: {
  userId: string;
  planCode: PlanCode;
  preapprovalId: string;
  externalReference: string;
  preapprovalPlanId: string;
  payerEmail: string;
  amount_ars: number;
}) {
  await insertRow("subscriptions", {
    user_id: params.userId,
    plan_code: params.planCode,
    status: "active",
    mercadopago_preference_id: params.preapprovalId,
    metadata: {
      preapproval_id: params.preapprovalId,
      preapproval_plan_id: params.preapprovalPlanId,
      external_reference: params.externalReference,
      payer_email: params.payerEmail,
      source: "preapproval_webhook_sync"
    },
    amount_ars: params.amount_ars
  });
}

export async function findSubscriptionByPreapprovalId(preapprovalId: string) {
  const path = `subscriptions?select=id,user_id,plan_code,status&mercadopago_preference_id=eq.${encodeURIComponent(preapprovalId)}&order=created_at.desc&limit=1`;
  const response = await supabaseFetch(path, { method: "GET" });
  const rows = (await response.json()) as Array<{
    id: number;
    user_id: string;
    plan_code: "basic" | "intermediate" | "premium";
    status: string;
  }>;

  if (!rows.length) {
    return null;
  }

  return rows[0];
}

export async function updateSubscriptionById(subscriptionId: number, fields: JsonObject) {
  const path = `subscriptions?id=eq.${subscriptionId}`;
  await supabaseFetch(path, {
    method: "PATCH",
    headers: {
      Prefer: "return=minimal"
    },
    body: JSON.stringify(fields)
  });
}

export async function isUserAdmin(userId: string): Promise<boolean> {
  const path = `profiles?select=is_admin&id=eq.${encodeURIComponent(userId)}&limit=1`;
  const response = await supabaseFetch(path, { method: "GET" });
  const rows = (await response.json()) as Array<{ is_admin?: boolean | null }>;
  return Boolean(rows[0]?.is_admin);
}

export async function findProfileById(userId: string) {
  const path = `profiles?select=id,email,full_name,is_admin,avatar_url&id=eq.${encodeURIComponent(userId)}&limit=1`;
  const response = await supabaseFetch(path, { method: "GET" });
  const rows = (await response.json()) as Array<{
    id: string;
    email: string | null;
    full_name: string | null;
    is_admin: boolean | null;
    avatar_url: string | null;
  }>;

  if (!rows.length) {
    return null;
  }

  const row = rows[0];
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    isAdmin: Boolean(row.is_admin),
    avatarUrl: row.avatar_url
  };
}

function slugifyRoutineName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

async function postSupabaseRows<T>(path: string, body: unknown): Promise<T[]> {
  const response = await supabaseFetch(path, {
    method: "POST",
    headers: {
      Prefer: "return=representation"
    },
    body: JSON.stringify(body)
  });

  return (await response.json()) as T[];
}

async function patchSupabaseRows(path: string, body: unknown) {
  await supabaseFetch(path, {
    method: "PATCH",
    headers: {
      Prefer: "return=minimal"
    },
    body: JSON.stringify(body)
  });
}

async function deleteSupabaseRows(path: string) {
  await supabaseFetch(path, {
    method: "DELETE",
    headers: {
      Prefer: "return=minimal"
    }
  });
}

function collectRoutineExerciseIds(draft: RoutineImportDraft) {
  const ids = new Set<number>();

  for (const day of draft.routine.days) {
    for (const item of day.items) {
      if (item.type === "single") {
        ids.add(item.exerciseId);
      } else {
        for (const exercise of item.exercises) {
          ids.add(exercise.exerciseId);
        }
      }
    }
  }

  return Array.from(ids);
}

async function listActiveExercisesByIds(exerciseIds: number[]) {
  if (!exerciseIds.length) {
    return new Map<
      number,
      {
        id: number;
        name: string;
        description: string | null;
        overview: string | null;
        instructions: string | null;
        tips: string | null;
        videoUrl: string | null;
        sourceUrl: string | null;
      }
    >();
  }

  const exercisePath = `exercises?select=id,name,description,overview,instructions,tips,video_url,source_url&is_active=eq.true&id=in.(${exerciseIds.join(",")})`;
  const exerciseResponse = await supabaseFetch(exercisePath, { method: "GET" });
  const activeExercises = (await exerciseResponse.json()) as Array<{
    id: number | string;
    name: string;
    description: string | null;
    overview: string | null;
    instructions: string | null;
    tips: string | null;
    video_url: string | null;
    source_url: string | null;
  }>;

  return new Map(
    activeExercises
      .map((exercise) => {
        const id = Number(exercise.id);
        return Number.isFinite(id)
          ? [
              id,
              {
                id,
                name: exercise.name,
                description: exercise.description,
                overview: exercise.overview,
                instructions: exercise.instructions,
                tips: exercise.tips,
                videoUrl: exercise.video_url,
                sourceUrl: exercise.source_url
              }
            ]
          : null;
      })
      .filter(
        (
          exercise
        ): exercise is [
          number,
          {
            id: number;
            name: string;
            description: string | null;
            overview: string | null;
            instructions: string | null;
            tips: string | null;
            videoUrl: string | null;
            sourceUrl: string | null;
          }
        ] => exercise !== null
      )
  );
}

export type AdminExerciseSearchResult = {
  id: number;
  name: string;
  description: string | null;
  overview: string | null;
  instructions: string | null;
  tips: string | null;
  videoUrl: string | null;
  sourceUrl: string | null;
};

type ExerciseTranslationSearchRow = {
  exercise_id: number | string;
  locale?: string | null;
  name: string | null;
  description: string | null;
  overview: string | null;
  instructions: string | null;
  tips: string | null;
};

type ExerciseTranslationWithExerciseSearchRow = ExerciseTranslationSearchRow & {
  exercise: {
    id: number | string;
    name: string;
    description: string | null;
    overview: string | null;
    instructions: string | null;
    tips: string | null;
    video_url: string | null;
    source_url: string | null;
  } | null;
};

function mapExerciseSearchRow(row: {
  id: number | string;
  name: string;
  description: string | null;
  overview: string | null;
  instructions: string | null;
  tips: string | null;
  video_url: string | null;
  source_url: string | null;
}): AdminExerciseSearchResult | null {
  const id = Number(row.id);
  if (!Number.isFinite(id)) {
    return null;
  }

  return {
    id,
    name: row.name,
    description: row.description,
    overview: row.overview,
    instructions: row.instructions,
    tips: row.tips,
    videoUrl: row.video_url,
    sourceUrl: row.source_url
  };
}

function applyExerciseTranslation(
  exercise: AdminExerciseSearchResult,
  translation?: Omit<ExerciseTranslationSearchRow, "exercise_id" | "locale">
): AdminExerciseSearchResult {
  if (!translation) {
    return exercise;
  }

  return {
    ...exercise,
    name: translation.name ?? exercise.name,
    description: translation.description ?? exercise.description,
    overview: translation.overview ?? exercise.overview,
    instructions: translation.instructions ?? exercise.instructions,
    tips: translation.tips ?? exercise.tips
  };
}

function getExerciseTranslationLocaleFilter(locale: AppLocale) {
  if (locale === "es") {
    return "locale=ilike.es*";
  }

  return `locale=eq.${encodeURIComponent(locale)}`;
}

async function listExerciseTranslationsByIds(exerciseIds: number[], locale: AppLocale) {
  if (locale === "en" || !exerciseIds.length) {
    return new Map<number, Omit<ExerciseTranslationSearchRow, "exercise_id" | "locale">>();
  }

  const translationsPath =
    `exercise_translations?select=exercise_id,locale,name,description,overview,instructions,tips` +
    `&exercise_id=in.(${exerciseIds.join(",")})&${getExerciseTranslationLocaleFilter(locale)}`;
  const response = await supabaseFetch(translationsPath, { method: "GET" });
  const rows = (await response.json()) as ExerciseTranslationSearchRow[];

  return new Map(
    rows
      .map((row) => {
        const exerciseId = Number(row.exercise_id);
        if (!Number.isFinite(exerciseId)) {
          return null;
        }

        return [
          exerciseId,
          {
            name: row.name,
            description: row.description,
            overview: row.overview,
            instructions: row.instructions,
            tips: row.tips
          }
        ] as const;
      })
      .filter(
        (
          row
        ): row is readonly [
          number,
          Omit<ExerciseTranslationSearchRow, "exercise_id" | "locale">
        ] => row !== null
      )
  );
}

async function listActiveExerciseSearchResultsByIds(exerciseIds: number[]) {
  if (!exerciseIds.length) {
    return new Map<number, AdminExerciseSearchResult>();
  }

  const response = await supabaseFetch(
    `exercises?select=id,name,description,overview,instructions,tips,video_url,source_url&id=in.(${exerciseIds.join(",")})&is_active=eq.true`,
    { method: "GET" }
  );
  const rows = (await response.json()) as Array<{
    id: number | string;
    name: string;
    description: string | null;
    overview: string | null;
    instructions: string | null;
    tips: string | null;
    video_url: string | null;
    source_url: string | null;
  }>;

  return new Map(rows.map(mapExerciseSearchRow).filter((row): row is AdminExerciseSearchResult => row !== null).map((row) => [row.id, row]));
}

async function searchActiveExerciseBaseResults(query: string, limit: number) {
  const normalizedQuery = query.trim();
  const safeLimit = Math.min(Math.max(limit, 1), 10);
  const filters = [
    "select=id,name,description,overview,instructions,tips,video_url,source_url",
    "is_active=eq.true",
    "order=name.asc",
    `limit=${safeLimit}`
  ];

  if (normalizedQuery) {
    const escapedQuery = normalizedQuery.replace(/[*,()]/g, " ");
    filters.push(`or=${encodeURIComponent(`(name.ilike.*${escapedQuery}*,slug.ilike.*${escapedQuery}*)`)}`);
  }

  const response = await supabaseFetch(`exercises?${filters.join("&")}`, { method: "GET" });
  const rows = (await response.json()) as Array<{
    id: number | string;
    name: string;
    description: string | null;
    overview: string | null;
    instructions: string | null;
    tips: string | null;
    video_url: string | null;
    source_url: string | null;
  }>;

  return rows.map(mapExerciseSearchRow).filter((row): row is AdminExerciseSearchResult => row !== null);
}

async function searchTranslatedExerciseResults(query: string, locale: AppLocale, limit: number) {
  const normalizedQuery = query.trim();
  const safeLimit = Math.min(Math.max(limit, 1), 10);
  const filters = [
    "select=exercise_id,locale,name,description,overview,instructions,tips,exercise:exercises!inner(id,name,description,overview,instructions,tips,video_url,source_url)",
    getExerciseTranslationLocaleFilter(locale),
    "exercise.is_active=eq.true",
    "order=name.asc",
    `limit=${safeLimit}`
  ];

  if (normalizedQuery) {
    const escapedQuery = normalizedQuery.replace(/[*,()]/g, " ");
    filters.push(`name=ilike.${encodeURIComponent(`*${escapedQuery}*`)}`);
  }

  const response = await supabaseFetch(`exercise_translations?${filters.join("&")}`, { method: "GET" });
  const translationRows = (await response.json()) as ExerciseTranslationWithExerciseSearchRow[];

  return translationRows
    .map((translation) => {
      const exercise = translation.exercise ? mapExerciseSearchRow(translation.exercise) : null;
      return exercise ? applyExerciseTranslation(exercise, translation) : null;
    })
    .filter((exercise): exercise is AdminExerciseSearchResult => exercise !== null);
}

export async function searchActiveExercisesForAdmin(query: string, locale: AppLocale = "es", limit = 5) {
  const safeLimit = Math.min(Math.max(limit, 1), 10);

  if (locale === "en") {
    return searchActiveExerciseBaseResults(query, safeLimit);
  }

  const translatedNameResults = await searchTranslatedExerciseResults(query, locale, safeLimit);
  const resultsById = new Map(translatedNameResults.map((exercise) => [exercise.id, exercise]));

  if (resultsById.size < safeLimit) {
    const remainingLimit = safeLimit - resultsById.size;
    const baseResults = await searchActiveExerciseBaseResults(query, remainingLimit);
    const translationsById = await listExerciseTranslationsByIds(
      baseResults.map((exercise) => exercise.id),
      locale
    );

    for (const exercise of baseResults) {
      if (resultsById.size >= safeLimit) {
        break;
      }

      if (!resultsById.has(exercise.id)) {
        resultsById.set(exercise.id, applyExerciseTranslation(exercise, translationsById.get(exercise.id)));
      }
    }
  }

  return Array.from(resultsById.values()).slice(0, safeLimit);
}

export async function hydrateRoutineImportDraftWithExercises(draft: RoutineImportDraft) {
  const exerciseIds = collectRoutineExerciseIds(draft);
  if (!exerciseIds.length) {
    throw new Error("La rutina no tiene ejercicios.");
  }

  const activeExercisesById = await listActiveExercisesByIds(exerciseIds);
  const missingExerciseIds = exerciseIds.filter((id) => !activeExercisesById.has(id));

  if (missingExerciseIds.length) {
    throw new Error(`Estos exerciseId no existen o no estan activos: ${missingExerciseIds.join(", ")}.`);
  }

  return {
    ...draft,
    routine: {
      ...draft.routine,
      days: draft.routine.days.map((day) => ({
        ...day,
        items: day.items.map((item) => {
          if (item.type === "single") {
            const exerciseInfo = activeExercisesById.get(item.exerciseId);
            return {
              ...item,
              exerciseName: exerciseInfo?.name ?? item.exerciseName,
              exerciseInfo: exerciseInfo
                ? {
                    description: exerciseInfo.description,
                    overview: exerciseInfo.overview,
                    instructions: exerciseInfo.instructions,
                    tips: exerciseInfo.tips,
                    videoUrl: exerciseInfo.videoUrl,
                    sourceUrl: exerciseInfo.sourceUrl
                  }
                : null
            };
          }

          return {
            ...item,
            exercises: item.exercises.map((exercise) => {
              const exerciseInfo = activeExercisesById.get(exercise.exerciseId);
              return {
                ...exercise,
                exerciseName: exerciseInfo?.name ?? exercise.exerciseName,
                exerciseInfo: exerciseInfo
                  ? {
                      description: exerciseInfo.description,
                      overview: exerciseInfo.overview,
                      instructions: exerciseInfo.instructions,
                      tips: exerciseInfo.tips,
                      videoUrl: exerciseInfo.videoUrl,
                      sourceUrl: exerciseInfo.sourceUrl
                    }
                  : null
              };
            })
          };
        })
      }))
    }
  };
}

export async function createPersonalizedRoutineFromDraft(params: {
  userId: string;
  createdByUserId: string;
  draft: RoutineImportDraft;
}) {
  const targetProfile = await findProfileById(params.userId);
  if (!targetProfile) {
    throw new Error("No encontramos el usuario para asignar la rutina.");
  }

  await hydrateRoutineImportDraftWithExercises(params.draft);

  const slugBase = slugifyRoutineName(params.draft.routine.name) || "rutina-personalizada";
  const slug = `${slugBase}-${Date.now()}`;
  const [template] = await postSupabaseRows<{ id: number }>("routine_templates?select=id", {
    name: params.draft.routine.name,
    slug,
    description: params.draft.routine.description,
    short_description: params.draft.routine.shortDescription || null,
    long_description_md: params.draft.routine.longDescriptionMd || null,
    difficulty: params.draft.routine.difficulty,
    is_basic: false,
    owner_user_id: params.userId,
    created_by_user_id: params.createdByUserId,
    is_active: true
  });

  if (!template?.id) {
    throw new Error("No se pudo crear la rutina.");
  }

  const dayRows = params.draft.routine.days.map((day) => ({
    routine_template_id: template.id,
    day_number: day.dayNumber,
    title: day.title,
    notes: day.notes || null
  }));
  const insertedDays = await postSupabaseRows<{ id: number; day_number: number }>("routine_days?select=id,day_number", dayRows);
  const dayIdByNumber = new Map(insertedDays.map((day) => [day.day_number, day.id]));

  const exerciseRows: RoutineDayExerciseInsertRow[] = [];

  for (const day of params.draft.routine.days) {
    const routineDayId = dayIdByNumber.get(day.dayNumber);
    if (!routineDayId) {
      throw new Error(`No se pudo crear el dia ${day.dayNumber}.`);
    }

    day.items.forEach((item, itemIndex) => {
      const orderIndex = itemIndex + 1;

      if (item.type === "single") {
        exerciseRows.push({
          routine_day_id: routineDayId,
          exercise_id: item.exerciseId,
          order_index: orderIndex,
          is_combined: false,
          combined_group: null,
          combined_index: null,
          combined_label: null,
          sets: item.sets,
          reps_min: item.repsMin,
          reps_max: item.repsMax,
          rest_seconds: item.restSeconds,
          rir: item.rir,
          notes: item.notes || null
        });
        return;
      }

      item.exercises.forEach((exercise, exerciseIndex) => {
        exerciseRows.push({
          routine_day_id: routineDayId,
          exercise_id: exercise.exerciseId,
          order_index: orderIndex,
          is_combined: true,
          combined_group: orderIndex,
          combined_index: exerciseIndex + 1,
          combined_label: item.label,
          sets: exercise.sets,
          reps_min: exercise.repsMin,
          reps_max: exercise.repsMax,
          rest_seconds: exercise.restSeconds,
          rir: exercise.rir,
          notes: exercise.notes || null
        });
      });
    });
  }

  await postSupabaseRows("routine_day_exercises?select=id", exerciseRows);

  await postSupabaseRows("user_routine_assignments?select=id", {
    user_id: params.userId,
    routine_template_id: template.id,
    status: "active",
    notes: "Rutina creada desde importacion JSON del formulario."
  });

  return {
    routineId: template.id
  };
}

async function replaceRoutineDaysAndExercises(routineTemplateId: number, draft: RoutineImportDraft) {
  await deleteSupabaseRows(`routine_days?routine_template_id=eq.${routineTemplateId}`);

  const dayRows = draft.routine.days.map((day) => ({
    routine_template_id: routineTemplateId,
    day_number: day.dayNumber,
    title: day.title,
    notes: day.notes || null
  }));
  const insertedDays = await postSupabaseRows<{ id: number; day_number: number }>("routine_days?select=id,day_number", dayRows);
  const dayIdByNumber = new Map(insertedDays.map((day) => [day.day_number, day.id]));

  const exerciseRows: RoutineDayExerciseInsertRow[] = [];

  for (const day of draft.routine.days) {
    const routineDayId = dayIdByNumber.get(day.dayNumber);
    if (!routineDayId) {
      throw new Error(`No se pudo crear el dia ${day.dayNumber}.`);
    }

    day.items.forEach((item, itemIndex) => {
      const orderIndex = itemIndex + 1;

      if (item.type === "single") {
        exerciseRows.push({
          routine_day_id: routineDayId,
          exercise_id: item.exerciseId,
          order_index: orderIndex,
          is_combined: false,
          combined_group: null,
          combined_index: null,
          combined_label: null,
          sets: item.sets,
          reps_min: item.repsMin,
          reps_max: item.repsMax,
          rest_seconds: item.restSeconds,
          rir: item.rir,
          notes: item.notes || null
        });
        return;
      }

      item.exercises.forEach((exercise, exerciseIndex) => {
        exerciseRows.push({
          routine_day_id: routineDayId,
          exercise_id: exercise.exerciseId,
          order_index: orderIndex,
          is_combined: true,
          combined_group: orderIndex,
          combined_index: exerciseIndex + 1,
          combined_label: item.label,
          sets: exercise.sets,
          reps_min: exercise.repsMin,
          reps_max: exercise.repsMax,
          rest_seconds: exercise.restSeconds,
          rir: exercise.rir,
          notes: exercise.notes || null
        });
      });
    });
  }

  await postSupabaseRows("routine_day_exercises?select=id", exerciseRows);
}

export async function updatePersonalizedRoutineTemplateFromDraft(params: {
  routineId: number;
  userId: string;
  draft: RoutineImportDraft;
}) {
  const existingResponse = await supabaseFetch(
    `routine_templates?select=id&owner_user_id=eq.${encodeURIComponent(params.userId)}&id=eq.${params.routineId}&is_basic=eq.false&limit=1`,
    { method: "GET" }
  );
  const existingRows = (await existingResponse.json()) as Array<{ id: number }>;
  if (!existingRows.length) {
    throw new Error("No encontramos la rutina personalizada para editar.");
  }

  await hydrateRoutineImportDraftWithExercises(params.draft);

  await patchSupabaseRows(`routine_templates?id=eq.${params.routineId}&owner_user_id=eq.${encodeURIComponent(params.userId)}&is_basic=eq.false`, {
    name: params.draft.routine.name,
    description: params.draft.routine.description,
    short_description: params.draft.routine.shortDescription || null,
    long_description_md: params.draft.routine.longDescriptionMd || null,
    difficulty: params.draft.routine.difficulty,
    is_active: true
  });

  await replaceRoutineDaysAndExercises(params.routineId, params.draft);

  return {
    routineId: params.routineId
  };
}

export async function listPersonalizedRoutineTemplatesByUserId(userId: string) {
  const path =
    `routine_templates?select=id,name,description,short_description,difficulty,is_active,created_at,updated_at` +
    `&owner_user_id=eq.${encodeURIComponent(userId)}&is_basic=eq.false&is_active=eq.true&order=created_at.desc`;
  const response = await supabaseFetch(path, { method: "GET" });
  const rows = (await response.json()) as Array<{
    id: number;
    name: string;
    description: string | null;
    short_description: string | null;
    difficulty: "beginner" | "intermediate" | "advanced" | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }>;

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    shortDescription: row.short_description,
    difficulty: row.difficulty,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

export async function deactivatePersonalizedRoutineTemplateForUser(params: { routineId: number; userId: string }) {
  await supabaseFetch(`routine_templates?id=eq.${params.routineId}&owner_user_id=eq.${encodeURIComponent(params.userId)}&is_basic=eq.false`, {
    method: "PATCH",
    headers: {
      Prefer: "return=minimal"
    },
    body: JSON.stringify({
      is_active: false
    })
  });
}

export async function updateProfileAvatarUrlByUserId(userId: string, avatarUrl: string) {
  await supabaseFetch(`profiles?id=eq.${encodeURIComponent(userId)}`, {
    method: "PATCH",
    headers: {
      Prefer: "return=minimal"
    },
    body: JSON.stringify({
      avatar_url: avatarUrl
    })
  });
}

export async function listBasicRoutineTemplates(locale: AppLocale = "es") {
  const pathWithRichDescription =
    "routine_templates?select=id,name,description,short_description&is_basic=eq.true&is_active=eq.true&order=created_at.asc";
  const pathLegacy = "routine_templates?select=id,name,description&is_basic=eq.true&is_active=eq.true&order=created_at.asc";

  type RoutineTemplateListRow = {
    id: number;
    name: string;
    description: string | null;
    short_description?: string | null;
  };

  let rows: RoutineTemplateListRow[] = [];
  try {
    const response = await supabaseFetch(pathWithRichDescription, { method: "GET" });
    rows = (await response.json()) as RoutineTemplateListRow[];
  } catch {
    const response = await supabaseFetch(pathLegacy, { method: "GET" });
    rows = (await response.json()) as RoutineTemplateListRow[];
  }

  let translationsByTemplateId = new Map<number, { name: string | null; shortDescription: string | null; description: string | null }>();
  if (locale !== "es" && rows.length > 0) {
    const ids = rows.map((row) => row.id).join(",");
    const translationsPath =
      `routine_template_translations?select=routine_template_id,name,short_description,description` +
      `&routine_template_id=in.(${ids})&locale=eq.${encodeURIComponent(locale)}`;
    try {
      const response = await supabaseFetch(translationsPath, { method: "GET" });
      const translationRows = (await response.json()) as Array<{
        routine_template_id: number;
        name: string | null;
        short_description: string | null;
        description: string | null;
      }>;
      translationsByTemplateId = new Map(
        translationRows.map((row) => [
          row.routine_template_id,
          {
            name: row.name,
            shortDescription: row.short_description,
            description: row.description
          }
        ])
      );
    } catch {
      translationsByTemplateId = new Map();
    }
  }

  return rows.map((row) => {
    const translation = translationsByTemplateId.get(row.id);
    const shortDescription = translation?.shortDescription ?? row.short_description ?? "";
    const baseDescription = translation?.description ?? row.description ?? "";
    return {
      id: String(row.id),
      title: translation?.name ?? row.name,
      description: shortDescription || baseDescription
    };
  });
}

type RoutineExerciseDetail = {
  id: number;
  name: string;
  description: string | null;
  overview: string | null;
  instructions: string | null;
  tips: string | null;
  videoUrl: string | null;
  sourceUrl: string | null;
  primaryMuscleName: string | null;
  primaryMuscleSlug: string | null;
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
  notes: string | null;
};

type RoutineDayDetail = {
  id: number;
  dayNumber: number;
  title: string;
  notes: string | null;
  exercises: RoutineExerciseDetail[];
};

export async function findRoutineTemplateDetailById(routineId: number, locale: AppLocale = "es") {
  const templatePathWithRichDescription =
    `routine_templates?select=id,name,description,short_description,long_description_md,is_basic,owner_user_id,is_active` +
    `&id=eq.${routineId}&is_active=eq.true&limit=1`;
  const templatePathLegacy =
    `routine_templates?select=id,name,description,is_basic,owner_user_id,is_active` +
    `&id=eq.${routineId}&is_active=eq.true&limit=1`;

  type RoutineTemplateDetailRow = {
    id: number;
    name: string;
    description: string | null;
    short_description?: string | null;
    long_description_md?: string | null;
    is_basic: boolean;
    owner_user_id: string | null;
    is_active: boolean;
  };

  let templateRows: RoutineTemplateDetailRow[] = [];
  try {
    const templateResponse = await supabaseFetch(templatePathWithRichDescription, { method: "GET" });
    templateRows = (await templateResponse.json()) as RoutineTemplateDetailRow[];
  } catch {
    const templateResponse = await supabaseFetch(templatePathLegacy, { method: "GET" });
    templateRows = (await templateResponse.json()) as RoutineTemplateDetailRow[];
  }

  if (!templateRows.length) {
    return null;
  }

  let template = templateRows[0];

  if (locale !== "es") {
    const templateTranslationsPath =
      `routine_template_translations?select=name,description,short_description,long_description_md` +
      `&routine_template_id=eq.${routineId}&locale=eq.${encodeURIComponent(locale)}&limit=1`;
    try {
      const templateTranslationResponse = await supabaseFetch(templateTranslationsPath, { method: "GET" });
      const translationRows = (await templateTranslationResponse.json()) as Array<{
        name: string | null;
        description: string | null;
        short_description: string | null;
        long_description_md: string | null;
      }>;
      const translation = translationRows[0];
      if (translation) {
        template = {
          ...template,
          name: translation.name ?? template.name,
          description: translation.description ?? template.description,
          short_description: translation.short_description ?? template.short_description ?? null,
          long_description_md: translation.long_description_md ?? template.long_description_md ?? null
        };
      }
    } catch {
      // Fallback to canonical es fields from routine_templates.
    }
  }

  const daysPath =
    `routine_days?select=id,day_number,title,notes` +
    `&routine_template_id=eq.${routineId}&order=day_number.asc`;
  const daysResponse = await supabaseFetch(daysPath, { method: "GET" });
  const dayRows = (await daysResponse.json()) as Array<{
    id: number;
    day_number: number;
    title: string;
    notes: string | null;
  }>;

  if (!dayRows.length) {
    return {
      id: template.id,
      name: template.name,
      description: template.description,
      shortDescription: template.short_description ?? null,
      longDescriptionMd: template.long_description_md ?? null,
      isBasic: template.is_basic,
      ownerUserId: template.owner_user_id,
      days: [] as RoutineDayDetail[]
    };
  }

  const dayIds = dayRows.map((day) => day.id);
  const dayIdsClause = dayIds.join(",");
  const exercisesPathWithCombined =
    `routine_day_exercises?select=id,routine_day_id,order_index,is_combined,combined_group,combined_index,combined_label,sets,reps_min,reps_max,rest_seconds,rir,notes,` +
    `exercise:exercises(id,name,description,overview,instructions,tips,video_url,source_url)` +
    `&routine_day_id=in.(${dayIdsClause})` +
    `&order=order_index.asc`;
  const exercisesPathLegacy =
    `routine_day_exercises?select=id,routine_day_id,order_index,sets,reps_min,reps_max,rest_seconds,rir,notes,` +
    `exercise:exercises(id,name,description,overview,instructions,tips,video_url,source_url)` +
    `&routine_day_id=in.(${dayIdsClause})` +
    `&order=order_index.asc`;

  type RoutineDayExerciseRow = {
    id: number;
    routine_day_id: number;
    order_index: number;
    is_combined?: boolean | null;
    combined_group?: number | null;
    combined_index?: number | null;
    combined_label?: string | null;
    sets: number;
    reps_min: number | null;
    reps_max: number | null;
    rest_seconds: number | null;
    rir: number | null;
    notes: string | null;
    exercise: {
      id: number | string;
      name: string;
      description: string | null;
      overview: string | null;
      instructions: string | null;
      tips: string | null;
      video_url: string | null;
      source_url: string | null;
    } | null;
  };

  let exerciseRows: RoutineDayExerciseRow[] = [];
  try {
    const exercisesResponse = await supabaseFetch(exercisesPathWithCombined, { method: "GET" });
    exerciseRows = (await exercisesResponse.json()) as RoutineDayExerciseRow[];
  } catch {
    const exercisesResponse = await supabaseFetch(exercisesPathLegacy, { method: "GET" });
    exerciseRows = (await exercisesResponse.json()) as RoutineDayExerciseRow[];
  }

  const exerciseIds = Array.from(
    new Set(
      exerciseRows
        .map((row) => {
          if (!row.exercise?.id) {
            return null;
          }
          const parsedId = Number(row.exercise.id);
          return Number.isFinite(parsedId) ? parsedId : null;
        })
        .filter((id): id is number => id !== null)
    )
  );

  let primaryMuscleByExerciseId = new Map<number, { name: string | null; slug: string | null }>();
  if (exerciseIds.length > 0) {
    const exerciseIdsClause = exerciseIds.join(",");
    const musclesPath =
      `exercise_muscle_groups?select=exercise_id,muscle_group:muscle_groups(name,slug)` +
      `&exercise_id=in.(${exerciseIdsClause})&is_primary=eq.true`;
    const musclesResponse = await supabaseFetch(musclesPath, { method: "GET" });
    const muscleRows = (await musclesResponse.json()) as Array<{
      exercise_id: number;
      muscle_group: {
        name: string | null;
        slug: string | null;
      } | null;
    }>;

    primaryMuscleByExerciseId = new Map(
      muscleRows.map((row) => [
        row.exercise_id,
        {
          name: row.muscle_group?.name ?? null,
          slug: row.muscle_group?.slug ?? null
        }
      ])
    );
  }

  let translationsByExerciseId = new Map<
    number,
    { name: string | null; description: string | null; overview: string | null; instructions: string | null; tips: string | null }
  >();
  if (locale !== "en" && exerciseIds.length > 0) {
    const exerciseIdsClause = exerciseIds.join(",");
    const translationsPath =
      `exercise_translations?select=exercise_id,name,description,overview,instructions,tips` +
      `&exercise_id=in.(${exerciseIdsClause})&locale=eq.${encodeURIComponent(locale)}`;

    try {
      const translationsResponse = await supabaseFetch(translationsPath, { method: "GET" });
      let translationRows = (await translationsResponse.json()) as Array<{
        exercise_id: number | string;
        name: string | null;
        description: string | null;
        overview: string | null;
        instructions: string | null;
        tips: string | null;
      }>;

      // Safety fallback: if locale-scoped filter returns no rows for ES, fetch all locales
      // for those exercise IDs and resolve the ES variant in memory.
      if (translationRows.length === 0 && locale === "es") {
        const fallbackTranslationsPath =
          `exercise_translations?select=exercise_id,locale,name,description,overview,instructions,tips` +
          `&exercise_id=in.(${exerciseIdsClause})`;
        const fallbackResponse = await supabaseFetch(fallbackTranslationsPath, { method: "GET" });
        const fallbackRows = (await fallbackResponse.json()) as Array<{
          exercise_id: number | string;
          locale: string | null;
          name: string | null;
          description: string | null;
          overview: string | null;
          instructions: string | null;
          tips: string | null;
        }>;

        translationRows = fallbackRows
          .filter((row) => (row.locale ?? "").toLowerCase().startsWith("es"))
          .map((row) => ({
            exercise_id: row.exercise_id,
            name: row.name,
            description: row.description,
            overview: row.overview,
            instructions: row.instructions,
            tips: row.tips
          }));
      }

      translationsByExerciseId = new Map(
        translationRows
          .map((row) => {
            const exerciseId = Number(row.exercise_id);
            if (!Number.isFinite(exerciseId)) {
              return null;
            }

            return [
              exerciseId,
              {
                name: row.name,
                description: row.description,
                overview: row.overview,
                instructions: row.instructions,
                tips: row.tips
              }
            ] as const;
          })
          .filter(
            (
              row
            ): row is readonly [
              number,
              { name: string | null; description: string | null; overview: string | null; instructions: string | null; tips: string | null }
            ] => row !== null
          )
      );
    } catch {
      translationsByExerciseId = new Map();
    }
  }

  const exercisesByDay = exerciseRows.reduce<Map<number, RoutineExerciseDetail[]>>((acc, row) => {
    if (!row.exercise) {
      return acc;
    }
    const exerciseId = Number(row.exercise.id);
    if (!Number.isFinite(exerciseId)) {
      return acc;
    }

    const current = acc.get(row.routine_day_id) ?? [];
    const translation = translationsByExerciseId.get(exerciseId);
    current.push({
      id: exerciseId,
      name: translation?.name ?? row.exercise.name,
      description: translation?.description ?? row.exercise.description,
      overview: translation?.overview ?? row.exercise.overview,
      instructions: translation?.instructions ?? row.exercise.instructions,
      tips: translation?.tips ?? row.exercise.tips,
      videoUrl: row.exercise.video_url,
      sourceUrl: row.exercise.source_url,
      primaryMuscleName: primaryMuscleByExerciseId.get(exerciseId)?.name ?? null,
      primaryMuscleSlug: primaryMuscleByExerciseId.get(exerciseId)?.slug ?? null,
      isCombined: Boolean(row.is_combined),
      combinedGroup: row.combined_group ?? null,
      combinedIndex: row.combined_index ?? null,
      combinedLabel: row.combined_label ?? null,
      orderIndex: row.order_index,
      sets: row.sets,
      repsMin: row.reps_min,
      repsMax: row.reps_max,
      restSeconds: row.rest_seconds,
      rir: row.rir,
      notes: row.notes
    });
    acc.set(row.routine_day_id, current);
    return acc;
  }, new Map<number, RoutineExerciseDetail[]>());

  let dayTranslationByDayId = new Map<number, { title: string | null; notes: string | null }>();
  if (locale !== "es" && dayRows.length > 0) {
    const dayIdsClause = dayRows.map((day) => day.id).join(",");
    const dayTranslationsPath =
      `routine_day_translations?select=routine_day_id,title,notes` +
      `&routine_day_id=in.(${dayIdsClause})&locale=eq.${encodeURIComponent(locale)}`;
    try {
      const dayTranslationResponse = await supabaseFetch(dayTranslationsPath, { method: "GET" });
      const dayTranslationRows = (await dayTranslationResponse.json()) as Array<{
        routine_day_id: number;
        title: string | null;
        notes: string | null;
      }>;
      dayTranslationByDayId = new Map(
        dayTranslationRows.map((row) => [
          row.routine_day_id,
          {
            title: row.title,
            notes: row.notes
          }
        ])
      );
    } catch {
      dayTranslationByDayId = new Map();
    }
  }

  const days = dayRows.map((day) => {
    const dayTranslation = dayTranslationByDayId.get(day.id);
    return {
    id: day.id,
    dayNumber: day.day_number,
    title: dayTranslation?.title ?? day.title,
    notes: dayTranslation?.notes ?? day.notes,
    exercises: exercisesByDay.get(day.id) ?? []
    };
  });

  return {
    id: template.id,
    name: template.name,
    description: template.description,
    shortDescription: template.short_description ?? null,
    longDescriptionMd: template.long_description_md ?? null,
    isBasic: template.is_basic,
    ownerUserId: template.owner_user_id,
    days
  };
}

type ListSubscribersParams = {
  status?: SubscriptionStatus | "all";
  plan?: PlanCode | "all";
  onboarding?: "all" | "with" | "without";
  routines?: "all" | "with" | "without";
  q?: string;
  limit?: number;
};

export async function listSubscribers(params: ListSubscribersParams) {
  const status = params.status ?? "all";
  const plan = params.plan ?? "all";
  const onboarding = params.onboarding ?? "all";
  const routines = params.routines ?? "all";
  const q = params.q?.trim().toLowerCase() ?? "";
  const limit = Math.min(Math.max(params.limit ?? 200, 1), 500);

  const filters: string[] = [
    "select=id,user_id,plan_code,status,created_at,canceled_at",
    `order=${encodeURIComponent("created_at.desc")}`,
    `limit=${limit}`
  ];

  if (status !== "all") {
    filters.push(`status=eq.${encodeURIComponent(status)}`);
  }

  if (plan !== "all") {
    filters.push(`plan_code=eq.${encodeURIComponent(plan)}`);
  }

  const subscriptionsPath = `subscriptions?${filters.join("&")}`;
  const subscriptionsResponse = await supabaseFetch(subscriptionsPath, { method: "GET" });
  const subscriptions = (await subscriptionsResponse.json()) as Array<{
    id: number;
    user_id: string;
    plan_code: PlanCode;
    status: SubscriptionStatus;
    created_at: string;
    canceled_at: string | null;
  }>;

  const uniqueUserIds = Array.from(new Set(subscriptions.map((row) => row.user_id).filter(Boolean)));
  let profilesById = new Map<string, { email: string | null; fullName: string | null }>();
  let routineCountByUserId = new Map<string, number>();
  let nutritionCountByUserId = new Map<string, number>();
  let onboardingByUserId = new Map<string, { status: "draft" | "submitted"; submittedAt: string | null }>();

  if (uniqueUserIds.length > 0) {
    const inClause = uniqueUserIds.map((id) => `"${id}"`).join(",");
    const profilesPath = `profiles?select=id,email,full_name&id=in.(${encodeURIComponent(inClause)})`;
    const personalizedRoutinesPath =
      `routine_templates?select=owner_user_id` +
      `&owner_user_id=in.(${encodeURIComponent(inClause)})&is_basic=eq.false&is_active=eq.true`;
    const onboardingPath =
      `onboarding_answers?select=user_id,status,submitted_at` +
      `&user_id=in.(${encodeURIComponent(inClause)})`;
    const nutritionResourcesPath =
      `nutrition_resources?select=user_id` +
      `&user_id=in.(${encodeURIComponent(inClause)})&is_active=eq.true`;

    const [profilesResponse, personalizedRoutinesResponse, onboardingResponse] = await Promise.all([
      supabaseFetch(profilesPath, { method: "GET" }),
      supabaseFetch(personalizedRoutinesPath, { method: "GET" }),
      supabaseFetch(onboardingPath, { method: "GET" })
    ]);

    const profiles = (await profilesResponse.json()) as Array<{
      id: string;
      email: string | null;
      full_name: string | null;
    }>;
    const personalizedRoutines = (await personalizedRoutinesResponse.json()) as Array<{
      owner_user_id: string | null;
    }>;
    const onboardingRows = (await onboardingResponse.json()) as Array<{
      user_id: string;
      status: "draft" | "submitted";
      submitted_at: string | null;
    }>;
    let nutritionRows: Array<{ user_id: string | null }> = [];
    try {
      const nutritionResourcesResponse = await supabaseFetch(nutritionResourcesPath, { method: "GET" });
      nutritionRows = (await nutritionResourcesResponse.json()) as Array<{ user_id: string | null }>;
    } catch {
      nutritionRows = [];
    }

    profilesById = new Map(
      profiles.map((profile) => [
        profile.id,
        {
          email: profile.email,
          fullName: profile.full_name
        }
      ])
    );

    routineCountByUserId = personalizedRoutines.reduce<Map<string, number>>((acc, row) => {
      if (!row.owner_user_id) {
        return acc;
      }

      acc.set(row.owner_user_id, (acc.get(row.owner_user_id) ?? 0) + 1);
      return acc;
    }, new Map<string, number>());

    nutritionCountByUserId = nutritionRows.reduce<Map<string, number>>((acc, row) => {
      if (!row.user_id) {
        return acc;
      }

      acc.set(row.user_id, (acc.get(row.user_id) ?? 0) + 1);
      return acc;
    }, new Map<string, number>());

    onboardingByUserId = new Map(
      onboardingRows.map((row) => [
        row.user_id,
        {
          status: row.status,
          submittedAt: row.submitted_at
        }
      ])
    );
  }

  const subscriptionsByUserId = subscriptions.reduce<Map<string, typeof subscriptions>>((acc, subscription) => {
    const current = acc.get(subscription.user_id) ?? [];
    current.push(subscription);
    acc.set(subscription.user_id, current);
    return acc;
  }, new Map<string, typeof subscriptions>());

  const merged = Array.from(subscriptionsByUserId.entries()).map(([userId, userSubscriptions]) => {
    const sortedSubscriptions = [...userSubscriptions].sort((a, b) => {
      if (a.status === "active" && b.status !== "active") {
        return -1;
      }
      if (a.status !== "active" && b.status === "active") {
        return 1;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    const selectedSubscription = sortedSubscriptions[0];
    const profile = profilesById.get(userId);
    const onboarding = onboardingByUserId.get(userId);
    const routineCount = routineCountByUserId.get(userId) ?? 0;
    const nutritionCount = nutritionCountByUserId.get(userId) ?? 0;
    const hasOnboarding = Boolean(onboarding);

    return {
      id: selectedSubscription.id,
      userId,
      planCode: selectedSubscription.plan_code,
      status: selectedSubscription.status,
      createdAt: selectedSubscription.created_at,
      canceledAt: selectedSubscription.canceled_at,
      email: profile?.email ?? null,
      fullName: profile?.fullName ?? null,
      routineCount,
      hasRoutines: routineCount > 0,
      nutritionCount,
      hasNutrition: nutritionCount > 0,
      onboardingStatus: onboarding?.status ?? null,
      hasOnboarding,
      subscriptionHistory: sortedSubscriptions.map((subscription) => ({
        id: subscription.id,
        planCode: subscription.plan_code,
        status: subscription.status,
        createdAt: subscription.created_at,
        canceledAt: subscription.canceled_at
      }))
    };
  });

  const filtered = merged.filter((row) => {
    if (onboarding === "with" && !row.hasOnboarding) {
      return false;
    }

    if (onboarding === "without" && row.hasOnboarding) {
      return false;
    }

    if (routines === "with" && !row.hasRoutines) {
      return false;
    }

    if (routines === "without" && row.hasRoutines) {
      return false;
    }

    if (!q) {
      return true;
    }

    const haystack = `${row.fullName ?? ""} ${row.email ?? ""} ${row.userId}`.toLowerCase();
    return haystack.includes(q);
  });

  if (!q && onboarding === "all" && routines === "all") {
    return filtered;
  }

  return filtered;
}
