import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { TbArrowLeft } from "react-icons/tb";

import { ChatThread } from "@/features/chat/components/ChatThread";
import { getChatCopy } from "@/features/chat/i18n";
import { LandingHeader } from "@/features/landing/components/LandingHeader";
import { getLandingContent } from "@/features/landing/i18n/messages";
import { isUuid } from "@/lib/chat/chat-policy";
import { findProfileById, isUserAdmin } from "@/lib/server/supabase-admin";
import { getCurrentAuthenticatedUser } from "@/lib/server/supabase-auth";
import { getRequestLocale } from "@/lib/i18n/get-request-locale";

type Props = { params: Promise<{ customerId: string }> };

export default async function AdminCustomerChatPage({ params }: Props) {
  const [user, locale, { customerId }] = await Promise.all([getCurrentAuthenticatedUser(), getRequestLocale(), params]);
  if (!user?.id) redirect("/");
  if (!(await isUserAdmin(user.id))) redirect("/");
  if (!isUuid(customerId)) notFound();

  const profile = await findProfileById(customerId);
  if (!profile) notFound();
  const copy = getChatCopy(locale);

  return (
    <div className="bg-canvas text-primary min-h-screen">
      <LandingHeader content={getLandingContent(locale)} showSectionLinks={false} />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <Link href="/admin/chat" className="text-accent mb-5 inline-flex items-center gap-2 text-sm hover:underline">
          <TbArrowLeft className="h-4 w-4" aria-hidden="true" /> {copy.backToInbox}
        </Link>
        <header className="mb-6">
          <h1 className="text-2xl font-semibold sm:text-3xl">{profile.fullName || profile.email || copy.student}</h1>
          {profile.email ? <p className="text-muted mt-2 text-sm">{profile.email}</p> : null}
        </header>
        <ChatThread endpoint={`/api/admin/chat/${customerId}`} locale={locale} isAdmin />
      </main>
    </div>
  );
}
