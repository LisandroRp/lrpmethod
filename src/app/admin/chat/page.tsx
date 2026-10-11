import { redirect } from "next/navigation";

import { AdminChatInbox } from "@/features/chat/components/AdminChatInbox";
import { getChatCopy } from "@/features/chat/i18n";
import { LandingHeader } from "@/features/landing/components/LandingHeader";
import { getLandingContent } from "@/features/landing/i18n/messages";
import { isUserAdmin } from "@/lib/server/supabase-admin";
import { getCurrentAuthenticatedUser } from "@/lib/server/supabase-auth";
import { getRequestLocale } from "@/lib/i18n/get-request-locale";

export default async function AdminChatPage() {
  const [user, locale] = await Promise.all([getCurrentAuthenticatedUser(), getRequestLocale()]);
  if (!user?.id) redirect("/");
  if (!(await isUserAdmin(user.id))) redirect("/");

  const copy = getChatCopy(locale);
  return (
    <div className="bg-canvas text-primary min-h-screen">
      <LandingHeader content={getLandingContent(locale)} showSectionLinks={false} />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold sm:text-3xl">{copy.inboxTitle}</h1>
          <p className="text-muted mt-2 text-sm sm:text-base">{copy.inboxDescription}</p>
        </header>
        <AdminChatInbox locale={locale} />
      </main>
    </div>
  );
}
