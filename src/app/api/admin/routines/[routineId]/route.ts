import { NextRequest, NextResponse } from "next/server";

import { routineImportDraftSchema } from "@/lib/routines/routine-import-schema";
import { deactivatePersonalizedRoutineTemplateForUser, isUserAdmin, updatePersonalizedRoutineTemplateFromDraft } from "@/lib/server/supabase-admin";
import { getCurrentAuthenticatedUser } from "@/lib/server/supabase-auth";

type AdminRoutineRouteProps = {
  params: Promise<{
    routineId: string;
  }>;
};

export async function DELETE(request: NextRequest, { params }: AdminRoutineRouteProps) {
  try {
    const user = await getCurrentAuthenticatedUser();
    if (!user?.id) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }

    const admin = await isUserAdmin(user.id);
    if (!admin) {
      return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    }

    const { routineId } = await params;
    const parsedRoutineId = Number(routineId);
    const userId = request.nextUrl.searchParams.get("userId");

    if (!Number.isInteger(parsedRoutineId) || parsedRoutineId <= 0 || !userId) {
      return NextResponse.json({ error: "Datos invalidos para eliminar la rutina." }, { status: 400 });
    }

    await deactivatePersonalizedRoutineTemplateForUser({
      routineId: parsedRoutineId,
      userId
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "No se pudo eliminar la rutina."
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: AdminRoutineRouteProps) {
  try {
    const user = await getCurrentAuthenticatedUser();
    if (!user?.id) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }

    const admin = await isUserAdmin(user.id);
    if (!admin) {
      return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    }

    const { routineId } = await params;
    const parsedRoutineId = Number(routineId);
    const body = (await request.json()) as {
      userId?: unknown;
      draft?: unknown;
    };

    if (!Number.isInteger(parsedRoutineId) || parsedRoutineId <= 0 || typeof body.userId !== "string" || !body.userId.trim()) {
      return NextResponse.json({ error: "Datos invalidos para editar la rutina." }, { status: 400 });
    }

    const parsedDraft = routineImportDraftSchema.safeParse(body.draft);
    if (!parsedDraft.success) {
      return NextResponse.json(
        {
          error: parsedDraft.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("\n")
        },
        { status: 400 }
      );
    }

    const result = await updatePersonalizedRoutineTemplateFromDraft({
      routineId: parsedRoutineId,
      userId: body.userId,
      draft: parsedDraft.data
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "No se pudo editar la rutina."
      },
      { status: 500 }
    );
  }
}
