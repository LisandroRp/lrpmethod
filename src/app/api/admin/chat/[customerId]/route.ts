import { NextRequest, NextResponse } from "next/server";

import { isUuid, parseBeforeId } from "@/lib/chat/chat-policy";
import { getChatMessages, getChatStatus, sendChatMessage } from "@/lib/server/chat-admin";
import { chatErrorResponse, readChatPostBody } from "@/lib/server/chat-route";
import { isUserAdmin } from "@/lib/server/supabase-admin";
import { getCurrentAuthenticatedUser } from "@/lib/server/supabase-auth";

type Props = { params: Promise<{ customerId: string }> };

async function authorize(params: Props["params"]) {
  const user = await getCurrentAuthenticatedUser();
  if (!user?.id) {
    return { error: NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 }) };
  }
  if (!(await isUserAdmin(user.id))) {
    return { error: NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 }) };
  }
  const { customerId } = await params;
  if (!isUuid(customerId)) {
    return { error: NextResponse.json({ ok: false, error: "invalid_customer" }, { status: 400 }) };
  }
  return { user, customerId };
}

export async function GET(request: NextRequest, { params }: Props) {
  const access = await authorize(params);
  if (access.error) {
    return access.error;
  }

  const beforeParam = request.nextUrl.searchParams.get("before");
  const beforeId = parseBeforeId(beforeParam);
  if (beforeParam !== null && beforeId === null) {
    return NextResponse.json({ ok: false, error: "invalid_cursor" }, { status: 400 });
  }

  try {
    const [status, page] = await Promise.all([getChatStatus(access.customerId), getChatMessages(access.customerId, beforeId)]);
    return NextResponse.json({ ok: true, status, ...page });
  } catch (error) {
    return chatErrorResponse(error);
  }
}

export async function POST(request: NextRequest, { params }: Props) {
  const access = await authorize(params);
  if (access.error) {
    return access.error;
  }

  const input = await readChatPostBody(request);
  if (!input) {
    return NextResponse.json({ ok: false, error: "invalid_message" }, { status: 400 });
  }

  try {
    const message = await sendChatMessage({ customerId: access.customerId, senderId: access.user.id, ...input });
    return NextResponse.json({ ok: true, message }, { status: 201 });
  } catch (error) {
    return chatErrorResponse(error);
  }
}
