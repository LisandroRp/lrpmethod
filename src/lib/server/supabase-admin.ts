type JsonObject = Record<string, unknown>;
type PlanCode = "basic" | "intermediate" | "premium";
type SubscriptionStatus = "active" | "pending" | "canceled";

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

export async function listBasicRoutineTemplates() {
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

  return rows.map((row) => ({
    id: String(row.id),
    title: row.name,
    description: row.short_description ?? row.description ?? ""
  }));
}

type RoutineExerciseDetail = {
  id: number;
  name: string;
  description: string | null;
  videoUrl: string | null;
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

export async function findRoutineTemplateDetailById(routineId: number) {
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

  const template = templateRows[0];

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
    `exercise:exercises(id,name,description,video_url)` +
    `&routine_day_id=in.(${dayIdsClause})` +
    `&order=order_index.asc`;
  const exercisesPathLegacy =
    `routine_day_exercises?select=id,routine_day_id,order_index,sets,reps_min,reps_max,rest_seconds,rir,tempo,notes,` +
    `exercise:exercises(id,name,description,video_url)` +
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
      id: number;
      name: string;
      description: string | null;
      video_url: string | null;
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
        .map((row) => row.exercise?.id ?? null)
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

  const exercisesByDay = exerciseRows.reduce<Map<number, RoutineExerciseDetail[]>>((acc, row) => {
    if (!row.exercise) {
      return acc;
    }

    const current = acc.get(row.routine_day_id) ?? [];
    current.push({
      id: row.exercise.id,
      name: row.exercise.name,
      description: row.exercise.description,
      videoUrl: row.exercise.video_url,
      primaryMuscleName: primaryMuscleByExerciseId.get(row.exercise.id)?.name ?? null,
      primaryMuscleSlug: primaryMuscleByExerciseId.get(row.exercise.id)?.slug ?? null,
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

  const days = dayRows.map((day) => ({
    id: day.id,
    dayNumber: day.day_number,
    title: day.title,
    notes: day.notes,
    exercises: exercisesByDay.get(day.id) ?? []
  }));

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
