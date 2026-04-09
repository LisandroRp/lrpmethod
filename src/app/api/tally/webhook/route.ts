import { NextRequest, NextResponse } from "next/server";

import { findProfileIdByEmail, upsertRow } from "@/lib/server/supabase-admin";

type TallyField = {
  key?: string;
  label?: string;
  type?: string;
  value?: unknown;
};

type TallyPayload = {
  eventType?: string;
  submissionId?: string;
  formId?: string;
  createdAt?: string;
  data?: {
    submissionId?: string;
    formId?: string;
    createdAt?: string;
    fields?: TallyField[];
    respondent?: {
      email?: string;
    };
  };
  fields?: TallyField[];
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function fieldStringValue(field: TallyField): string | null {
  if (typeof field.value === "string") {
    return field.value;
  }

  if (typeof field.value === "number") {
    return String(field.value);
  }

  return null;
}

function extractEmailFromFields(fields: TallyField[] | undefined): string | null {
  if (!fields?.length) {
    return null;
  }

  for (const field of fields) {
    const label = `${field.label ?? ""} ${field.key ?? ""}`.toLowerCase();
    if (!label.includes("email")) {
      continue;
    }

    const value = fieldStringValue(field);
    if (!value) {
      continue;
    }

    if (value.includes("@")) {
      return normalizeEmail(value);
    }
  }

  return null;
}

function extractEmail(payload: TallyPayload): string | null {
  const emailFromRespondent = payload.data?.respondent?.email;
  if (emailFromRespondent && emailFromRespondent.includes("@")) {
    return normalizeEmail(emailFromRespondent);
  }

  const nestedFieldsEmail = extractEmailFromFields(payload.data?.fields);
  if (nestedFieldsEmail) {
    return nestedFieldsEmail;
  }

  return extractEmailFromFields(payload.fields);
}

export async function POST(request: NextRequest) {
  try {
    const configuredToken = process.env.TALLY_WEBHOOK_TOKEN;
    const requestToken = request.nextUrl.searchParams.get("token");

    if (configuredToken && requestToken !== configuredToken) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const payload = (await request.json()) as TallyPayload;
    const submissionId = payload.data?.submissionId ?? payload.submissionId ?? null;
    const formId = payload.data?.formId ?? payload.formId ?? null;
    const submittedAt = payload.data?.createdAt ?? payload.createdAt ?? new Date().toISOString();
    const fields = payload.data?.fields ?? payload.fields ?? [];
    const email = extractEmail(payload);
    const userId = email ? await findProfileIdByEmail(email) : null;

    await upsertRow(
      "onboarding_submissions",
      {
        user_id: userId,
        email,
        tally_submission_id: submissionId,
        tally_form_id: formId,
        status: "submitted",
        answers: { fields },
        raw_payload: payload,
        submitted_at: submittedAt
      },
      "tally_submission_id"
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
