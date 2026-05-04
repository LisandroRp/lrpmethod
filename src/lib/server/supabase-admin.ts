type JsonObject = Record<string, unknown>;
type PlanCode = "basic" | "intermediate" | "premium";
type SubscriptionStatus = "active" | "pending" | "canceled";
type AppLocale = "en" | "es";

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
  tempo: string | null;
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
    `routine_day_exercises?select=id,routine_day_id,order_index,is_combined,combined_group,combined_index,combined_label,sets,reps_min,reps_max,rest_seconds,rir,tempo,notes,` +
    `exercise:exercises(id,name,description,overview,instructions,tips,video_url,source_url)` +
    `&routine_day_id=in.(${dayIdsClause})` +
    `&order=order_index.asc`;
  const exercisesPathLegacy =
    `routine_day_exercises?select=id,routine_day_id,order_index,sets,reps_min,reps_max,rest_seconds,rir,tempo,notes,` +
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
    tempo: string | null;
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
      tempo: row.tempo,
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
  q?: string;
  limit?: number;
};

export async function listSubscribers(params: ListSubscribersParams) {
  const status = params.status ?? "all";
  const plan = params.plan ?? "all";
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

  if (uniqueUserIds.length > 0) {
    const inClause = uniqueUserIds.map((id) => `"${id}"`).join(",");
    const profilesPath = `profiles?select=id,email,full_name&id=in.(${encodeURIComponent(inClause)})`;
    const profilesResponse = await supabaseFetch(profilesPath, { method: "GET" });
    const profiles = (await profilesResponse.json()) as Array<{
      id: string;
      email: string | null;
      full_name: string | null;
    }>;

    profilesById = new Map(
      profiles.map((profile) => [
        profile.id,
        {
          email: profile.email,
          fullName: profile.full_name
        }
      ])
    );
  }

  const merged = subscriptions.map((subscription) => {
    const profile = profilesById.get(subscription.user_id);
    return {
      id: subscription.id,
      userId: subscription.user_id,
      planCode: subscription.plan_code,
      status: subscription.status,
      createdAt: subscription.created_at,
      canceledAt: subscription.canceled_at,
      email: profile?.email ?? null,
      fullName: profile?.fullName ?? null
    };
  });

  if (!q) {
    return merged;
  }

  return merged.filter((row) => {
    const haystack = `${row.fullName ?? ""} ${row.email ?? ""} ${row.userId}`.toLowerCase();
    return haystack.includes(q);
  });
}
