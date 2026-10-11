import { NextResponse } from "next/server";

import { parseChatMessageInput } from "@/lib/chat/chat-policy";
import { ChatDataError } from "@/lib/server/chat-admin";

export async function readChatPostBody(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return null;
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 8192) {
    return null;
  }

  const body = await request.json().catch(() => null);
  return parseChatMessageInput(body);
}

export function chatErrorResponse(error: unknown) {
  if (error instanceof ChatDataError) {
    if (error.code === "CHAT_LIMIT_REACHED") {
      return NextResponse.json({ ok: false, error: "limit_reached" }, { status: 429 });
    }
    if (error.code === "CHAT_PLAN_REQUIRED") {
      return NextResponse.json({ ok: false, error: "plan_required" }, { status: 403 });
    }
    if (error.code === "CHAT_FORBIDDEN" || error.code === "CHAT_INVALID_ROUTINE") {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }
    if (error.code === "CHAT_INVALID_MESSAGE") {
      return NextResponse.json({ ok: false, error: "invalid_message" }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: false, error: "unavailable" }, { status: 503 });
}
