import { NextRequest, NextResponse } from "next/server";

import { parseBeforeId } from "@/lib/chat/chat-policy";
import { getChatMessages, getChatStatus, sendChatMessage } from "@/lib/server/chat-admin";
import { chatErrorResponse, readChatPostBody } from "@/lib/server/chat-route";
import { getCurrentAuthenticatedUser } from "@/lib/server/supabase-auth";

export async function GET(request: NextRequest) {
  const user = await getCurrentAuthenticatedUser();
  if (!user?.id) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const beforeParam = request.nextUrl.searchParams.get("before");
  const beforeId = parseBeforeId(beforeParam);
  if (beforeParam !== null && beforeId === null) {
    return NextResponse.json({ ok: false, error: "invalid_cursor" }, { status: 400 });
  }

  try {
    const [status, page] = await Promise.all([getChatStatus(user.id), getChatMessages(user.id, beforeId)]);
    return NextResponse.json({ ok: true, status, ...page });
  } catch (error) {
    return chatErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentAuthenticatedUser();
  if (!user?.id) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const input = await readChatPostBody(request);
  if (!input) {
    return NextResponse.json({ ok: false, error: "invalid_message" }, { status: 400 });
  }

  try {
    const message = await sendChatMessage({ customerId: user.id, senderId: user.id, ...input });
    const status = await getChatStatus(user.id).catch(() => undefined);
    return NextResponse.json({ ok: true, message, ...(status === undefined ? {} : { status }) }, { status: 201 });
  } catch (error) {
    return chatErrorResponse(error);
  }
}
