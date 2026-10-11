import { NextResponse } from "next/server";

import { listChatConversations } from "@/lib/server/chat-admin";
import { chatErrorResponse } from "@/lib/server/chat-route";
import { isUserAdmin } from "@/lib/server/supabase-admin";
import { getCurrentAuthenticatedUser } from "@/lib/server/supabase-auth";

export async function GET() {
  const user = await getCurrentAuthenticatedUser();
  if (!user?.id) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!(await isUserAdmin(user.id))) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  try {
    return NextResponse.json({ ok: true, conversations: await listChatConversations() });
  } catch (error) {
    return chatErrorResponse(error);
  }
}
