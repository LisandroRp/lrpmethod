-- Remove routine exercise tempo from the app data model.
-- Run in Supabase SQL Editor after deploying the code that no longer reads/writes tempo.

alter table public.routine_day_exercises
  drop column if exists tempo;
