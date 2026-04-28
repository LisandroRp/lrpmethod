-- Run this after docs/sql/routines.sql to support supersets/combined blocks.

alter table public.routine_day_exercises
  add column if not exists is_combined boolean not null default false,
  add column if not exists combined_group integer null,
  add column if not exists combined_index integer null,
  add column if not exists combined_label text null;

-- Normalize existing rows (non-combined by default).
update public.routine_day_exercises
set
  is_combined = coalesce(is_combined, false),
  combined_group = null,
  combined_index = null,
  combined_label = null
where is_combined = false
  and (combined_group is not null or combined_index is not null or combined_label is not null);

-- Drop and recreate check for consistency.
alter table public.routine_day_exercises
  drop constraint if exists routine_day_exercises_combined_chk;

alter table public.routine_day_exercises
  add constraint routine_day_exercises_combined_chk check (
    (
      is_combined = false
      and combined_group is null
      and combined_index is null
      and combined_label is null
    )
    or
    (
      is_combined = true
      and combined_group is not null
      and combined_group >= 1
      and combined_index is not null
      and combined_index >= 1
    )
  );

create index if not exists routine_day_exercises_combined_idx
  on public.routine_day_exercises(routine_day_id, combined_group, combined_index desc);
