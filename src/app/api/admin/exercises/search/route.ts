import { NextRequest, NextResponse } from "next/server";

import { isUserAdmin, searchActiveExercisesForAdmin } from "@/lib/server/supabase-admin";
import { getCurrentAuthenticatedUser } from "@/lib/server/supabase-auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentAuthenticatedUser();
    if (!user?.id) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }

    const admin = await isUserAdmin(user.id);
    if (!admin) {
      return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    }

    const query = request.nextUrl.searchParams.get("q") ?? "";
    const locale = request.nextUrl.searchParams.get("locale") === "en" ? "en" : "es";
    const exercises = await searchActiveExercisesForAdmin(query, locale, 5);

    return NextResponse.json({ exercises });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "No se pudieron buscar ejercicios."
      },
      { status: 500 }
    );
  }
}
