import { NextRequest, NextResponse } from "next/server";

import { onboardingAnswersSchema } from "@/features/onboarding/schema";
import { saveOnboardingByUserId } from "@/lib/server/onboarding-admin";
import { getCurrentAuthenticatedUser } from "@/lib/server/supabase-auth";

function asFile(value: FormDataEntryValue | null): File | null {
  if (!value || typeof value === "string") {
    return null;
  }

  if (value.size <= 0) {
    return null;
  }

  return value;
}

export async function POST(request: NextRequest) {
  const user = await getCurrentAuthenticatedUser();
  if (!user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const mode = formData.get("mode");
    const payloadRaw = formData.get("payload");

    if (typeof payloadRaw !== "string") {
      return NextResponse.json({ ok: false, error: "Missing payload" }, { status: 400 });
    }

    const parsedPayload = JSON.parse(payloadRaw) as unknown;
    const parsedAnswers = onboardingAnswersSchema.safeParse(parsedPayload);
    if (!parsedAnswers.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "Validation failed",
          details: parsedAnswers.error.issues
        },
        { status: 400 }
      );
    }

    const status = mode === "submit" ? "submitted" : "draft";
    const frontPhoto = asFile(formData.get("frontPhoto"));
    const sidePhoto = asFile(formData.get("sidePhoto"));

    await saveOnboardingByUserId({
      userId: user.id,
      answers: parsedAnswers.data,
      status,
      frontPhoto,
      sidePhoto
    });

    return NextResponse.json({
      ok: true,
      status
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.toLowerCase().includes("locked") ? 409 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
