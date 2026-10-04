import crypto from "node:crypto";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const NUTRITION_BUCKET = process.env.NUTRITION_STORAGE_BUCKET?.trim() || "nutrition-pdfs";
const MAX_NUTRITION_PDF_SIZE_BYTES = 1 * 1024 * 1024;

export type NutritionResource = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  storagePath: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  minimumPlanCode: "intermediate" | "premium";
  createdByUserId: string | null;
  createdAt: string;
};

type NutritionResourceRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  storage_path: string;
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  minimum_plan_code: "intermediate" | "premium";
  created_by_user_id: string | null;
  created_at: string;
};

function ensureSupabaseEnv() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  }
}

function encodeStoragePath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

function sanitizeFilename(value: string) {
  const sanitized = value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);

  return sanitized || "nutrition-plan.pdf";
}

function mapNutritionResourceRow(row: NutritionResourceRow): NutritionResource {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    storagePath: row.storage_path,
    fileName: row.file_name,
    fileSizeBytes: row.file_size_bytes,
    mimeType: row.mime_type,
    minimumPlanCode: row.minimum_plan_code,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at
  };
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

async function uploadNutritionPdf(path: string, file: File) {
  ensureSupabaseEnv();

  const body = Buffer.from(await file.arrayBuffer());
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${NUTRITION_BUCKET}/${encodeStoragePath(path)}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY as string,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY as string}`,
      "Content-Type": "application/pdf",
      "x-upsert": "false"
    },
    body
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Supabase nutrition PDF upload failed (${response.status}): ${errorBody}`);
  }
}

function validateNutritionPdf(file: File) {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) {
    throw new Error("Solo se pueden subir archivos PDF.");
  }

  if (file.size > MAX_NUTRITION_PDF_SIZE_BYTES) {
    throw new Error("El PDF supera el limite de 1 MB.");
  }
}

export async function listNutritionResourcesByUserId(userId: string) {
  const path =
    `nutrition_resources?select=id,user_id,title,description,storage_path,file_name,file_size_bytes,mime_type,minimum_plan_code,created_by_user_id,created_at` +
    `&user_id=eq.${encodeURIComponent(userId)}&is_active=eq.true&order=created_at.desc`;
  const response = await supabaseRestFetch(path, { method: "GET" });
  const rows = (await response.json()) as NutritionResourceRow[];
  return rows.map(mapNutritionResourceRow);
}

export async function findNutritionResourceById(resourceId: string) {
  const path =
    `nutrition_resources?select=id,user_id,title,description,storage_path,file_name,file_size_bytes,mime_type,minimum_plan_code,created_by_user_id,created_at` +
    `&id=eq.${encodeURIComponent(resourceId)}&is_active=eq.true&limit=1`;
  const response = await supabaseRestFetch(path, { method: "GET" });
  const rows = (await response.json()) as NutritionResourceRow[];
  return rows[0] ? mapNutritionResourceRow(rows[0]) : null;
}

export async function saveNutritionPdfForUser(params: {
  userId: string;
  createdByUserId: string;
  file: File;
}) {
  validateNutritionPdf(params.file);

  const fileName = sanitizeFilename(params.file.name);
  const storagePath = `${params.userId}/${Date.now()}-${crypto.randomUUID()}-${fileName}`;
  await uploadNutritionPdf(storagePath, params.file);

  const title = fileName.replace(/\.pdf$/i, "").replace(/[-_]+/g, " ").trim() || "Plan de alimentacion";
  const response = await supabaseRestFetch("nutrition_resources?select=id", {
    method: "POST",
    headers: {
      Prefer: "return=representation"
    },
    body: JSON.stringify({
      user_id: params.userId,
      title,
      description: null,
      storage_path: storagePath,
      file_name: fileName,
      file_size_bytes: params.file.size,
      mime_type: "application/pdf",
      minimum_plan_code: "intermediate",
      is_active: true,
      created_by_user_id: params.createdByUserId
    })
  });
  const rows = (await response.json()) as Array<{ id: string }>;
  return rows[0]?.id ?? null;
}

export async function createNutritionResourceSignedUrl(resource: NutritionResource) {
  ensureSupabaseEnv();

  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/sign/${NUTRITION_BUCKET}/${encodeStoragePath(resource.storagePath)}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY as string,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY as string}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      expiresIn: 60 * 5
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Supabase signed URL failed (${response.status}): ${errorBody}`);
  }

  const payload = (await response.json()) as { signedURL?: string; signedUrl?: string };
  const signedPath = payload.signedURL ?? payload.signedUrl;
  if (!signedPath) {
    throw new Error("No se pudo generar el link de descarga.");
  }

  if (signedPath.startsWith("http")) {
    return signedPath;
  }

  if (signedPath.startsWith("/storage/v1")) {
    return `${SUPABASE_URL}${signedPath}`;
  }

  return `${SUPABASE_URL}/storage/v1${signedPath.startsWith("/") ? signedPath : `/${signedPath}`}`;
}
