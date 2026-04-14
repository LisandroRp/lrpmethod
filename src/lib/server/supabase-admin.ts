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

export async function hasSubmittedOnboardingByUserId(userId: string): Promise<boolean> {
  const path = `onboarding_submissions?select=id&user_id=eq.${encodeURIComponent(userId)}&status=eq.submitted&order=submitted_at.desc&limit=1`;
  const response = await supabaseFetch(path, { method: "GET" });
  const rows = (await response.json()) as Array<{ id: number }>;
  return rows.length > 0;
}

export async function isUserAdmin(userId: string): Promise<boolean> {
  const path = `profiles?select=is_admin&id=eq.${encodeURIComponent(userId)}&limit=1`;
  const response = await supabaseFetch(path, { method: "GET" });
  const rows = (await response.json()) as Array<{ is_admin?: boolean | null }>;
  return Boolean(rows[0]?.is_admin);
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
