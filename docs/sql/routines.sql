-- Run this in Supabase SQL Editor to enable routines/exercises data model.

-- 1) Base tables
create table if not exists public.exercises (
  id bigserial primary key,
  name text not null,
  slug text not null unique,
  description text null,
  video_url text null,
  muscle_group text null,
  equipment text null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.routine_templates (
  id bigserial primary key,
  name text not null,
  slug text not null unique,
  description text null,
  difficulty text null check (difficulty in ('beginner', 'intermediate', 'advanced')),
  is_basic boolean not null default false,
  owner_user_id uuid null references public.profiles(id) on delete cascade,
  created_by_user_id uuid null references public.profiles(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint routine_templates_basic_owner_chk check (not (is_basic = true and owner_user_id is not null))
);

create table if not exists public.routine_days (
  id bigserial primary key,
  routine_template_id bigint not null references public.routine_templates(id) on delete cascade,
  day_number integer not null check (day_number >= 1 and day_number <= 7),
  title text not null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (routine_template_id, day_number)
);

create table if not exists public.routine_day_exercises (
  id bigserial primary key,
  routine_day_id bigint not null references public.routine_days(id) on delete cascade,
  exercise_id bigint not null references public.exercises(id) on delete restrict,
  order_index integer not null check (order_index >= 1),
  sets integer not null check (sets >= 1),
  reps_min integer null check (reps_min >= 1),
  reps_max integer null check (reps_max >= 1),
  rest_seconds integer null check (rest_seconds >= 0),
  rir numeric(3,1) null check (rir >= 0 and rir <= 5),
  tempo text null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (routine_day_id, order_index),
  constraint routine_day_exercises_reps_chk check (
    (reps_min is null and reps_max is null)
    or (reps_min is not null and reps_max is not null and reps_min <= reps_max)
  )
);

create table if not exists public.user_routine_assignments (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  routine_template_id bigint not null references public.routine_templates(id) on delete restrict,
  status text not null default 'active' check (status in ('active', 'archived')),
  assigned_at timestamptz not null default now(),
  starts_at timestamptz null,
  ends_at timestamptz null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) Indexes
create index if not exists exercises_slug_idx on public.exercises(slug);
create index if not exists exercises_active_idx on public.exercises(is_active);

create index if not exists routine_templates_basic_idx on public.routine_templates(is_basic);
create index if not exists routine_templates_owner_idx on public.routine_templates(owner_user_id);
create index if not exists routine_templates_active_idx on public.routine_templates(is_active);

create index if not exists routine_days_template_idx on public.routine_days(routine_template_id, day_number);
create index if not exists routine_day_exercises_day_idx on public.routine_day_exercises(routine_day_id, order_index);
create index if not exists routine_day_exercises_exercise_idx on public.routine_day_exercises(exercise_id);

create index if not exists user_routine_assignments_user_idx on public.user_routine_assignments(user_id, status, assigned_at desc);
create index if not exists user_routine_assignments_template_idx on public.user_routine_assignments(routine_template_id);

-- 3) updated_at triggers
create or replace function public.set_row_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_set_exercises_updated_at on public.exercises;
create trigger trg_set_exercises_updated_at
before update on public.exercises
for each row
execute procedure public.set_row_updated_at();

drop trigger if exists trg_set_routine_templates_updated_at on public.routine_templates;
create trigger trg_set_routine_templates_updated_at
before update on public.routine_templates
for each row
execute procedure public.set_row_updated_at();

drop trigger if exists trg_set_routine_days_updated_at on public.routine_days;
create trigger trg_set_routine_days_updated_at
before update on public.routine_days
for each row
execute procedure public.set_row_updated_at();

drop trigger if exists trg_set_routine_day_exercises_updated_at on public.routine_day_exercises;
create trigger trg_set_routine_day_exercises_updated_at
before update on public.routine_day_exercises
for each row
execute procedure public.set_row_updated_at();

drop trigger if exists trg_set_user_routine_assignments_updated_at on public.user_routine_assignments;
create trigger trg_set_user_routine_assignments_updated_at
before update on public.user_routine_assignments
for each row
execute procedure public.set_row_updated_at();

-- 4) RLS
alter table public.exercises enable row level security;
alter table public.routine_templates enable row level security;
alter table public.routine_days enable row level security;
alter table public.routine_day_exercises enable row level security;
alter table public.user_routine_assignments enable row level security;

-- Exercises: readable by authenticated users.
drop policy if exists "Exercises are readable by authenticated users" on public.exercises;
create policy "Exercises are readable by authenticated users"
on public.exercises
for select
to authenticated
using (true);

-- Templates: basic visible to all authenticated users, personalized visible only to owner.
drop policy if exists "Routine templates are readable by authenticated users" on public.routine_templates;
create policy "Routine templates are readable by authenticated users"
on public.routine_templates
for select
to authenticated
using (is_basic = true or owner_user_id = auth.uid());

-- Days and exercise-rows: visible if parent template is visible.
drop policy if exists "Routine days are readable by authenticated users" on public.routine_days;
create policy "Routine days are readable by authenticated users"
on public.routine_days
for select
to authenticated
using (
  exists (
    select 1
    from public.routine_templates t
    where t.id = routine_days.routine_template_id
      and (t.is_basic = true or t.owner_user_id = auth.uid())
  )
);

drop policy if exists "Routine day exercises are readable by authenticated users" on public.routine_day_exercises;
create policy "Routine day exercises are readable by authenticated users"
on public.routine_day_exercises
for select
to authenticated
using (
  exists (
    select 1
    from public.routine_days d
    join public.routine_templates t on t.id = d.routine_template_id
    where d.id = routine_day_exercises.routine_day_id
      and (t.is_basic = true or t.owner_user_id = auth.uid())
  )
);

-- Assignments: users can read only their own assignments.
drop policy if exists "Users can view own routine assignments" on public.user_routine_assignments;
create policy "Users can view own routine assignments"
on public.user_routine_assignments
for select
to authenticated
using (user_id = auth.uid());

-- 5) Seed: basic routines only (no exercises yet)
insert into public.routine_templates (
  name,
  slug,
  description,
  difficulty,
  is_basic,
  owner_user_id,
  created_by_user_id,
  is_active
)
values
  (
    'Fuerza base 3 dias',
    'fuerza-base-3-dias',
    'Rutina general de fuerza para construir base tecnica y constancia.',
    'beginner',
    true,
    null,
    null,
    true
  ),
  (
    'Hipertrofia 4 dias',
    'hipertrofia-4-dias',
    'Bloque orientado a ganancia muscular con estructura semanal simple.',
    'intermediate',
    true,
    null,
    null,
    true
  ),
  (
    'Definicion 5 dias',
    'definicion-5-dias',
    'Plan de entrenamiento para etapa de definicion con volumen progresivo.',
    'intermediate',
    true,
    null,
    null,
    true
  ),
  (
    'Home training',
    'home-training',
    'Version adaptable para entrenar en casa con equipo basico.',
    'beginner',
    true,
    null,
    null,
    true
  )
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  difficulty = excluded.difficulty,
  is_basic = excluded.is_basic,
  owner_user_id = excluded.owner_user_id,
  is_active = excluded.is_active,
  updated_at = now();
