import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { test } from "node:test";

import typescript from "typescript";

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.test";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";

registerHooks({
  load(url, context, nextLoad) {
    if (!url.endsWith(".ts")) return nextLoad(url, context);
    const source = readFileSync(new URL(url), "utf8");
    const output = typescript.transpileModule(source, {
      compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 }
    });
    return { format: "module", source: output.outputText, shortCircuit: true };
  }
});

const { hydrateRoutineImportDraftWithExercises } = await import("./supabase-admin.ts");

const baseExercises = [
  {
    id: 2,
    name: "Leg Press",
    description: "English description",
    overview: "English overview",
    instructions: "English instructions",
    tips: "English tips",
    video_url: "https://www.youtube.com/watch?v=example",
    source_url: null
  },
  {
    id: 100,
    name: "Dumbbell Bench Press",
    description: "Bench description",
    overview: null,
    instructions: null,
    tips: null,
    video_url: null,
    source_url: null
  }
];

const spanishTranslations = [
  {
    exercise_id: 2,
    locale: "es",
    name: "Prensa de piernas",
    description: "Descripción en español",
    overview: "Resumen en español",
    instructions: "Instrucciones en español",
    tips: null
  }
];

const draft = {
  routine: {
    days: [
      {
        items: [
          { type: "single", exerciseId: 2, exerciseName: "Name from imported JSON" },
          {
            type: "combined",
            exercises: [
              { exerciseId: 2, exerciseName: "Name from imported JSON" },
              { exerciseId: 100, exerciseName: "Another imported name" }
            ]
          }
        ]
      }
    ]
  }
};

function mockExerciseRequests(context) {
  const requests = [];
  context.mock.method(globalThis, "fetch", async (input) => {
    const url = new URL(input);
    requests.push(url.pathname);

    if (url.pathname.endsWith("/exercises")) {
      return Response.json(baseExercises);
    }

    if (url.pathname.endsWith("/exercise_translations")) {
      return Response.json(spanishTranslations);
    }

    throw new Error(`Unexpected request: ${url.pathname}`);
  });
  return requests;
}

test("import hydration localizes single and combined exercises by ID", async (context) => {
  const requests = mockExerciseRequests(context);
  const hydrated = await hydrateRoutineImportDraftWithExercises(draft, "es");
  const [single, combined] = hydrated.routine.days[0].items;

  assert.equal(single.exerciseName, "Prensa de piernas");
  assert.equal(single.exerciseInfo.description, "Descripción en español");
  assert.equal(single.exerciseInfo.overview, "Resumen en español");
  assert.equal(single.exerciseInfo.instructions, "Instrucciones en español");
  assert.equal(single.exerciseInfo.tips, "English tips");
  assert.equal(single.exerciseInfo.videoUrl, baseExercises[0].video_url);
  assert.equal(combined.exercises[0].exerciseName, "Prensa de piernas");
  assert.equal(combined.exercises[1].exerciseName, "Dumbbell Bench Press");
  assert.deepEqual(requests, ["/rest/v1/exercises", "/rest/v1/exercise_translations"]);
});

test("English import hydration uses canonical exercise data without a translation request", async (context) => {
  const requests = mockExerciseRequests(context);
  const hydrated = await hydrateRoutineImportDraftWithExercises(draft, "en");
  const [single, combined] = hydrated.routine.days[0].items;

  assert.equal(single.exerciseName, "Leg Press");
  assert.equal(single.exerciseInfo.description, "English description");
  assert.equal(combined.exercises[0].exerciseName, "Leg Press");
  assert.deepEqual(requests, ["/rest/v1/exercises"]);
});
