import { updateProfileAvatarUrlByUserId } from "@/lib/server/supabase-admin";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PROFILE_PHOTOS_BUCKET = process.env.PROFILE_PHOTOS_BUCKET?.trim() || "profile-photos";
const MAX_PROFILE_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;

const allowedMimeTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/heic", "heic"],
  ["image/heif", "heif"]
]);

function ensureSupabaseEnv() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  }
}

function encodeStoragePath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

async function uploadProfilePhoto(path: string, file: File) {
  ensureSupabaseEnv();

  const body = Buffer.from(await file.arrayBuffer());
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${PROFILE_PHOTOS_BUCKET}/${path}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY as string,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY as string}`,
      "Content-Type": file.type,
      "x-upsert": "true"
    },
    body
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Supabase profile photo upload failed (${response.status}): ${errorBody}`);
  }
}

export async function saveProfileAvatarByUserId(userId: string, file: File) {
  const extension = allowedMimeTypes.get(file.type);
  if (!extension) {
    throw new Error("Invalid profile photo type.");
  }

  if (file.size > MAX_PROFILE_PHOTO_SIZE_BYTES) {
    throw new Error("Profile photo is too large.");
  }

  const path = `${userId}/avatar-${Date.now()}.${extension}`;
  await uploadProfilePhoto(path, file);

  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${PROFILE_PHOTOS_BUCKET}/${encodeStoragePath(path)}`;
  await updateProfileAvatarUrlByUserId(userId, publicUrl);

  return publicUrl;
}
