import { redirect } from "next/navigation";

import { ChatThread } from "@/features/chat/components/ChatThread";
import { getChatCopy } from "@/features/chat/i18n";
import { LandingHeader } from "@/features/landing/components/LandingHeader";
import { getLandingContent } from "@/features/landing/i18n/messages";
import { isUserAdmin } from "@/lib/server/supabase-admin";
import { getCurrentAuthenticatedUser } from "@/lib/server/supabase-auth";
import { getRequestLocale } from "@/lib/i18n/get-request-locale";

type Props = { searchParams: Promise<{ routineId?: string }> };

export default async function ChatPage({ searchParams }: Props) {
  const [user, locale, params] = await Promise.all([getCurrentAuthenticatedUser(), getRequestLocale(), searchParams]);
  if (!user?.id) redirect("/?auth=1");
  if (await isUserAdmin(user.id)) redirect("/admin/chat");

  const routineId = Number(params.routineId);
  const contextRoutineId = Number.isSafeInteger(routineId) && routineId > 0 ? routineId : null;
  const copy = getChatCopy(locale);

  return (
    <div className="bg-canvas text-primary min-h-screen">
      <LandingHeader content={getLandingContent(locale)} showSectionLinks={false} />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold sm:text-3xl">{copy.title}</h1>
          <p className="text-muted mt-2 text-sm sm:text-base">{copy.description}</p>
        </header>
        <ChatThread endpoint="/api/chat" locale={locale} isAdmin={false} routineId={contextRoutineId} />
      </main>
    </div>
  );
}
