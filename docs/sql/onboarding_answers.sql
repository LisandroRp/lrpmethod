-- Run this in Supabase SQL Editor before using the native onboarding form.

create table if not exists public.onboarding_answers (
  id bigserial primary key,
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft', 'submitted')),
  answers jsonb not null,
  front_photo_path text null,
  side_photo_path text null,
  submitted_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists onboarding_answers_status_idx on public.onboarding_answers(status);
create index if not exists onboarding_answers_updated_at_idx on public.onboarding_answers(updated_at desc);

create or replace function public.set_onboarding_answers_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_set_onboarding_answers_updated_at on public.onboarding_answers;
create trigger trg_set_onboarding_answers_updated_at
before update on public.onboarding_answers
for each row
execute procedure public.set_onboarding_answers_updated_at();

alter table public.onboarding_answers enable row level security;

drop policy if exists "Users can view own onboarding answers" on public.onboarding_answers;
create policy "Users can view own onboarding answers"
on public.onboarding_answers
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own onboarding answers" on public.onboarding_answers;
create policy "Users can insert own onboarding answers"
on public.onboarding_answers
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own onboarding answers" on public.onboarding_answers;
create policy "Users can update own onboarding answers"
on public.onboarding_answers
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Storage bucket required:
-- 1) create a public/private bucket named onboarding-photos (recommended private).
-- 2) If bucket name differs, set ONBOARDING_STORAGE_BUCKET env var.
