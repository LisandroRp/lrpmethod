export type PlanCode = "basic" | "intermediate" | "premium";

const defaultPlanPricesArs: Record<PlanCode, number> = {
  basic: 19900,
  intermediate: 44500,
  premium: 69750
};

const planPriceEnvKeys: Record<PlanCode, string> = {
  basic: "PLAN_BASIC_PRICE_ARS",
  intermediate: "PLAN_INTERMEDIATE_PRICE_ARS",
  premium: "PLAN_PREMIUM_PRICE_ARS"
};

function parsePlanPrice(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  const normalized = value.replace(/[^\d]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getPlanPriceAmountArs(planCode: PlanCode) {
  return parsePlanPrice(process.env[planPriceEnvKeys[planCode]], defaultPlanPricesArs[planCode]);
}

export function formatPlanPriceArs(amount: number) {
  return `$${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(amount)}`;
}

export function getPlanPriceLabel(planCode: PlanCode) {
  return formatPlanPriceArs(getPlanPriceAmountArs(planCode));
}
