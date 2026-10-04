"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FocusEvent, type SelectHTMLAttributes, useEffect, useMemo, useRef, useState } from "react";
import { TbChevronDown, TbChevronUp, TbDeviceFloppy, TbExternalLink, TbPlus, TbTrash } from "react-icons/tb";

import { RoutineCombinedItem, RoutineImportDraft, RoutineImportItem, routineImportDraftSchema } from "@/lib/routines/routine-import-schema";

import { getRoutineDraftStorageKey } from "./AdminRoutineImportPanel";

type AdminRoutineDraftEditorProps = {
  userId: string;
  formHref: string;
  locale?: "en" | "es";
  initialDraft?: RoutineImportDraft | null;
  routineId?: number;
};

type CombinedExercise = RoutineCombinedItem["exercises"][number];
type EditableExerciseField = Exclude<keyof CombinedExercise, "exerciseName" | "exerciseInfo">;
type ExerciseSearchResult = {
  id: number;
  name: string;
  description: string | null;
  overview: string | null;
  instructions: string | null;
  tips: string | null;
  videoUrl: string | null;
  sourceUrl: string | null;
};

const inputClass = "bg-canvas border-subtle w-full rounded-lg border px-3 py-2 text-sm";
const selectClass = `${inputClass} cursor-pointer appearance-none pr-10`;
const textareaClass = "bg-canvas border-subtle min-h-20 w-full rounded-lg border px-3 py-2 text-sm";
const labelClass = "text-muted text-xs font-medium";
const emptyExerciseName = "Seleccionar ejercicio existente";

function StyledSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, children, ...selectProps } = props;

  return (
    <span className="relative block">
      <select {...selectProps} className={`${selectClass} ${className ?? ""}`}>
        {children}
      </select>
      <TbChevronDown className="text-muted pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" aria-hidden="true" />
    </span>
  );
}

function moveArrayItem<T>(items: T[], fromIndex: number, toIndex: number) {
  if (fromIndex === toIndex || fromIndex < 0 || fromIndex >= items.length || toIndex < 0 || toIndex >= items.length) {
    return items;
  }

  const nextItems = [...items];
  const [item] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, item);
  return nextItems;
}

function normalizeRoutineDays(days: RoutineImportDraft["routine"]["days"]) {
  return days.map((day, index) => ({
    ...day,
    dayNumber: index + 1
  }));
}

function parseNumberInput(value: string, mode: "required" | "nullable") {
  if (value === "") {
    return mode === "nullable" ? null : 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : mode === "nullable" ? null : 0;
}

function parseRequiredNumberInput(value: string) {
  const parsed = parseNumberInput(value, "required");
  return parsed ?? 0;
}

function getEmbedUrl(rawUrl: string) {
  try {
    const parsed = new URL(rawUrl);

    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (parsed.hostname.includes("youtube.com")) {
      if (parsed.pathname.includes("/shorts/")) {
        const id = parsed.pathname.split("/shorts/")[1]?.split("/")[0];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }

      if (parsed.pathname === "/watch") {
        const id = parsed.searchParams.get("v");
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }

      if (parsed.pathname.includes("/embed/")) {
        return rawUrl;
      }
    }
  } catch {
    return null;
  }

  return null;
}

function getEmptySingleItem(order = 1): Extract<RoutineImportItem, { type: "single" }> {
  return {
    type: "single",
    exerciseId: order,
    exerciseName: emptyExerciseName,
    exerciseInfo: null,
    sets: 3,
    repsMin: null,
    repsMax: null,
    restSeconds: null,
    rir: null,
    notes: ""
  };
}

function getEmptyCombinedItem(order = 1): RoutineCombinedItem {
  return {
    type: "combined",
    label: `Superserie ${order}`,
    mode: "superset",
    exercises: [
      {
        exerciseId: order,
        exerciseName: emptyExerciseName,
        exerciseInfo: null,
        sets: 3,
        repsMin: null,
        repsMax: null,
        restSeconds: null,
        rir: null,
        notes: ""
      },
      {
        exerciseId: order + 1,
        exerciseName: emptyExerciseName,
        exerciseInfo: null,
        sets: 3,
        repsMin: null,
        repsMax: null,
        restSeconds: null,
        rir: null,
        notes: ""
      }
    ]
  };
}

function ExerciseSearchInput({
  exercise,
  locale,
  onSelect
}: {
  exercise: CombinedExercise;
  locale: "en" | "es";
  onSelect: (exercise: ExerciseSearchResult) => void;
}) {
  const [query, setQuery] = useState(exercise.exerciseName);
  const [results, setResults] = useState<ExerciseSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setQuery(exercise.exerciseName);
  }, [exercise.exerciseName]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const searchExercises = async (nextQuery: string) => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsSearching(true);
    setResults([]);
    setError(null);

    try {
      const params = new URLSearchParams({
        q: nextQuery,
        locale
      });
      const response = await fetch(`/api/admin/exercises/search?${params.toString()}`, {
        signal: controller.signal
      });
      const result = (await response.json()) as { exercises?: ExerciseSearchResult[]; error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "No se pudieron buscar ejercicios.");
      }

      setResults(result.exercises ?? []);
    } catch (searchError) {
      if (searchError instanceof DOMException && searchError.name === "AbortError") {
        return;
      }
      setResults([]);
      setError(searchError instanceof Error ? searchError.message : "No se pudieron buscar ejercicios.");
    } finally {
      if (abortControllerRef.current === controller) {
        setIsSearching(false);
      }
    }
  };

  const scheduleSearch = (nextQuery: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    abortControllerRef.current?.abort();
    setResults([]);
    setError(null);
    setIsSearching(true);
    debounceRef.current = setTimeout(() => {
      void searchExercises(nextQuery);
    }, 500);
  };

  const handleFocus = () => {
    setIsOpen(true);
    if (!results.length && query !== emptyExerciseName) {
      void searchExercises(query);
    }
  };

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (wrapperRef.current?.contains(event.relatedTarget as Node | null)) {
      return;
    }

    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative" onBlur={handleBlur}>
      <input
        className={inputClass}
        value={query}
        onChange={(event) => {
          const nextQuery = event.target.value;
          setQuery(nextQuery);
          setIsOpen(true);
          scheduleSearch(nextQuery);
        }}
        onFocus={handleFocus}
        placeholder="Buscar ejercicio..."
      />

      {isOpen ? (
        <div className="bg-surface border-subtle absolute z-30 mt-2 w-full overflow-hidden rounded-xl border shadow-xl">
          {isSearching ? (
            <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted">
              <span className="border-subtle h-4 w-4 animate-spin rounded-full border-2 border-t-[color:var(--color-accent)]" />
              Buscando ejercicios...
            </div>
          ) : error ? (
            <p className="px-3 py-3 text-sm text-danger">{error}</p>
          ) : results.length ? (
            <div className="max-h-72 overflow-y-auto py-1">
              {results.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  className="group block w-full cursor-pointer px-3 py-2 text-left transition-colors hover:bg-[color:var(--color-accent)]"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onSelect(result);
                    setQuery(result.name);
                    setIsOpen(false);
                    setResults([]);
                    abortControllerRef.current?.abort();
                  }}
                >
                  <span className="block text-sm font-semibold text-[color:var(--color-primary)] transition-colors group-hover:!text-[color:var(--color-ink-strong)]">{result.name}</span>
                  <span className="mt-0.5 block text-xs text-[color:var(--color-muted)] transition-colors group-hover:!text-[color:var(--color-ink-strong)]">ID {result.id}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="px-3 py-3 text-sm text-muted">No encontramos ejercicios.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function getValidationMessage(draft: RoutineImportDraft) {
  const parsed = routineImportDraftSchema.safeParse(draft);
  if (parsed.success) {
    return null;
  }

  return parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("\n");
}

function ExerciseEditor({
  exercise,
  onChange,
  onExerciseSelect,
  onRemove,
  canRemove,
  position,
  positionCount,
  onMove,
  locale
}: {
  exercise: CombinedExercise;
  onChange: (field: EditableExerciseField, value: CombinedExercise[EditableExerciseField]) => void;
  onExerciseSelect: (exercise: ExerciseSearchResult) => void;
  onRemove?: () => void;
  canRemove?: boolean;
  position?: number;
  positionCount?: number;
  onMove?: (nextIndex: number) => void;
  locale: "en" | "es";
}) {
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const exerciseInfo = exercise.exerciseInfo;
  const videoUrl = exerciseInfo?.videoUrl ?? exerciseInfo?.sourceUrl ?? null;
  const embedUrl = videoUrl ? getEmbedUrl(videoUrl) : null;
  const hasInfo = Boolean(
    exerciseInfo?.description?.trim() ||
      exerciseInfo?.overview?.trim() ||
      exerciseInfo?.instructions?.trim() ||
      exerciseInfo?.tips?.trim() ||
      videoUrl
  );

  return (
    <div className="border-subtle rounded-xl border p-4">
      <div className="grid gap-3 sm:grid-cols-[120px_minmax(0,1fr)_90px_90px_90px_90px_90px]">
        <label className="block">
          <span className={labelClass}>ID</span>
          <input
            className={`${inputClass} text-muted cursor-default`}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={exercise.exerciseId || ""}
            readOnly
            aria-readonly="true"
          />
        </label>
        <label className="block">
          <span className={labelClass}>Ejercicio</span>
          <ExerciseSearchInput exercise={exercise} locale={locale} onSelect={onExerciseSelect} />
        </label>
        <label className="block">
          <span className={labelClass}>Series</span>
          <input
            className={inputClass}
            type="number"
            min={1}
            value={exercise.sets || ""}
            onChange={(event) => onChange("sets", parseRequiredNumberInput(event.target.value))}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Rep min</span>
          <input
            className={inputClass}
            type="number"
            min={1}
            value={exercise.repsMin ?? ""}
            onChange={(event) => onChange("repsMin", parseNumberInput(event.target.value, "nullable"))}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Rep max</span>
          <input
            className={inputClass}
            type="number"
            min={1}
            value={exercise.repsMax ?? ""}
            onChange={(event) => onChange("repsMax", parseNumberInput(event.target.value, "nullable"))}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Descanso</span>
          <input
            className={inputClass}
            type="number"
            min={0}
            value={exercise.restSeconds ?? ""}
            onChange={(event) => onChange("restSeconds", parseNumberInput(event.target.value, "nullable"))}
          />
        </label>
        <label className="block">
          <span className={labelClass}>RIR</span>
          <input
            className={inputClass}
            type="number"
            min={0}
            max={5}
            step={0.5}
            value={exercise.rir ?? ""}
            onChange={(event) => onChange("rir", parseNumberInput(event.target.value, "nullable"))}
          />
        </label>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <label className="block">
          <span className={labelClass}>Notas</span>
          <input className={inputClass} value={exercise.notes} onChange={(event) => onChange("notes", event.target.value)} />
        </label>
        <div className="flex items-end gap-2">
          {typeof position === "number" && typeof positionCount === "number" && onMove ? (
            <>
              <label className="block min-w-20">
                <span className={labelClass}>Pos.</span>
                <StyledSelect value={position + 1} onChange={(event) => onMove(Number(event.target.value) - 1)}>
                  {Array.from({ length: positionCount }, (_, index) => (
                    <option key={index + 1} value={index + 1}>
                      {index + 1}
                    </option>
                  ))}
                </StyledSelect>
              </label>
            </>
          ) : null}
          {onRemove ? (
            <button type="button" className="btn-secondary px-3" onClick={onRemove} disabled={!canRemove} aria-label="Eliminar ejercicio">
              <TbTrash className="h-5 w-5" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-3 border-t border-subtle pt-3">
        <button
          type="button"
          className="text-accent hover:text-accent-hover inline-flex items-center gap-2 text-sm font-semibold transition-colors"
          onClick={() => setIsInfoOpen((current) => !current)}
        >
          {isInfoOpen ? <TbChevronUp className="h-5 w-5" /> : <TbChevronDown className="h-5 w-5" />}
          Info del ejercicio
        </button>

        {isInfoOpen ? (
          <div className="mt-3 space-y-3">
            {hasInfo ? (
              <>
                {exerciseInfo?.description?.trim() ? (
                  <div>
                    <p className={labelClass}>Descripcion</p>
                    <p className="text-primary mt-1 text-sm whitespace-pre-wrap">{exerciseInfo.description}</p>
                  </div>
                ) : null}
                {exerciseInfo?.overview?.trim() ? (
                  <div>
                    <p className={labelClass}>Overview</p>
                    <p className="text-primary mt-1 text-sm whitespace-pre-wrap">{exerciseInfo.overview}</p>
                  </div>
                ) : null}
                {exerciseInfo?.instructions?.trim() ? (
                  <div>
                    <p className={labelClass}>Instrucciones</p>
                    <p className="text-primary mt-1 text-sm whitespace-pre-wrap">{exerciseInfo.instructions}</p>
                  </div>
                ) : null}
                {exerciseInfo?.tips?.trim() ? (
                  <div>
                    <p className={labelClass}>Tips</p>
                    <p className="text-primary mt-1 text-sm whitespace-pre-wrap">{exerciseInfo.tips}</p>
                  </div>
                ) : null}
                {embedUrl ? (
                  <iframe
                    className="aspect-video w-full rounded-lg border border-subtle"
                    src={embedUrl}
                    title={`Video de ${exercise.exerciseName}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : videoUrl ? (
                  <a className="text-accent hover:text-accent-hover inline-flex items-center gap-2 text-sm font-semibold transition-colors" href={videoUrl} target="_blank" rel="noreferrer">
                    <TbExternalLink className="h-5 w-5" />
                    Ver video
                  </a>
                ) : null}
              </>
            ) : (
              <p className="text-muted text-sm">Este ejercicio no tiene informacion adicional cargada.</p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function AdminRoutineDraftEditor({ userId, formHref, locale = "es", initialDraft, routineId }: AdminRoutineDraftEditorProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<RoutineImportDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const storageKey = getRoutineDraftStorageKey(userId);

  useEffect(() => {
    if (initialDraft) {
      setDraft(initialDraft);
      window.sessionStorage.setItem(storageKey, JSON.stringify(initialDraft));
      return;
    }

    const storedDraft = window.sessionStorage.getItem(storageKey);
    if (!storedDraft) {
      setError("No hay una rutina cargada. Volve al formulario y subi el JSON.");
      return;
    }

    try {
      const parsed = routineImportDraftSchema.safeParse(JSON.parse(storedDraft));
      if (!parsed.success) {
        setError(parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("\n"));
        return;
      }

      setDraft(parsed.data);
    } catch {
      setError("No pude leer el borrador guardado en el navegador.");
    }
  }, [initialDraft, storageKey]);

  const validationMessage = useMemo(() => (draft ? getValidationMessage(draft) : null), [draft]);

  const updateDraft = (updater: (current: RoutineImportDraft) => RoutineImportDraft) => {
    setDraft((current) => {
      if (!current) {
        return current;
      }

      const next = updater(current);
      window.sessionStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  };

  const updateRoutineField = <K extends keyof RoutineImportDraft["routine"]>(field: K, value: RoutineImportDraft["routine"][K]) => {
    updateDraft((current) => ({
      ...current,
      routine: {
        ...current.routine,
        [field]: value
      }
    }));
  };

  const updateDayField = <K extends keyof RoutineImportDraft["routine"]["days"][number]>(
    dayIndex: number,
    field: K,
    value: RoutineImportDraft["routine"]["days"][number][K]
  ) => {
    updateDraft((current) => ({
      ...current,
      routine: {
        ...current.routine,
        days: current.routine.days.map((day, index) => (index === dayIndex ? { ...day, [field]: value } : day))
      }
    }));
  };

  const updateItem = (dayIndex: number, itemIndex: number, nextItem: RoutineImportItem) => {
    updateDraft((current) => ({
      ...current,
      routine: {
        ...current.routine,
        days: current.routine.days.map((day, index) =>
          index === dayIndex ? { ...day, items: day.items.map((item, currentItemIndex) => (currentItemIndex === itemIndex ? nextItem : item)) } : day
        )
      }
    }));
  };

  const removeItem = (dayIndex: number, itemIndex: number) => {
    updateDraft((current) => ({
      ...current,
      routine: {
        ...current.routine,
        days: current.routine.days.map((day, index) =>
          index === dayIndex ? { ...day, items: day.items.filter((_, currentItemIndex) => currentItemIndex !== itemIndex) } : day
        )
      }
    }));
  };

  const moveItem = (dayIndex: number, fromIndex: number, toIndex: number) => {
    updateDraft((current) => ({
      ...current,
      routine: {
        ...current.routine,
        days: current.routine.days.map((day, index) => (index === dayIndex ? { ...day, items: moveArrayItem(day.items, fromIndex, toIndex) } : day))
      }
    }));
  };

  const moveCombinedExercise = (dayIndex: number, itemIndex: number, fromIndex: number, toIndex: number) => {
    updateDraft((current) => ({
      ...current,
      routine: {
        ...current.routine,
        days: current.routine.days.map((day, currentDayIndex) => {
          if (currentDayIndex !== dayIndex) {
            return day;
          }

          return {
            ...day,
            items: day.items.map((item, currentItemIndex) =>
              currentItemIndex === itemIndex && item.type === "combined"
                ? {
                    ...item,
                    exercises: moveArrayItem(item.exercises, fromIndex, toIndex)
                  }
                : item
            )
          };
        })
      }
    }));
  };

  const addItem = (dayIndex: number, item: RoutineImportItem) => {
    updateDraft((current) => ({
      ...current,
      routine: {
        ...current.routine,
        days: current.routine.days.map((day, index) => (index === dayIndex ? { ...day, items: [...day.items, item] } : day))
      }
    }));
  };

  const addDay = () => {
    updateDraft((current) => ({
      ...current,
      routine: {
        ...current.routine,
        days: [
          ...current.routine.days,
          {
            dayNumber: current.routine.days.length + 1,
            title: `Dia ${current.routine.days.length + 1}`,
            notes: "",
            items: [getEmptySingleItem()]
          }
        ]
      }
    }));
  };

  const moveDay = (fromIndex: number, toIndex: number) => {
    updateDraft((current) => ({
      ...current,
      routine: {
        ...current.routine,
        days: normalizeRoutineDays(moveArrayItem(current.routine.days, fromIndex, toIndex))
      }
    }));
  };

  const removeDay = (dayIndex: number) => {
    updateDraft((current) => ({
      ...current,
      routine: {
        ...current.routine,
        days: normalizeRoutineDays(current.routine.days.filter((_, index) => index !== dayIndex))
      }
    }));
  };

  const handleSave = async () => {
    if (!draft) {
      return;
    }

    const parsed = routineImportDraftSchema.safeParse(draft);
    if (!parsed.success) {
      setError(parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("\n"));
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(routineId ? `/api/admin/routines/${routineId}` : "/api/admin/routines/import", {
        method: routineId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId,
          draft: parsed.data
        })
      });

      const result = (await response.json()) as { routineId?: number; error?: string };
      if (!response.ok) {
        throw new Error(result.error ?? "No se pudo guardar la rutina.");
      }

      window.sessionStorage.removeItem(storageKey);
      router.replace(`${formHref}?routineSaved=1`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo guardar la rutina.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!draft) {
    return (
      <section className="panel p-5">
        {error ? <p className="whitespace-pre-wrap rounded-lg border border-subtle p-3 text-sm text-danger">{error}</p> : null}
        <Link href={formHref} className="btn-secondary mt-4 inline-block">
          Volver al formulario
        </Link>
      </section>
    );
  }

  return (
      <section className="space-y-5">
      {error ? <p className="whitespace-pre-wrap rounded-lg border border-subtle p-3 text-sm text-danger">{error}</p> : null}

      <div className="panel p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className={labelClass}>Titulo</span>
            <input className={inputClass} value={draft.routine.name} onChange={(event) => updateRoutineField("name", event.target.value)} />
          </label>
          <label className="block">
            <span className={labelClass}>Dificultad</span>
            <StyledSelect
              value={draft.routine.difficulty ?? ""}
              onChange={(event) =>
                updateRoutineField("difficulty", event.target.value === "" ? null : (event.target.value as RoutineImportDraft["routine"]["difficulty"]))
              }
            >
              <option value="">Sin definir</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </StyledSelect>
          </label>
          <label className="block sm:col-span-2">
            <span className={labelClass}>Descripcion</span>
            <textarea className={textareaClass} value={draft.routine.description} onChange={(event) => updateRoutineField("description", event.target.value)} />
          </label>
          <label className="block sm:col-span-2">
            <span className={labelClass}>Resumen corto</span>
            <input
              className={inputClass}
              value={draft.routine.shortDescription}
              onChange={(event) => updateRoutineField("shortDescription", event.target.value)}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className={labelClass}>Guia Markdown</span>
            <textarea
              className="bg-canvas border-subtle min-h-32 w-full rounded-lg border px-3 py-2 text-sm"
              value={draft.routine.longDescriptionMd}
              onChange={(event) => updateRoutineField("longDescriptionMd", event.target.value)}
            />
          </label>
        </div>
      </div>

      {draft.routine.days.map((day, dayIndex) => (
        <section key={`${day.dayNumber}-${dayIndex}`} className="card">
          <div className="flex flex-col items-start justify-between gap-3">
            <button type="button" className="self-end btn-secondary px-3" onClick={() => removeDay(dayIndex)} disabled={draft.routine.days.length <= 1} aria-label="Eliminar dia">
              <TbTrash className="h-5 w-5" />
            </button>
            <div className="grid flex-1 gap-3 w-full sm:grid-cols-[100px_minmax(0,1fr)]">
              <label className="block">
                <span className={labelClass}>Dia</span>
                <StyledSelect value={dayIndex + 1} onChange={(event) => moveDay(dayIndex, Number(event.target.value) - 1)}>
                  {draft.routine.days.map((_, optionIndex) => (
                    <option key={optionIndex + 1} value={optionIndex + 1}>
                      {optionIndex + 1}
                    </option>
                  ))}
                </StyledSelect>
              </label>
              <label className="block">
                <span className={labelClass}>Titulo del dia</span>
                <input className={inputClass} value={day.title} onChange={(event) => updateDayField(dayIndex, "title", event.target.value)} />
              </label>
              <label className="block sm:col-span-2">
                <span className={labelClass}>Notas del dia</span>
                <input className={inputClass} value={day.notes} onChange={(event) => updateDayField(dayIndex, "notes", event.target.value)} />
              </label>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            {day.items.map((item, itemIndex) =>
              item.type === "single" ? (
                <div key={`${item.type}-${itemIndex}`} className="rounded-xl border border-subtle p-4">
                  <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                    <h3 className="text-sm font-semibold text-accent">Ejercicio simple</h3>
                    <div className="flex flex-wrap items-end gap-2">
                      <label className="block min-w-20">
                        <span className={labelClass}>Pos.</span>
                        <StyledSelect value={itemIndex + 1} onChange={(event) => moveItem(dayIndex, itemIndex, Number(event.target.value) - 1)}>
                          {day.items.map((_, optionIndex) => (
                            <option key={optionIndex + 1} value={optionIndex + 1}>
                              {optionIndex + 1}
                            </option>
                          ))}
                        </StyledSelect>
                      </label>
                      <button
                        type="button"
                        className="btn-secondary px-3"
                        onClick={() => removeItem(dayIndex, itemIndex)}
                        disabled={day.items.length <= 1}
                        aria-label="Eliminar ejercicio simple"
                      >
                        <TbTrash className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <ExerciseEditor
                    exercise={item}
                    locale={locale}
                    onExerciseSelect={(selectedExercise) =>
                      updateItem(dayIndex, itemIndex, {
                        ...item,
                        exerciseId: selectedExercise.id,
                        exerciseName: selectedExercise.name,
                        exerciseInfo: {
                          description: selectedExercise.description,
                          overview: selectedExercise.overview,
                          instructions: selectedExercise.instructions,
                          tips: selectedExercise.tips,
                          videoUrl: selectedExercise.videoUrl,
                          sourceUrl: selectedExercise.sourceUrl
                        }
                      })
                    }
                    onChange={(field, value) => {
                      const nextItem = { ...item, [field]: value };
                      if (field === "exerciseId") {
                        nextItem.exerciseName = "Ejercicio sin validar";
                        nextItem.exerciseInfo = null;
                      }
                      updateItem(dayIndex, itemIndex, nextItem);
                    }}
                  />
                </div>
              ) : (
                <div key={`${item.type}-${itemIndex}`} className="rounded-xl border border-subtle p-4">
                  <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                    <div className="grid flex-1 gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
                      <label className="block">
                        <span className={labelClass}>Bloque combinado</span>
                        <input className={inputClass} value={item.label} onChange={(event) => updateItem(dayIndex, itemIndex, { ...item, label: event.target.value })} />
                      </label>
                      <label className="block">
                        <span className={labelClass}>Modo</span>
                        <StyledSelect
                          value={item.mode}
                          onChange={(event) => updateItem(dayIndex, itemIndex, { ...item, mode: event.target.value as RoutineCombinedItem["mode"] })}
                        >
                          <option value="superset">Superserie</option>
                          <option value="circuit">Circuito</option>
                          <option value="combined">Combinado</option>
                        </StyledSelect>
                      </label>
                    </div>
                    <div className="flex flex-wrap items-end gap-2">
                      <label className="block min-w-20">
                        <span className={labelClass}>Pos.</span>
                        <StyledSelect value={itemIndex + 1} onChange={(event) => moveItem(dayIndex, itemIndex, Number(event.target.value) - 1)}>
                          {day.items.map((_, optionIndex) => (
                            <option key={optionIndex + 1} value={optionIndex + 1}>
                              {optionIndex + 1}
                            </option>
                          ))}
                        </StyledSelect>
                      </label>
                      <button
                        type="button"
                        className="btn-secondary px-3"
                        onClick={() => removeItem(dayIndex, itemIndex)}
                        disabled={day.items.length <= 1}
                        aria-label="Eliminar bloque combinado"
                      >
                        <TbTrash className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {item.exercises.map((exercise, exerciseIndex) => (
                      <ExerciseEditor
                        key={`${exercise.exerciseId}-${exerciseIndex}`}
                        exercise={exercise}
                        locale={locale}
                        onExerciseSelect={(selectedExercise) =>
                          updateItem(dayIndex, itemIndex, {
                            ...item,
                            exercises: item.exercises.map((currentExercise, currentIndex) =>
                              currentIndex === exerciseIndex
                                ? {
                                    ...currentExercise,
                                    exerciseId: selectedExercise.id,
                                    exerciseName: selectedExercise.name,
                                    exerciseInfo: {
                                      description: selectedExercise.description,
                                      overview: selectedExercise.overview,
                                      instructions: selectedExercise.instructions,
                                      tips: selectedExercise.tips,
                                      videoUrl: selectedExercise.videoUrl,
                                      sourceUrl: selectedExercise.sourceUrl
                                    }
                                  }
                                : currentExercise
                            )
                          })
                        }
                        onChange={(field, value) =>
                          updateItem(dayIndex, itemIndex, {
                            ...item,
                            exercises: item.exercises.map((currentExercise, currentIndex) =>
                              currentIndex === exerciseIndex
                                ? {
                                    ...currentExercise,
                                    [field]: value,
                                    ...(field === "exerciseId"
                                      ? {
                                          exerciseName: "Ejercicio sin validar",
                                          exerciseInfo: null
                                        }
                                      : {})
                                  }
                                : currentExercise
                            )
                          })
                        }
                        onRemove={() =>
                          updateItem(dayIndex, itemIndex, {
                            ...item,
                            exercises: item.exercises.filter((_, currentIndex) => currentIndex !== exerciseIndex)
                          })
                        }
                        canRemove={item.exercises.length > 2}
                        position={exerciseIndex}
                        positionCount={item.exercises.length}
                        onMove={(nextIndex) => moveCombinedExercise(dayIndex, itemIndex, exerciseIndex, nextIndex)}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    className="btn-secondary mt-3 inline-flex items-center gap-2"
                    onClick={() => updateItem(dayIndex, itemIndex, { ...item, exercises: [...item.exercises, getEmptySingleItem(item.exercises.length + 1)] })}
                  >
                    <TbPlus className="h-5 w-5" />
                    Agregar ejercicio al bloque
                  </button>
                </div>
              )
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className="btn-secondary inline-flex items-center gap-2" onClick={() => addItem(dayIndex, getEmptySingleItem(day.items.length + 1))}>
              <TbPlus className="h-5 w-5" />
              Agregar ejercicio
            </button>
            <button type="button" className="btn-secondary inline-flex items-center gap-2" onClick={() => addItem(dayIndex, getEmptyCombinedItem(day.items.length + 1))}>
              <TbPlus className="h-5 w-5" />
              Agregar superserie/circuito
            </button>
          </div>
        </section>
      ))}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={formHref} className="btn-secondary">
          Volver al formulario
        </Link>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary inline-flex items-center gap-2" onClick={addDay} disabled={draft.routine.days.length >= 7}>
            <TbPlus className="h-5 w-5" />
            Agregar dia
          </button>
          <button type="button" className="btn-primary inline-flex items-center gap-2" onClick={() => void handleSave()} disabled={isSaving || Boolean(validationMessage)}>
            <TbDeviceFloppy className="h-5 w-5" />
            {isSaving ? "Guardando..." : "Guardar rutina"}
          </button>
        </div>
      </div>

      {validationMessage ? <p className="whitespace-pre-wrap rounded-lg border border-subtle p-3 text-sm text-danger">{validationMessage}</p> : null}
    </section>
  );
}
