import { OnboardingAnswersInput } from "@/features/onboarding/schema";

type OnboardingAnswerKey = keyof OnboardingAnswersInput;

type DisplayField = {
  key: OnboardingAnswerKey;
  label: string;
};

type DisplaySection = {
  title: string;
  fields: DisplayField[];
};

const optionLabels: Partial<Record<OnboardingAnswerKey, Record<string, string>>> = {
  sex: {
    mujer: "Mujer",
    hombre: "Hombre"
  },
  mainGoal: {
    bajar_grasa: "Bajar grasa",
    ganar_masa_muscular: "Ganar masa muscular",
    recomposicion: "Recomposición",
    mejorar_rendimiento: "Mejorar rendimiento",
    salud: "Salud"
  },
  currentLevel: {
    principiante: "Principiante",
    intermedio: "Intermedio",
    avanzado: "Avanzado"
  },
  trainingDaysPerWeek: {
    "2": "2 días",
    "3": "3 días",
    "4": "4 días",
    "5": "5 días",
    "6": "6 días",
    "7": "7 días"
  },
  sessionTime: {
    "30_45": "30 a 45 min",
    "45_60": "45 a 60 min",
    "60_75": "60 a 75 min",
    "75_plus": "75+ min"
  },
  trainingPlace: {
    gimnasio: "Gimnasio",
    casa: "Casa",
    parque: "Parque",
    no_entreno: "No entrena"
  },
  medicalAuthorization: {
    si: "Sí",
    no: "No",
    no_aplica: "No aplica"
  },
  mealSchedule: {
    fijos: "Fijos",
    variables: "Variables",
    mixtos: "Mixtos"
  },
  mealsPerDay: {
    "2": "2 comidas",
    "3": "3 comidas",
    "4": "4 comidas",
    "5_plus": "5 o más"
  },
  nutritionPreference: {
    simple: "Simple",
    estructurada: "Estructurada"
  },
  transportToWork: {
    home_office: "Home office / remoto",
    caminando: "Caminando",
    bicicleta: "Bicicleta",
    moto: "Moto",
    auto: "Auto",
    colectivo: "Colectivo",
    tren_subte: "Tren / subte"
  },
  commuteDistance: {
    lt_2: "Menos de 2 km",
    "2_5": "2 a 5 km",
    "5_10": "5 a 10 km",
    "10_20": "10 a 20 km",
    gt_20: "Más de 20 km"
  },
  commuteTime: {
    lt_15: "Menos de 15 min",
    "15_30": "15 a 30 min",
    "30_45": "30 a 45 min",
    "45_60": "45 a 60 min",
    gt_60: "Más de 60 min"
  },
  followupBestTime: {
    manana: "Mañana",
    tarde: "Tarde",
    noche: "Noche"
  }
};

export const onboardingDisplaySections: DisplaySection[] = [
  {
    title: "Datos personales",
    fields: [
      { key: "fullName", label: "Nombre y apellido" },
      { key: "email", label: "Email" },
      { key: "whatsapp", label: "WhatsApp" },
      { key: "age", label: "Edad" },
      { key: "sex", label: "Sexo" },
      { key: "cityCountry", label: "Ciudad y país" }
    ]
  },
  {
    title: "Entrenamiento",
    fields: [
      { key: "mainGoal", label: "Objetivo principal" },
      { key: "currentLevel", label: "Nivel actual" },
      { key: "trainingDaysPerWeek", label: "Días por semana" },
      { key: "sessionTime", label: "Tiempo por sesión" },
      { key: "trainingPlace", label: "Dónde entrena" },
      { key: "availableEquipment", label: "Equipamiento disponible" },
      { key: "injuriesLimitations", label: "Lesiones o limitaciones" },
      { key: "medicalConditionMedication", label: "Condición médica o medicación" },
      { key: "medicalAuthorization", label: "Autorización médica" }
    ]
  },
  {
    title: "Nutrición",
    fields: [
      { key: "currentNutrition", label: "Alimentación actual" },
      { key: "allergiesRestrictions", label: "Alergias o restricciones" },
      { key: "mealSchedule", label: "Horarios para comer" },
      { key: "mealsPerDay", label: "Comidas por día" },
      { key: "nutritionPreference", label: "Preferencia nutricional" }
    ]
  },
  {
    title: "Estilo de vida y seguimiento",
    fields: [
      { key: "occupation", label: "Ocupación" },
      { key: "typicalDay", label: "Día típico" },
      { key: "hobbies", label: "Hobbies" },
      { key: "transportToWork", label: "Transporte al trabajo/estudio" },
      { key: "commuteDistance", label: "Distancia por trayecto" },
      { key: "commuteTime", label: "Tiempo por trayecto" },
      { key: "followupBestTime", label: "Mejor horario para seguimiento" },
      { key: "hardestPart", label: "Qué le cuesta más sostener hoy" },
      { key: "extraNotes", label: "Notas adicionales" },
      { key: "consentConfirmed", label: "Consentimiento" }
    ]
  }
];

export function formatOnboardingAnswerValue(key: OnboardingAnswerKey, value: OnboardingAnswersInput[OnboardingAnswerKey]) {
  if (typeof value === "boolean") {
    return value ? "Sí" : "No";
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (!value) {
    return "-";
  }

  const mappedLabel = optionLabels[key]?.[String(value)];
  if (mappedLabel) {
    return mappedLabel;
  }

  return String(value);
}
