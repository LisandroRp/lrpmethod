"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";

import { OnboardingAnswersInput, onboardingAnswersSchema } from "@/features/onboarding/schema";

type OnboardingFormProps = {
  userEmail: string;
};

type SelectFieldKey =
  | "sex"
  | "mainGoal"
  | "currentLevel"
  | "trainingDaysPerWeek"
  | "sessionTime"
  | "trainingPlace"
  | "medicalAuthorization"
  | "mealSchedule"
  | "mealsPerDay"
  | "nutritionPreference"
  | "transportToWork"
  | "commuteDistance"
  | "commuteTime"
  | "followupBestTime";

type OnboardingAnswersDraftInput = Omit<OnboardingAnswersInput, SelectFieldKey> & {
  [K in SelectFieldKey]: OnboardingAnswersInput[K] | null;
};

type OnboardingFieldKey = keyof OnboardingAnswersDraftInput;

type ValidationErrorItem = {
  field?: OnboardingFieldKey;
  label: string;
  message: string;
};

type ApiOnboardingResponse = {
  ok: boolean;
  onboarding: {
    status: "draft" | "submitted";
    answers: OnboardingAnswersInput | null;
    frontPhotoPath: string | null;
    sidePhotoPath: string | null;
  } | null;
};

type OnboardingValidationModalProps = {
  isOpen: boolean;
  errors: ValidationErrorItem[];
  onClose: () => void;
};

function OnboardingValidationModal({ isOpen, errors, onClose }: OnboardingValidationModalProps) {
  if (!isOpen || errors.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/65 p-4 sm:p-6 lg:px-[300px] lg:py-10">
      <div className="bg-surface border-subtle flex h-[min(78vh,760px)] w-full flex-col rounded-2xl border p-5 sm:p-6">
        <div className="shrink-0">
          <h3 className="text-xl font-semibold">Revisa los campos obligatorios</h3>
          <p className="text-muted mt-2 text-sm">Corrige estos puntos para poder guardar o enviar el formulario.</p>
        </div>
        <div className="mt-4 min-h-0 flex-1 overflow-y-auto pl-2.5">
          <ol className="list-decimal space-y-2 pl-5">
            {errors.map((error, index) => (
              <li key={`${error.label}-${index}`} className="text-accent text-sm">
                  {error.label}: <span className="font-thin">{error.message}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="mt-5 shrink-0">
          <button type="button" className="btn-primary w-full" onClick={onClose}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

const fieldLabels: Partial<Record<OnboardingFieldKey, string>> = {
  fullName: "Nombre y apellido",
  email: "Email",
  whatsapp: "WhatsApp",
  age: "Edad",
  sex: "Sexo",
  cityCountry: "Ciudad y pais",
  mainGoal: "Objetivo principal",
  currentLevel: "Nivel actual",
  trainingDaysPerWeek: "Dias por semana",
  sessionTime: "Tiempo por sesion",
  trainingPlace: "Donde entrenas",
  availableEquipment: "Equipamiento disponible",
  injuriesLimitations: "Lesiones o limitaciones",
  medicalConditionMedication: "Medicacion o condicion relevante",
  medicalAuthorization: "Autorizacion medica",
  currentNutrition: "Alimentacion actual",
  allergiesRestrictions: "Alergias o alimentos restringidos",
  mealSchedule: "Horarios para comer",
  mealsPerDay: "Comidas por dia",
  nutritionPreference: "Guia preferida",
  occupation: "A que te dedicas",
  typicalDay: "Dia tipico",
  hobbies: "Hobbies",
  transportToWork: "Transporte al trabajo/estudio",
  commuteDistance: "Distancia por trayecto",
  commuteTime: "Tiempo por trayecto",
  followupBestTime: "Mejor horario para seguimiento",
  hardestPart: "Que te cuesta mas sostener hoy",
  extraNotes: "Notas adicionales",
  consentConfirmed: "Consentimiento"
};

const requiredSelectFields = new Set<OnboardingFieldKey>([
  "sex",
  "mainGoal",
  "currentLevel",
  "trainingDaysPerWeek",
  "sessionTime",
  "trainingPlace",
  "medicalAuthorization",
  "mealSchedule",
  "mealsPerDay",
  "nutritionPreference",
  "transportToWork",
  "commuteDistance",
  "commuteTime",
  "followupBestTime"
]);

function translateValidationIssue(issue: z.ZodIssue, field?: OnboardingFieldKey) {
  if (field === "consentConfirmed") {
    return "Debes confirmar el consentimiento.";
  }

  if (field && requiredSelectFields.has(field) && (issue.code === "invalid_type" || issue.code === "invalid_value")) {
    return "Selecciona una opcion.";
  }

  if (issue.code === "invalid_format") {
    const issueFormat = "format" in issue ? issue.format : undefined;
    if (issueFormat === "email") {
      return "Ingresa un email valido.";
    }
    return "Formato invalido.";
  }

  if (issue.code === "invalid_type") {
    return "Este campo es obligatorio.";
  }

  if (issue.code === "too_small") {
    const issueOrigin = "origin" in issue ? issue.origin : undefined;
    if (issueOrigin === "string" && typeof issue.minimum === "number") {
      return `Debe tener al menos ${issue.minimum} caracteres.`;
    }
    if (issueOrigin === "number" && typeof issue.minimum === "number") {
      return `Debe ser mayor o igual a ${issue.minimum}.`;
    }
    if (issueOrigin === "array" && typeof issue.minimum === "number") {
      return `Debes seleccionar al menos ${issue.minimum}.`;
    }
    return "El valor es demasiado corto.";
  }

  if (issue.code === "too_big") {
    const issueOrigin = "origin" in issue ? issue.origin : undefined;
    if (issueOrigin === "string" && typeof issue.maximum === "number") {
      return `No puede superar ${issue.maximum} caracteres.`;
    }
    if (issueOrigin === "number" && typeof issue.maximum === "number") {
      return `Debe ser menor o igual a ${issue.maximum}.`;
    }
    return "El valor es demasiado largo.";
  }

  return "Campo invalido.";
}

const defaultAnswers = (email: string): OnboardingAnswersDraftInput => ({
  fullName: "",
  email,
  whatsapp: "",
  age: 18,
  sex: null,
  cityCountry: "",
  mainGoal: null,
  currentLevel: null,
  trainingDaysPerWeek: null,
  sessionTime: null,
  trainingPlace: null,
  availableEquipment: "",
  injuriesLimitations: "",
  medicalConditionMedication: "",
  medicalAuthorization: null,
  currentNutrition: "",
  allergiesRestrictions: "",
  mealSchedule: null,
  mealsPerDay: null,
  nutritionPreference: null,
  occupation: "",
  typicalDay: "",
  hobbies: "",
  transportToWork: null,
  commuteDistance: null,
  commuteTime: null,
  followupBestTime: null,
  hardestPart: "",
  extraNotes: "",
  consentConfirmed: true
});

export function OnboardingForm({ userEmail }: OnboardingFormProps) {
  const [answers, setAnswers] = useState<OnboardingAnswersDraftInput>(() => defaultAnswers(userEmail));
  const [frontPhoto, setFrontPhoto] = useState<File | null>(null);
  const [sidePhoto, setSidePhoto] = useState<File | null>(null);
  const [frontPreviewUrl, setFrontPreviewUrl] = useState<string | null>(null);
  const [sidePreviewUrl, setSidePreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<OnboardingFieldKey, string>>>({});
  const [validationErrors, setValidationErrors] = useState<ValidationErrorItem[]>([]);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/onboarding/me");
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as ApiOnboardingResponse;
        if (!active || !payload.onboarding) {
          return;
        }

        if (payload.onboarding.answers) {
          setAnswers(payload.onboarding.answers);
        }
        setIsSubmitted(payload.onboarding.status === "submitted");
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }
    void load();

    return () => {
      active = false;
    };
  }, []);

  function update<K extends keyof OnboardingAnswersDraftInput>(key: K, value: OnboardingAnswersDraftInput[K]) {
    setAnswers((current) => ({
      ...current,
      [key]: value
    }));
    setFieldErrors((current) => {
      if (!current[key]) {
        return current;
      }
      const next = { ...current };
      delete next[key];
      return next;
    });
    setValidationErrors((current) => current.filter((error) => error.field !== key));
  }

  useEffect(() => {
    if (!frontPhoto) {
      setFrontPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(frontPhoto);
    setFrontPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [frontPhoto]);

  useEffect(() => {
    if (!sidePhoto) {
      setSidePreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(sidePhoto);
    setSidePreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [sidePhoto]);

  async function save(mode: "draft" | "submit") {
    setMessage(null);
    const parsed = onboardingAnswersSchema.safeParse(answers);
    if (!parsed.success) {
      setMessage("Revisa los campos requeridos antes de continuar.");
      const nextFieldErrors: Partial<Record<OnboardingFieldKey, string>> = {};
      const nextValidationErrors: ValidationErrorItem[] = [];

      for (const issue of parsed.error.issues) {
        const field = typeof issue.path[0] === "string" ? (issue.path[0] as OnboardingFieldKey) : undefined;
        const label = field ? fieldLabels[field] ?? field : "Formulario";
        const fieldMessage = translateValidationIssue(issue, field);

        if (field && !nextFieldErrors[field]) {
          nextFieldErrors[field] = fieldMessage;
        }

        nextValidationErrors.push({
          field,
          label,
          message: fieldMessage
        });
      }

      setFieldErrors(nextFieldErrors);
      setValidationErrors(nextValidationErrors);
      setIsValidationModalOpen(true);
      return;
    }

    setFieldErrors({});
    setValidationErrors([]);
    setIsValidationModalOpen(false);
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("mode", mode === "submit" ? "submit" : "draft");
      formData.append("payload", JSON.stringify(parsed.data));
      if (frontPhoto) {
        formData.append("frontPhoto", frontPhoto);
      }
      if (sidePhoto) {
        formData.append("sidePhoto", sidePhoto);
      }

      const response = await fetch("/api/onboarding/save", {
        method: "POST",
        body: formData
      });

      const payload = (await response.json()) as { ok: boolean; error?: string; status?: "draft" | "submitted" };
      if (!response.ok || !payload.ok) {
        setMessage(payload.error ?? "No se pudo guardar el formulario.");
        return;
      }

      if (payload.status === "submitted") {
        setIsSubmitted(true);
        setMessage("Formulario enviado correctamente.");
        return;
      }

      setMessage("Borrador guardado.");
    } finally {
      setIsSaving(false);
    }
  }

  const disabled = isSubmitted || isLoading;
  const sectionClass = "card mt-5";
  const inputClass = "bg-canvas border-subtle w-full rounded-lg border px-3 py-2 text-sm";
  const selectClass = `${inputClass} cursor-pointer`;
  const textareaClass = "bg-canvas border-subtle min-h-24 w-full rounded-lg border px-3 py-2 text-sm";
  const labelClass = "block text-sm";

  function renderFieldError(field: OnboardingFieldKey) {
    const error = fieldErrors[field];
    if (!error) {
      return null;
    }
    return <p className="text-accent mt-1 text-xs">{error}</p>;
  }

  function parseSelectValue<T extends string>(value: string): T | null {
    return value ? (value as T) : null;
  }

  const note = useMemo(() => {
    if (isSubmitted) {
      return "Ya enviaste este formulario. No es editable por ahora.";
    }
    return null;
  }, [isSubmitted]);

  return (
    <div className="mx-auto w-full max-w-3xl pb-10">
      {note ? <p className="text-accent text-sm">{note}</p> : null}
      {message ? <p className="text-muted mt-2 text-sm">{message}</p> : null}

      <section className={sectionClass}>
        <h2 className="section-title text-xl">1) Datos personales</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className={labelClass}>
            Nombre y apellido *
            <input className={inputClass} value={answers.fullName} onChange={(e) => update("fullName", e.target.value)} disabled={disabled} />
            {renderFieldError("fullName")}
          </label>
          <label className={labelClass}>
            Email *
            <input className={inputClass} type="email" value={answers.email} onChange={(e) => update("email", e.target.value)} disabled={disabled} />
            {renderFieldError("email")}
          </label>
          <label className={labelClass}>
            WhatsApp *
            <input className={inputClass} value={answers.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} disabled={disabled} />
            {renderFieldError("whatsapp")}
          </label>
          <label className={labelClass}>
            Edad *
            <input
              className={inputClass}
              type="number"
              min={12}
              max={99}
              value={answers.age}
              onChange={(e) => update("age", Number(e.target.value))}
              disabled={disabled}
            />
            {renderFieldError("age")}
          </label>
          <label className={labelClass}>
            Sexo *
            <select className={selectClass} value={answers.sex ?? ""} onChange={(e) => update("sex", parseSelectValue<OnboardingAnswersInput["sex"]>(e.target.value))} disabled={disabled}>
              <option value="">Seleccionar...</option>
              <option value="mujer">Mujer</option>
              <option value="hombre">Hombre</option>
            </select>
            {renderFieldError("sex")}
          </label>
          <label className={labelClass}>
            Ciudad y pais *
            <input className={inputClass} value={answers.cityCountry} onChange={(e) => update("cityCountry", e.target.value)} disabled={disabled} />
            {renderFieldError("cityCountry")}
          </label>
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className="section-title text-xl">2) Objetivo y entrenamiento</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className={labelClass}>
            Objetivo principal *
            <select className={selectClass} value={answers.mainGoal ?? ""} onChange={(e) => update("mainGoal", parseSelectValue<OnboardingAnswersInput["mainGoal"]>(e.target.value))} disabled={disabled}>
              <option value="">Seleccionar...</option>
              <option value="bajar_grasa">Bajar grasa</option>
              <option value="ganar_masa_muscular">Ganar masa muscular</option>
              <option value="recomposicion">Recomposicion corporal</option>
              <option value="mejorar_rendimiento">Mejorar rendimiento</option>
              <option value="salud">Salud</option>
            </select>
            {renderFieldError("mainGoal")}
          </label>
          <label className={labelClass}>
            Nivel actual *
            <select className={selectClass} value={answers.currentLevel ?? ""} onChange={(e) => update("currentLevel", parseSelectValue<OnboardingAnswersInput["currentLevel"]>(e.target.value))} disabled={disabled}>
              <option value="">Seleccionar...</option>
              <option value="principiante">Principiante</option>
              <option value="intermedio">Intermedio</option>
              <option value="avanzado">Avanzado</option>
            </select>
            {renderFieldError("currentLevel")}
          </label>
          <label className={labelClass}>
            Dias por semana *
            <select className={selectClass} value={answers.trainingDaysPerWeek ?? ""} onChange={(e) => update("trainingDaysPerWeek", parseSelectValue<OnboardingAnswersInput["trainingDaysPerWeek"]>(e.target.value))} disabled={disabled}>
              <option value="">Seleccionar...</option>
              <option value="2">2 dias</option>
              <option value="3">3 dias</option>
              <option value="4">4 dias</option>
              <option value="5">5 dias</option>
              <option value="6">6 dias</option>
              <option value="7">7 dias</option>
            </select>
            {renderFieldError("trainingDaysPerWeek")}
          </label>
          <label className={labelClass}>
            Tiempo por sesion *
            <select className={selectClass} value={answers.sessionTime ?? ""} onChange={(e) => update("sessionTime", parseSelectValue<OnboardingAnswersInput["sessionTime"]>(e.target.value))} disabled={disabled}>
              <option value="">Seleccionar...</option>
              <option value="30_45">30-45 min</option>
              <option value="45_60">45-60 min</option>
              <option value="60_75">60-75 min</option>
              <option value="75_plus">75+ min</option>
            </select>
            {renderFieldError("sessionTime")}
          </label>
          <label className={labelClass}>
            Donde entrenas *
            <select className={selectClass} value={answers.trainingPlace ?? ""} onChange={(e) => update("trainingPlace", parseSelectValue<OnboardingAnswersInput["trainingPlace"]>(e.target.value))} disabled={disabled}>
              <option value="">Seleccionar...</option>
              <option value="gimnasio">Gimnasio</option>
              <option value="casa">Casa</option>
              <option value="parque">Parque (calistenia)</option>
              <option value="no_entreno">No entreno</option>
            </select>
            {renderFieldError("trainingPlace")}
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            Equipamiento disponible *
            <textarea className={textareaClass} value={answers.availableEquipment} onChange={(e) => update("availableEquipment", e.target.value)} disabled={disabled} />
            {renderFieldError("availableEquipment")}
          </label>
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className="section-title text-xl">3) Salud y limitaciones</h2>
        <div className="mt-4 grid gap-3">
          <label className={labelClass}>
            Lesiones, molestias o limitaciones *
            <textarea className={textareaClass} value={answers.injuriesLimitations} onChange={(e) => update("injuriesLimitations", e.target.value)} disabled={disabled} />
            {renderFieldError("injuriesLimitations")}
          </label>
          <label className={labelClass}>
            Medicacion o condicion relevante *
            <textarea className={textareaClass} value={answers.medicalConditionMedication} onChange={(e) => update("medicalConditionMedication", e.target.value)} disabled={disabled} />
            {renderFieldError("medicalConditionMedication")}
          </label>
          <label className={labelClass}>
            Autorizacion medica *
            <select
              className={selectClass}
              value={answers.medicalAuthorization ?? ""}
              onChange={(e) => update("medicalAuthorization", parseSelectValue<OnboardingAnswersInput["medicalAuthorization"]>(e.target.value))}
              disabled={disabled}
            >
              <option value="">Seleccionar...</option>
              <option value="si">Si</option>
              <option value="no">No</option>
              <option value="no_aplica">No aplica</option>
            </select>
            {renderFieldError("medicalAuthorization")}
          </label>
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className="section-title text-xl">4) Alimentacion</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className={`${labelClass} sm:col-span-2`}>
            Alimentacion actual *
            <textarea className={textareaClass} value={answers.currentNutrition} onChange={(e) => update("currentNutrition", e.target.value)} disabled={disabled} />
            {renderFieldError("currentNutrition")}
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            Alergias o alimentos que no consumes *
            <textarea className={textareaClass} value={answers.allergiesRestrictions} onChange={(e) => update("allergiesRestrictions", e.target.value)} disabled={disabled} />
            {renderFieldError("allergiesRestrictions")}
          </label>
          <label className={labelClass}>
            Horarios para comer *
            <select className={selectClass} value={answers.mealSchedule ?? ""} onChange={(e) => update("mealSchedule", parseSelectValue<OnboardingAnswersInput["mealSchedule"]>(e.target.value))} disabled={disabled}>
              <option value="">Seleccionar...</option>
              <option value="fijos">Fijos</option>
              <option value="variables">Variables</option>
              <option value="mixtos">Mixtos</option>
            </select>
            {renderFieldError("mealSchedule")}
          </label>
          <label className={labelClass}>
            Comidas por dia *
            <select className={selectClass} value={answers.mealsPerDay ?? ""} onChange={(e) => update("mealsPerDay", parseSelectValue<OnboardingAnswersInput["mealsPerDay"]>(e.target.value))} disabled={disabled}>
              <option value="">Seleccionar...</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5_plus">5+</option>
            </select>
            {renderFieldError("mealsPerDay")}
          </label>
          <label className={labelClass}>
            Guia preferida *
            <select
              className={selectClass}
              value={answers.nutritionPreference ?? ""}
              onChange={(e) => update("nutritionPreference", parseSelectValue<OnboardingAnswersInput["nutritionPreference"]>(e.target.value))}
              disabled={disabled}
            >
              <option value="">Seleccionar...</option>
              <option value="simple">Simple</option>
              <option value="estructurada">Estructurada</option>
            </select>
            {renderFieldError("nutritionPreference")}
          </label>
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className="section-title text-xl">5) Rutina diaria (adherencia)</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className={labelClass}>
            A que te dedicas *
            <input className={inputClass} value={answers.occupation} onChange={(e) => update("occupation", e.target.value)} disabled={disabled} />
            {renderFieldError("occupation")}
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            Como es un dia tipico *
            <textarea className={textareaClass} value={answers.typicalDay} onChange={(e) => update("typicalDay", e.target.value)} disabled={disabled} />
            {renderFieldError("typicalDay")}
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            Hobbies o actividades fuera del trabajo *
            <textarea className={textareaClass} value={answers.hobbies} onChange={(e) => update("hobbies", e.target.value)} disabled={disabled} />
            {renderFieldError("hobbies")}
          </label>
          <label className={labelClass}>
            Transporte al trabajo/estudio *
            <select className={selectClass} value={answers.transportToWork ?? ""} onChange={(e) => update("transportToWork", parseSelectValue<OnboardingAnswersInput["transportToWork"]>(e.target.value))} disabled={disabled}>
              <option value="">Seleccionar...</option>
              <option value="caminando">Caminando</option>
              <option value="bicicleta">Bicicleta</option>
              <option value="moto">Moto</option>
              <option value="auto">Auto</option>
              <option value="colectivo">Colectivo</option>
              <option value="tren_subte">Tren/Subte</option>
            </select>
            {renderFieldError("transportToWork")}
          </label>
          <label className={labelClass}>
            Distancia por trayecto *
            <select className={selectClass} value={answers.commuteDistance ?? ""} onChange={(e) => update("commuteDistance", parseSelectValue<OnboardingAnswersInput["commuteDistance"]>(e.target.value))} disabled={disabled}>
              <option value="">Seleccionar...</option>
              <option value="lt_2">&lt; 2km</option>
              <option value="2_5">2-5km</option>
              <option value="5_10">5-10km</option>
              <option value="10_20">10-20km</option>
              <option value="gt_20">&gt; 20km</option>
            </select>
            {renderFieldError("commuteDistance")}
          </label>
          <label className={labelClass}>
            Tiempo por trayecto *
            <select className={selectClass} value={answers.commuteTime ?? ""} onChange={(e) => update("commuteTime", parseSelectValue<OnboardingAnswersInput["commuteTime"]>(e.target.value))} disabled={disabled}>
              <option value="">Seleccionar...</option>
              <option value="lt_15">&lt; 15min</option>
              <option value="15_30">15-30min</option>
              <option value="30_45">30-45min</option>
              <option value="45_60">45-60min</option>
              <option value="gt_60">&gt; 60min</option>
            </select>
            {renderFieldError("commuteTime")}
          </label>
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className="section-title text-xl">6) Seguimiento</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className={labelClass}>
            Mejor horario para seguimiento *
            <select className={selectClass} value={answers.followupBestTime ?? ""} onChange={(e) => update("followupBestTime", parseSelectValue<OnboardingAnswersInput["followupBestTime"]>(e.target.value))} disabled={disabled}>
              <option value="">Seleccionar...</option>
              <option value="manana">Manana</option>
              <option value="tarde">Tarde</option>
              <option value="noche">Noche</option>
            </select>
            {renderFieldError("followupBestTime")}
          </label>

          <div className={`${labelClass} sm:col-span-2`}>
            <span className="mb-1 block">Foto de frente (opcional)</span>
            <div className="bg-canvas border-subtle w-full rounded-xl border p-3">
              {frontPreviewUrl ? (
                <Image src={frontPreviewUrl} alt="Vista previa frente" width={900} height={700} unoptimized className="h-44 w-full rounded-lg object-cover" />
              ) : (
                <div className="border-subtle text-muted flex h-32 w-full items-center justify-center rounded-lg border border-dashed text-xs">
                  Aun no subiste una foto de frente
                </div>
              )}
              {!disabled ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <label className="btn-secondary inline-flex cursor-pointer items-center justify-center">
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => setFrontPhoto(e.target.files?.[0] ?? null)} />
                    {frontPreviewUrl ? "Reemplazar foto" : "Subir foto"}
                  </label>
                  {frontPreviewUrl ? (
                    <button type="button" className="btn-secondary" onClick={() => setFrontPhoto(null)}>
                      Quitar
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          <div className={`${labelClass} sm:col-span-2`}>
            <span className="mb-1 block">Foto de costado (opcional)</span>
            <div className="bg-canvas border-subtle w-full rounded-xl border p-3">
              {sidePreviewUrl ? (
                <Image src={sidePreviewUrl} alt="Vista previa costado" width={900} height={700} unoptimized className="h-44 w-full rounded-lg object-cover" />
              ) : (
                <div className="border-subtle text-muted flex h-32 w-full items-center justify-center rounded-lg border border-dashed text-xs">
                  Aun no subiste una foto de costado
                </div>
              )}
              {!disabled ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <label className="btn-secondary inline-flex cursor-pointer items-center justify-center">
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => setSidePhoto(e.target.files?.[0] ?? null)} />
                    {sidePreviewUrl ? "Reemplazar foto" : "Subir foto"}
                  </label>
                  {sidePreviewUrl ? (
                    <button type="button" className="btn-secondary" onClick={() => setSidePhoto(null)}>
                      Quitar
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          <label className={`${labelClass} sm:col-span-2`}>
            Que te cuesta mas sostener hoy? *
            <textarea className={textareaClass} value={answers.hardestPart} onChange={(e) => update("hardestPart", e.target.value)} disabled={disabled} />
            {renderFieldError("hardestPart")}
          </label>

          <label className={`${labelClass} sm:col-span-2`}>
            Algo importante para personalizar mejor tu plan
            <textarea className={textareaClass} value={answers.extraNotes ?? ""} onChange={(e) => update("extraNotes", e.target.value)} disabled={disabled} />
            {renderFieldError("extraNotes")}
          </label>
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className="section-title text-xl">7) Consentimiento</h2>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={answers.consentConfirmed}
            onChange={(e) => update("consentConfirmed", e.target.checked as true)}
            disabled={disabled}
          />
          Confirmo que la informacion es real y entiendo que este servicio no reemplaza consejo medico.
        </label>
        {renderFieldError("consentConfirmed")}
      </section>

      {!isSubmitted ? (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button type="button" className="btn-secondary" disabled={isSaving || isLoading} onClick={() => void save("draft")}>
            {isSaving ? "Guardando..." : "Guardar borrador"}
          </button>
          <button type="button" className="btn-primary" disabled={isSaving || isLoading} onClick={() => void save("submit")}>
            {isSaving ? "Enviando..." : "Enviar formulario"}
          </button>
        </div>
      ) : null}

      <OnboardingValidationModal
        isOpen={isValidationModalOpen}
        errors={validationErrors}
        onClose={() => setIsValidationModalOpen(false)}
      />
    </div>
  );
}
