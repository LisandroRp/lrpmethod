import crypto from "node:crypto";

import { OnboardingAnswersInput } from "@/features/onboarding/schema";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ONBOARDING_BUCKET = process.env.ONBOARDING_STORAGE_BUCKET?.trim() || "onboarding-photos";

function ensureSupabaseEnv() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  }
}

async function supabaseRestFetch(path: string, init: RequestInit) {
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

async function supabaseStorageUpload(path: string, file: File) {
  ensureSupabaseEnv();

  const body = Buffer.from(await file.arrayBuffer());
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${ONBOARDING_BUCKET}/${path}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY as string,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY as string}`,
      "Content-Type": file.type || "application/octet-stream",
      "x-upsert": "true"
    },
    body
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Supabase storage upload failed (${response.status}): ${errorBody}`);
  }

  return `${ONBOARDING_BUCKET}/${path}`;
}

export type OnboardingRecord = {
  userId: string;
  status: "draft" | "submitted";
  answers: OnboardingAnswersInput | null;
  frontPhotoPath: string | null;
  sidePhotoPath: string | null;
  submittedAt: string | null;
  updatedAt: string;
};

export async function getOnboardingByUserId(userId: string): Promise<OnboardingRecord | null> {
  const path = `onboarding_answers?select=user_id,status,answers,front_photo_path,side_photo_path,submitted_at,updated_at&user_id=eq.${encodeURIComponent(userId)}&limit=1`;
  const response = await supabaseRestFetch(path, { method: "GET" });
  const rows = (await response.json()) as Array<{
    user_id: string;
    status: "draft" | "submitted";
    answers: OnboardingAnswersInput | null;
    front_photo_path: string | null;
    side_photo_path: string | null;
    submitted_at: string | null;
    updated_at: string;
  }>;

  if (!rows.length) {
    return null;
  }

  const row = rows[0];
  return {
    userId: row.user_id,
    status: row.status,
    answers: row.answers,
    frontPhotoPath: row.front_photo_path,
    sidePhotoPath: row.side_photo_path,
    submittedAt: row.submitted_at,
    updatedAt: row.updated_at
  };
}

export async function saveOnboardingByUserId(params: {
  userId: string;
  answers: OnboardingAnswersInput;
  status: "draft" | "submitted";
  frontPhoto?: File | null;
  sidePhoto?: File | null;
}) {
  const existing = await getOnboardingByUserId(params.userId);
  if (existing?.status === "submitted") {
    throw new Error("Onboarding already submitted and locked.");
  }

  let frontPhotoPath = existing?.frontPhotoPath ?? null;
  let sidePhotoPath = existing?.sidePhotoPath ?? null;

  if (params.frontPhoto) {
    const ext = params.frontPhoto.name.split(".").pop()?.toLowerCase() || "jpg";
    const filename = `${Date.now()}-${crypto.randomUUID()}-front.${ext}`;
    frontPhotoPath = await supabaseStorageUpload(`${params.userId}/${filename}`, params.frontPhoto);
  }

  if (params.sidePhoto) {
    const ext = params.sidePhoto.name.split(".").pop()?.toLowerCase() || "jpg";
    const filename = `${Date.now()}-${crypto.randomUUID()}-side.${ext}`;
    sidePhotoPath = await supabaseStorageUpload(`${params.userId}/${filename}`, params.sidePhoto);
  }

  await supabaseRestFetch("onboarding_answers?on_conflict=user_id", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=minimal"
    },
    body: JSON.stringify({
      user_id: params.userId,
      status: params.status,
      answers: params.answers,
      front_photo_path: frontPhotoPath,
      side_photo_path: sidePhotoPath,
      submitted_at: params.status === "submitted" ? new Date().toISOString() : null
    })
  });
}

export async function hasSubmittedOnboardingAnswerByUserId(userId: string): Promise<boolean> {
  const path = `onboarding_answers?select=user_id&user_id=eq.${encodeURIComponent(userId)}&status=eq.submitted&limit=1`;
  const response = await supabaseRestFetch(path, { method: "GET" });
  const rows = (await response.json()) as Array<{ user_id: string }>;
  return rows.length > 0;
}
