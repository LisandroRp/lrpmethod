import "server-only";

export type ChatMessage = {
  id: number;
  customerId: string;
  senderId: string | null;
  senderKind: "customer" | "admin";
  body: string;
  routineId: number | null;
  createdAt: string;
};

export type ChatStatus = {
  planCode: "intermediate" | "premium";
  used: number;
  messageLimit: number | null;
  resetsAt: string | null;
};

export type ChatConversation = {
  customerId: string;
  fullName: string | null;
  email: string | null;
  planCode: "basic" | "intermediate" | "premium" | null;
  lastMessage: string;
  lastMessageAt: string;
  lastSenderKind: "customer" | "admin";
};

type ChatMessageRow = {
  id: number;
  customer_id: string;
  sender_id: string | null;
  sender_kind: "customer" | "admin";
  body: string;
  routine_id: number | null;
  created_at: string;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export class ChatDataError extends Error {
  constructor(public readonly code: string) {
    super(code);
  }
}

async function chatFetch(path: string, init: RequestInit) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new ChatDataError("CHAT_UNAVAILABLE");
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      ...init.headers
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    const knownCodes = ["CHAT_LIMIT_REACHED", "CHAT_PLAN_REQUIRED", "CHAT_FORBIDDEN", "CHAT_INVALID_ROUTINE", "CHAT_INVALID_MESSAGE"];
    const code = knownCodes.find((candidate) => payload?.message?.includes(candidate)) ?? "CHAT_UNAVAILABLE";
    throw new ChatDataError(code);
  }

  return response;
}

function mapMessage(row: ChatMessageRow): ChatMessage {
  return {
    id: row.id,
    customerId: row.customer_id,
    senderId: row.sender_id,
    senderKind: row.sender_kind,
    body: row.body,
    routineId: row.routine_id,
    createdAt: row.created_at
  };
}

export async function getChatStatus(customerId: string): Promise<ChatStatus | null> {
  const response = await chatFetch("rpc/chat_get_status", {
    method: "POST",
    body: JSON.stringify({ p_customer_id: customerId })
  });
  const rows = (await response.json()) as Array<{
    plan_code: "intermediate" | "premium";
    used: number;
    message_limit: number | null;
    resets_at: string | null;
  }>;
  const row = rows[0];
  return row
    ? { planCode: row.plan_code, used: row.used, messageLimit: row.message_limit, resetsAt: row.resets_at }
    : null;
}

export async function getChatMessages(customerId: string, beforeId: number | null) {
  const filters = [
    "select=id,customer_id,sender_id,sender_kind,body,routine_id,created_at",
    `customer_id=eq.${encodeURIComponent(customerId)}`,
    "order=id.desc",
    "limit=51"
  ];
  if (beforeId !== null) {
    filters.push(`id=lt.${beforeId}`);
  }

  const response = await chatFetch(`chat_messages?${filters.join("&")}`, { method: "GET" });
  const rows = (await response.json()) as ChatMessageRow[];
  const hasMore = rows.length > 50;
  const page = rows.slice(0, 50);
  return {
    messages: page.reverse().map(mapMessage),
    hasMore
  };
}

export async function sendChatMessage(input: {
  customerId: string;
  senderId: string;
  body: string;
  routineId: number | null;
}): Promise<ChatMessage> {
  const response = await chatFetch("rpc/chat_send_message", {
    method: "POST",
    body: JSON.stringify({
      p_customer_id: input.customerId,
      p_sender_id: input.senderId,
      p_body: input.body,
      p_routine_id: input.routineId
    })
  });
  const rows = (await response.json()) as ChatMessageRow[];
  if (!rows[0]) {
    throw new ChatDataError("CHAT_UNAVAILABLE");
  }
  return mapMessage(rows[0]);
}

export async function listChatConversations(): Promise<ChatConversation[]> {
  const response = await chatFetch("rpc/chat_list_conversations", { method: "POST", body: "{}" });
  const rows = (await response.json()) as Array<{
    customer_id: string;
    full_name: string | null;
    email: string | null;
    plan_code: "basic" | "intermediate" | "premium" | null;
    last_message: string;
    last_message_at: string;
    last_sender_kind: "customer" | "admin";
  }>;
  return rows.map((row) => ({
    customerId: row.customer_id,
    fullName: row.full_name,
    email: row.email,
    planCode: row.plan_code,
    lastMessage: row.last_message,
    lastMessageAt: row.last_message_at,
    lastSenderKind: row.last_sender_kind
  }));
}
