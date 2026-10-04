import { formatOnboardingAnswerValue, onboardingDisplaySections } from "@/features/onboarding/answerLabels";
import { OnboardingAnswersInput } from "@/features/onboarding/schema";

function sanitizeFilenamePart(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

export function getRoutinePromptFilename(answers: OnboardingAnswersInput) {
  const name = sanitizeFilenamePart(answers.fullName) || "alumno";
  return `lrp-routine-prompt-${name}.md`;
}

export function buildRoutinePromptMarkdown(answers: OnboardingAnswersInput) {
  const answerSections = onboardingDisplaySections
    .map((section) => {
      const rows = section.fields
        .map((field) => `- **${field.label}:** ${formatOnboardingAnswerValue(field.key, answers[field.key])}`)
        .join("\n");

      return `## ${section.title}\n${rows}`;
    })
    .join("\n\n");

  return `# Crear rutina personalizada LRP Method

Necesito que generes una rutina personalizada usando los datos del formulario de este alumno.

Reglas importantes:
- Devolve solamente JSON valido. No uses markdown fences, comentarios ni texto adicional.
- Usa exclusivamente ejercicios existentes en la base de datos que ya conoces.
- Cada ejercicio debe venir con \`exerciseId\` y \`exerciseName\`.
- La app relaciona la rutina con la base por \`exerciseId\`; \`exerciseName\` es solo referencia humana y sera reemplazado por el nombre canonico de la DB al importar.
- No inventes IDs. Si una variante exacta no existe, usa el ejercicio existente mas cercano y explicalo en \`notes\`.
- Evita combinar levantamientos principales pesados salvo que tenga sentido por el contexto del alumno.
- Las superseries, circuitos o ejercicios combinados deben venir como bloques \`type: "combined"\`.
- Cada ejercicio dentro de un bloque combinado debe traer sus propias series, repeticiones, descanso, RIR y notas.
- La rutina debe ser realista para los dias por semana, tiempo por sesion, experiencia, equipamiento, lesiones y estilo de vida del alumno.
- Usa español para los textos visibles.

Formato obligatorio:

\`\`\`json
{
  "schemaVersion": "lrp-routine-v1",
  "routine": {
    "name": "Nombre de la rutina",
    "description": "Descripcion corta del enfoque.",
    "shortDescription": "Resumen para card, maximo 280 caracteres.",
    "longDescriptionMd": "Guia en Markdown con enfoque, progresion, descansos y notas del coach.",
    "difficulty": "beginner",
    "days": [
      {
        "dayNumber": 1,
        "title": "Dia 1 - Tren superior",
        "notes": "Notas del dia.",
        "items": [
          {
            "type": "single",
            "exerciseId": 123,
            "exerciseName": "Nombre exacto del ejercicio",
            "sets": 3,
            "repsMin": 8,
            "repsMax": 10,
            "restSeconds": 90,
            "rir": 2,
            "notes": ""
          },
          {
            "type": "combined",
            "label": "Superserie A",
            "mode": "superset",
            "exercises": [
              {
                "exerciseId": 456,
                "exerciseName": "Nombre exacto del ejercicio",
                "sets": 3,
                "repsMin": 10,
                "repsMax": 12,
                "restSeconds": 30,
                "rir": 2,
                "notes": ""
              },
              {
                "exerciseId": 789,
                "exerciseName": "Nombre exacto del ejercicio",
                "sets": 3,
                "repsMin": 12,
                "repsMax": 15,
                "restSeconds": 90,
                "rir": 2,
                "notes": ""
              }
            ]
          }
        ]
      }
    ]
  }
}
\`\`\`

Valores permitidos:
- \`schemaVersion\`: siempre \`"lrp-routine-v1"\`.
- \`difficulty\`: \`"beginner"\`, \`"intermediate"\`, \`"advanced"\` o \`null\`.
- \`type\`: \`"single"\` o \`"combined"\`.
- \`mode\`: \`"superset"\`, \`"circuit"\` o \`"combined"\`.
- \`dayNumber\`: de 1 a 7.
- \`sets\`: 1 a 20.
- \`rir\`: 0 a 5 o \`null\`.
- \`repsMin\`, \`repsMax\`, \`restSeconds\`: numero o \`null\`.

# Formulario del alumno

${answerSections}
`;
}
