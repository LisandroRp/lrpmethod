import { z } from "zod";

const nullableTextSchema = z.string().max(2000).optional().default("");
const nullableLongTextSchema = z.string().max(8000).optional().default("");
const nullableNumberSchema = z.number().nullable().optional().default(null);

const exerciseInfoSchema = z
  .object({
    description: z.string().nullable().optional().default(null),
    overview: z.string().nullable().optional().default(null),
    instructions: z.string().nullable().optional().default(null),
    tips: z.string().nullable().optional().default(null),
    videoUrl: z.string().nullable().optional().default(null),
    sourceUrl: z.string().nullable().optional().default(null)
  })
  .nullable()
  .optional()
  .default(null);

const exercisePrescriptionSchema = z
  .object({
    exerciseId: z.number().int().positive(),
    exerciseName: z.string().min(1).max(200),
    exerciseInfo: exerciseInfoSchema,
    sets: z.number().int().min(1).max(20),
    repsMin: z.number().int().min(1).max(200).nullable().optional().default(null),
    repsMax: z.number().int().min(1).max(200).nullable().optional().default(null),
    restSeconds: z.number().int().min(0).max(600).nullable().optional().default(null),
    rir: nullableNumberSchema,
    notes: z.string().max(1000).optional().default("")
  })
  .superRefine((exercise, context) => {
    if (exercise.repsMin !== null && exercise.repsMax !== null && exercise.repsMin > exercise.repsMax) {
      context.addIssue({
        code: "custom",
        path: ["repsMax"],
        message: "repsMax must be greater than or equal to repsMin."
      });
    }

    if (exercise.rir !== null && (exercise.rir < 0 || exercise.rir > 5)) {
      context.addIssue({
        code: "custom",
        path: ["rir"],
        message: "rir must be between 0 and 5."
      });
    }
  });

const singleRoutineItemSchema = exercisePrescriptionSchema.extend({
  type: z.literal("single")
});

const combinedRoutineItemSchema = z.object({
  type: z.literal("combined"),
  label: z.string().min(1).max(120),
  mode: z.enum(["superset", "circuit", "combined"]).default("superset"),
  exercises: z.array(exercisePrescriptionSchema).min(2).max(12)
});

const routineDayImportSchema = z.object({
  dayNumber: z.number().int().min(1).max(7),
  title: z.string().min(1).max(160),
  notes: nullableTextSchema,
  items: z.array(z.discriminatedUnion("type", [singleRoutineItemSchema, combinedRoutineItemSchema])).min(1).max(40)
});

export const routineImportDraftSchema = z.object({
  schemaVersion: z.literal("lrp-routine-v1"),
  routine: z.object({
    name: z.string().min(2).max(160),
    description: z.string().min(2).max(1000),
    shortDescription: z.string().max(280).optional().default(""),
    longDescriptionMd: nullableLongTextSchema,
    difficulty: z.enum(["beginner", "intermediate", "advanced"]).nullable().optional().default(null),
    days: z.array(routineDayImportSchema).min(1).max(7)
  })
});

export type RoutineImportDraft = z.infer<typeof routineImportDraftSchema>;
export type RoutineImportDay = RoutineImportDraft["routine"]["days"][number];
export type RoutineImportItem = RoutineImportDay["items"][number];
export type RoutineExercisePrescription = Extract<RoutineImportItem, { type: "single" }>;
export type RoutineCombinedItem = Extract<RoutineImportItem, { type: "combined" }>;
