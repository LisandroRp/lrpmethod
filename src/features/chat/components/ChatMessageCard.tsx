import Link from "next/link";

import type { AppLocale } from "@/features/landing/i18n/types";
import { getChatCopy } from "@/features/chat/i18n";
import type { ChatMessage } from "@/lib/server/chat-admin";

type ChatMessageCardProps = {
  message: ChatMessage;
  locale: AppLocale;
  isAdmin: boolean;
};

export function ChatMessageCard({ message, locale, isAdmin }: ChatMessageCardProps) {
  const copy = getChatCopy(locale);
  const isMine = isAdmin ? message.senderKind === "admin" : message.senderKind === "customer";
  const dateLocale = locale === "es" ? "es-AR" : "en-US";

  return (
    <article className={`max-w-[90%] rounded-xl border p-3 sm:max-w-[78%] ${isMine ? "ml-auto border-[color:var(--color-accent)] bg-[color:var(--color-accent)]" : "bg-canvas border-subtle"}`}>
      <div className={`flex items-center justify-between gap-3 text-xs ${isMine ? "text-[color:var(--color-ink-strong)]" : "text-muted"}`}>
        <span>{message.senderKind === "admin" ? copy.teamName : isAdmin ? copy.student : copy.you}</span>
        <time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleString(dateLocale, { dateStyle: "short", timeStyle: "short" })}</time>
      </div>
      <p className={`mt-2 whitespace-pre-wrap break-words text-sm ${isMine ? "text-[color:var(--color-ink-strong)]" : "text-primary"}`}>{message.body}</p>
      {message.routineId ? (
        <Link className={`mt-2 inline-block text-xs hover:underline ${isMine ? "text-[color:var(--color-ink-strong)] underline" : "text-accent"}`} href={`/my-plan/${message.routineId}`}>
          {copy.routineLink} #{message.routineId}
        </Link>
      ) : null}
    </article>
  );
}
