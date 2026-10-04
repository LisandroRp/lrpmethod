import { NextResponse } from "next/server";

import { createNutritionResourceSignedUrl, findNutritionResourceById } from "@/lib/server/nutrition-admin";
import { findCurrentActiveSubscriptionByUserId, isUserAdmin } from "@/lib/server/supabase-admin";
import { getCurrentAuthenticatedUser } from "@/lib/server/supabase-auth";

type NutritionDownloadRouteProps = {
  params: Promise<{
    resourceId: string;
  }>;
};

function getPlanRank(planCode: "basic" | "intermediate" | "premium" | null) {
  if (planCode === "premium") {
    return 3;
  }

  if (planCode === "intermediate") {
    return 2;
  }

  if (planCode === "basic") {
    return 1;
  }

  return 0;
}

export async function GET(_request: Request, { params }: NutritionDownloadRouteProps) {
  try {
    const user = await getCurrentAuthenticatedUser();
    if (!user?.id) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }

    const { resourceId } = await params;
    const resource = await findNutritionResourceById(resourceId);
    if (!resource) {
      return NextResponse.json({ error: "PDF no encontrado." }, { status: 404 });
    }

    const admin = await isUserAdmin(user.id);
    if (!admin && resource.userId !== user.id) {
      return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    }

    if (!admin) {
      const subscription = await findCurrentActiveSubscriptionByUserId(user.id);
      const planRank = getPlanRank(subscription?.plan_code ?? null);
      const minimumRank = resource.minimumPlanCode === "premium" ? 3 : 2;
      if (planRank < minimumRank) {
        return NextResponse.json({ error: "Tu plan no habilita este PDF." }, { status: 403 });
      }
    }

    const signedUrl = await createNutritionResourceSignedUrl(resource);
    return NextResponse.redirect(signedUrl);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "No se pudo abrir el PDF."
      },
      { status: 500 }
    );
  }
}
