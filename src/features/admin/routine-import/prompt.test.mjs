import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

import typescript from "typescript";

const projectRoot = fileURLToPath(new URL("../../../../", import.meta.url));

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith(".") && context.parentURL?.endsWith(".ts")) {
      const filePath = new URL(`${specifier}.ts`, context.parentURL);
      if (existsSync(filePath)) return nextResolve(filePath.href, context);
    }
    if (!specifier.startsWith("@/")) return nextResolve(specifier, context);
    const basePath = join(projectRoot, "src", specifier.slice(2));
    const filePath = [basePath, `${basePath}.ts`, `${basePath}.tsx`].find(existsSync);
    assert.ok(filePath, `Cannot resolve ${specifier}`);
    return nextResolve(pathToFileURL(filePath).href, context);
  },
  load(url, context, nextLoad) {
    if (!url.endsWith(".ts")) return nextLoad(url, context);
    const source = readFileSync(new URL(url), "utf8");
    const output = typescript.transpileModule(source, {
      compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 }
    });
    return { format: "module", source: output.outputText, shortCircuit: true };
  }
});

const [{ buildRoutinePromptMarkdown, getRoutinePromptFilename }, { buildNutritionPromptMarkdown, getNutritionPromptFilename }, { onboardingAnswersSchema }, { formatOnboardingAnswerValue }] = await Promise.all([
  import("./routinePrompt.ts"),
  import("./nutritionPrompt.ts"),
  import("../../onboarding/schema.ts"),
  import("../../onboarding/answerLabels.ts")
]);

const answers = {
  fullName: "María López",
  email: "maria@example.com",
  whatsapp: "+54 111 222 333",
  age: 17,
  heightCm: 165,
  weightKg: 62.5,
  sex: "mujer",
  cityCountry: "Buenos Aires, Argentina",
  mainGoal: "salud",
  currentLevel: "principiante",
  trainingDaysPerWeek: "3",
  sessionTime: "45_60",
  trainingPlace: "gimnasio",
  availableEquipment: "mancuernas",
  injuriesLimitations: "ninguna",
  medicalConditionMedication: "medicación declarada",
  medicalAuthorization: "si",
  currentNutrition: "comidas caseras",
  allergiesRestrictions: "alergia al maní",
  mealSchedule: "variables",
  mealsPerDay: "3",
  nutritionPreference: "simple",
  occupation: "estudiante",
  typicalDay: "clases por la mañana",
  transportToWork: "colectivo",
  commuteDistance: "5_10",
  commuteTime: "30_45",
  followupBestTime: "tarde",
  hardestPart: "organizar las comidas",
  extraNotes: "prefiere preparaciones rápidas",
  hobbies: "lectura",
  consentConfirmed: true
};

test("routine prompt keeps its existing filename and JSON contract", () => {
  const markdown = buildRoutinePromptMarkdown(answers);

  assert.equal(getRoutinePromptFilename(answers), "lrp-routine-prompt-maria-lopez.md");
  assert.match(markdown, /"schemaVersion": "lrp-routine-v1"/);
  assert.match(markdown, /\*\*Email:\*\* maria@example\.com/);
  assert.match(markdown, /\*\*WhatsApp:\*\* \+54 111 222 333/);
});

test("nutrition prompt includes relevant context without contact details", () => {
  const markdown = buildNutritionPromptMarkdown({ ...answers, injuriesLimitations: "dolor de hombro" });

  assert.equal(getNutritionPromptFilename(answers), "lrp-nutrition-prompt-maria-lopez.md");
  assert.match(markdown, /\*\*Alergias o restricciones:\*\* alergia al maní/);
  assert.match(markdown, /\*\*Condición médica o medicación:\*\* medicación declarada/);
  assert.match(markdown, /\*\*Comidas por día:\*\* 3 comidas/);
  assert.match(markdown, /\*\*Altura \(cm\):\*\* 165/);
  assert.match(markdown, /\*\*Peso actual \(kg\):\*\* 62\.5/);
  assert.match(markdown, /menor de edad/);
  assert.match(markdown, /EXACTAMENTE 2 páginas A4 verticales/);
  assert.match(markdown, /\*\*Página 1: Día A\*\*/);
  assert.match(markdown, /\*\*Página 2: Día B\*\*/);
  assert.match(markdown, /al menos dos por página/);
  assert.match(markdown, /No impongas cuatro comidas por defecto/);
  assert.match(markdown, /No inventes una firma, matrícula, certificación/);
  assert.match(markdown, /Si tu herramienta no puede generar o revisar un PDF con imágenes/);
  assert.doesNotMatch(markdown, /dolor de hombro/);
  assert.doesNotMatch(markdown, /maria@example\.com|\+54 111 222 333|María López|mancuernas/);
  assert.doesNotMatch(markdown, /\*\*Email:\*\*|\*\*WhatsApp:\*\*/);
});

test("structured nutrition prompt requests measured portions without inventing individual targets", () => {
  const markdown = buildNutritionPromptMarkdown({ ...answers, nutritionPreference: "estructurada" });

  assert.match(markdown, /podés usar cantidades medidas cuando los datos permitan justificarlas/);
  assert.match(markdown, /No inventes necesidades calóricas, macros ni gramajes personalizados/);
  assert.match(markdown, /\*\*Preferencia nutricional:\*\* Estructurada/);
});

test("nutrition prompt defaults to flexible portions without a declared preference", () => {
  const markdown = buildNutritionPromptMarkdown({ ...answers, nutritionPreference: null });

  assert.match(markdown, /medidas fáciles de visualizar/);
  assert.match(markdown, /\*\*Preferencia nutricional:\*\* -/);
});

test("onboarding requires realistic height and weight for new submissions", () => {
  assert.equal(onboardingAnswersSchema.safeParse(answers).success, true);
  assert.equal(onboardingAnswersSchema.safeParse({ ...answers, heightCm: undefined }).success, false);
  assert.equal(onboardingAnswersSchema.safeParse({ ...answers, weightKg: undefined }).success, false);
  assert.equal(onboardingAnswersSchema.safeParse({ ...answers, heightCm: 0 }).success, false);
  assert.equal(onboardingAnswersSchema.safeParse({ ...answers, weightKg: 0 }).success, false);
  assert.equal(onboardingAnswersSchema.safeParse({ ...answers, weightKg: 501 }).success, false);
});

test("older onboarding records display missing measurements without inventing values", () => {
  assert.equal(formatOnboardingAnswerValue("heightCm", undefined), "-");
  assert.equal(formatOnboardingAnswerValue("weightKg", undefined), "-");
});
