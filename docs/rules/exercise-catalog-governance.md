# Exercise Catalog Governance

## 1. Purpose

Define mandatory rules for creating, reusing, and maintaining workout exercises and routine relations in SQL workflows.

This file is mandatory because it lives under `docs/rules/`.

## 2. Source of Truth and Table Relations

- `public.exercises`: canonical exercise catalog.
- `public.routine_templates`: routine metadata (basic or personalized).
- `public.routine_days`: ordered training days per routine template.
- `public.routine_day_exercises`: ordered exercise prescriptions per day.
- `public.muscle_groups`: normalized list of muscle groups.
- `public.exercise_muscle_groups`: N:N mapping between exercises and muscle groups; exactly one primary relation is expected per exercise.

## 3. Mandatory Data Integrity Rules

- Never create a new exercise if an equivalent exercise already exists in `public.exercises`.
- Every new routine SQL must reuse existing exercise rows whenever possible.
- Every active exercise must have:
- A canonical slug.
- A primary muscle relation in `public.exercise_muscle_groups` (`is_primary = true`).
- A synchronized legacy value in `public.exercises.muscle_group`.
- Do not use free-form naming variants to represent the same movement.

## 4. Canonical Slug Policy

- Slugs are immutable identifiers for exercise identity.
- Name wording may evolve; slug identity should not.
- If a movement already exists with a canonical slug, reuse it and update only metadata if needed.
- Before inserting a new exercise, run a lookup by both slug and normalized name.

## 5. Routine SQL Workflow (Required)

Before generating SQL for any routine:

1. Fetch candidate exercises by slug and name similarity.
2. Build a mapping `movement -> canonical exercise_id`.
3. Reuse canonical IDs in `routine_day_exercises`.
4. Insert only truly missing exercises.
5. Ensure muscle mapping is present for all new exercises.

## 6. Duplicate Prevention Checklist (Required)

- Confirm no equivalent slug already exists.
- Confirm no near-duplicate name already exists.
- Prefer updating canonical row metadata over creating a new row.
- If duplicate creation is unavoidable short term, include a merge plan in the same delivery.

## 7. Duplicate Merge Protocol (Required)

When duplicates are detected:

1. Choose canonical `exercise_id` per duplicate group.
2. Update `routine_day_exercises.exercise_id` from duplicate to canonical.
3. Migrate `exercise_muscle_groups` rows to canonical and deduplicate relation rows.
4. Delete duplicate relations from `exercise_muscle_groups`.
5. Delete duplicate rows from `exercises`.
6. Re-sync primary muscle mapping and legacy `exercises.muscle_group`.

## 8. Combined Blocks (Supersets/Circuits) Rules

- Combined blocks are represented in `routine_day_exercises` with:
- `is_combined`
- `combined_group`
- `combined_index`
- `combined_label`
- Rows can share `order_index` only when they belong to the same combined block according to current DB constraints.
- Heavy primary lifts should not be combined by default unless explicitly requested.

## 9. Validation Queries (Run After SQL Changes)

- Exercises without primary muscle mapping:

```sql
select e.id, e.name, e.slug
from public.exercises e
left join public.exercise_muscle_groups emg
  on emg.exercise_id = e.id
 and emg.is_primary = true
where emg.exercise_id is null
order by e.id;
```

- Exercises with null legacy `muscle_group`:

```sql
select id, name, slug
from public.exercises
where muscle_group is null
order by id;
```

- Potential duplicate slugs or names:

```sql
select slug, count(*) from public.exercises group by slug having count(*) > 1;
```

```sql
select lower(name) as normalized_name, count(*)
from public.exercises
group by lower(name)
having count(*) > 1;
```

## 10. Delivery Requirement

Any future SQL delivery that modifies routines or exercises must explicitly state:

- Reused canonical exercises.
- Newly created exercises.
- Muscle mapping updates performed.
- Duplicate-handling status.
