import { z } from "zod";

export const planCodeSchema = z.enum(["basic", "intermediate", "premium"]);

export const sexSchema = z.enum(["mujer", "hombre"]);
export const goalSchema = z.enum(["bajar_grasa", "ganar_masa_muscular", "recomposicion", "mejorar_rendimiento", "salud"]);
export const levelSchema = z.enum(["principiante", "intermedio", "avanzado"]);
export const daysPerWeekSchema = z.enum(["2", "3", "4", "5", "6", "7"]);
export const sessionTimeSchema = z.enum(["30_45", "45_60", "60_75", "75_plus"]);
export const trainingPlaceSchema = z.enum(["gimnasio", "casa", "parque", "no_entreno"]);
export const medicalAuthorizationSchema = z.enum(["si", "no", "no_aplica"]);
export const mealScheduleSchema = z.enum(["fijos", "variables", "mixtos"]);
export const mealsPerDaySchema = z.enum(["2", "3", "4", "5_plus"]);
export const nutritionPreferenceSchema = z.enum(["simple", "estructurada"]);
export const commuteTransportSchema = z.enum(["caminando", "bicicleta", "moto", "auto", "colectivo", "tren_subte"]);
export const commuteDistanceSchema = z.enum(["lt_2", "2_5", "5_10", "10_20", "gt_20"]);
export const commuteTimeSchema = z.enum(["lt_15", "15_30", "30_45", "45_60", "gt_60"]);
export const followupTimeSchema = z.enum(["manana", "tarde", "noche"]);

export const onboardingAnswersSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email().max(200),
  whatsapp: z.string().min(6).max(40),
  age: z.number().int().min(12).max(99),
  sex: sexSchema,
  cityCountry: z.string().min(2).max(120),
  mainGoal: goalSchema,
  currentLevel: levelSchema,
  trainingDaysPerWeek: daysPerWeekSchema,
  sessionTime: sessionTimeSchema,
  trainingPlace: trainingPlaceSchema,
  availableEquipment: z.string().min(2).max(2000),
  injuriesLimitations: z.string().min(2).max(2000),
  medicalConditionMedication: z.string().min(2).max(2000),
  medicalAuthorization: medicalAuthorizationSchema,
  currentNutrition: z.string().min(2).max(2000),
  allergiesRestrictions: z.string().min(2).max(2000),
  mealSchedule: mealScheduleSchema,
  mealsPerDay: mealsPerDaySchema,
  nutritionPreference: nutritionPreferenceSchema,
  occupation: z.string().min(2).max(120),
  typicalDay: z.string().min(2).max(2000),
  hobbies: z.string().min(2).max(2000),
  transportToWork: commuteTransportSchema,
  commuteDistance: commuteDistanceSchema,
  commuteTime: commuteTimeSchema,
  followupBestTime: followupTimeSchema,
  hardestPart: z.string().min(2).max(2000),
  extraNotes: z.string().max(2000).optional().default(""),
  consentConfirmed: z.literal(true)
});

export type OnboardingAnswersInput = z.infer<typeof onboardingAnswersSchema>;
