-- Nutrition PDF resources for user-specific food plan guides.
-- Storage bucket required:
-- 1) Create a private bucket named nutrition-pdfs.
-- 2) If bucket name differs, set NUTRITION_STORAGE_BUCKET env var.
-- Recommended bucket settings:
-- public = false
-- file_size_limit = 1048576
-- allowed_mime_types = array['application/pdf']

create table if not exists public.nutrition_resources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  storage_path text not null,
  file_name text not null,
  file_size_bytes integer not null,
  mime_type text not null default 'application/pdf',
  minimum_plan_code text not null default 'intermediate' check (minimum_plan_code in ('intermediate', 'premium')),
  is_active boolean not null default true,
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists nutrition_resources_user_active_created_idx
  on public.nutrition_resources (user_id, is_active, created_at desc);

create index if not exists nutrition_resources_created_by_idx
  on public.nutrition_resources (created_by_user_id);
