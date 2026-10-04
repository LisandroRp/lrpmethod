import { NextResponse } from "next/server";

import { saveNutritionPdfForUser } from "@/lib/server/nutrition-admin";
import { isUserAdmin } from "@/lib/server/supabase-admin";
import { getCurrentAuthenticatedUser } from "@/lib/server/supabase-auth";

export async function POST(request: Request) {
  try {
    const user = await getCurrentAuthenticatedUser();
    if (!user?.id) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }

    const admin = await isUserAdmin(user.id);
    if (!admin) {
      return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    }

    const formData = await request.formData();
    const userId = formData.get("userId");
    const files = formData.getAll("pdfs");

    if (typeof userId !== "string" || !userId.trim()) {
      return NextResponse.json({ error: "Falta el usuario destino." }, { status: 400 });
    }

    const pdfs = files.filter((file): file is File => file instanceof File);
    if (!pdfs.length) {
      return NextResponse.json({ error: "Subi al menos un PDF." }, { status: 400 });
    }

    const resourceIds = await Promise.all(
      pdfs.map((file) =>
        saveNutritionPdfForUser({
          userId,
          createdByUserId: user.id,
          file
        })
      )
    );

    return NextResponse.json({
      ok: true,
      uploadedCount: resourceIds.filter(Boolean).length
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "No se pudieron subir los PDFs."
      },
      { status: 500 }
    );
  }
}
