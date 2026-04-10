import { PlanTier } from "@/features/landing/i18n/types";

const REFERENCE_PREFIX = "lrm";

export function buildCheckoutReference(userId: string, planCode: PlanTier["code"]) {
  return `${REFERENCE_PREFIX}|u:${userId}|p:${planCode}`;
}

export function parseCheckoutReference(reference: string | null | undefined): { userId: string | null; planCode: PlanTier["code"] | null } {
  if (!reference) {
    return { userId: null, planCode: null };
  }

  const parts = reference.split("|");
  if (parts[0] !== REFERENCE_PREFIX) {
    return { userId: null, planCode: null };
  }

  let userId: string | null = null;
  let planCode: PlanTier["code"] | null = null;

  for (const part of parts.slice(1)) {
    if (part.startsWith("u:")) {
      userId = part.slice(2) || null;
      continue;
    }

    if (part === "p:basic" || part === "p:intermediate" || part === "p:premium") {
      planCode = part.slice(2) as PlanTier["code"];
    }
  }

  return { userId, planCode };
}
