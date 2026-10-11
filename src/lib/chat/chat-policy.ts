export const CHAT_MESSAGE_LIMIT = 2000;

export type ChatPlanCode = "basic" | "intermediate" | "premium" | null;

export function canCustomerSendChat(planCode: ChatPlanCode) {
  return planCode === "intermediate" || planCode === "premium";
}

export function getChatMenuDestination(isAdmin: boolean) {
  return isAdmin ? "/admin/chat" : "/chat";
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function parseChatMessageInput(value: unknown): { body: string; routineId: number | null } | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const input = value as Record<string, unknown>;
  if (typeof input.body !== "string") {
    return null;
  }

  const body = input.body.trim();
  if (!body || body.length > CHAT_MESSAGE_LIMIT) {
    return null;
  }

  const routineId = input.routineId;
  if (routineId === undefined || routineId === null) {
    return { body, routineId: null };
  }

  if (!Number.isSafeInteger(routineId) || Number(routineId) <= 0) {
    return null;
  }

  return { body, routineId: Number(routineId) };
}

export function parseBeforeId(value: string | null) {
  if (value === null) {
    return null;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}
