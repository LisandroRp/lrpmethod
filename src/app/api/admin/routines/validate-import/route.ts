import { NextRequest, NextResponse } from "next/server";

import { routineImportDraftSchema } from "@/lib/routines/routine-import-schema";
import { hydrateRoutineImportDraftWithExercises, isUserAdmin } from "@/lib/server/supabase-admin";
import { getCurrentAuthenticatedUser } from "@/lib/server/supabase-auth";

function getErrorStatus(error: unknown) {
  if (!(error instanceof Error)) {
    return 500;
  }

  if (error.message.includes("exerciseId") || error.message.includes("La rutina no tiene ejercicios")) {
    return 400;
  }

  return 500;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentAuthenticatedUser();
    if (!user?.id) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }

    const admin = await isUserAdmin(user.id);
    if (!admin) {
      return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    }

    const body = (await request.json()) as {
      draft?: unknown;
    };

    const parsedDraft = routineImportDraftSchema.safeParse(body.draft);
    if (!parsedDraft.success) {
      return NextResponse.json(
        {
          error: parsedDraft.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("\n")
        },
        { status: 400 }
      );
    }

    const draft = await hydrateRoutineImportDraftWithExercises(parsedDraft.data);
    return NextResponse.json({ draft });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "No se pudo validar la rutina."
      },
      { status: getErrorStatus(error) }
    );
  }
}
