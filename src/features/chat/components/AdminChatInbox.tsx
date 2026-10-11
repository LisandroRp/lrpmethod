"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { TbRefresh } from "react-icons/tb";

import type { ChatConversation } from "@/lib/server/chat-admin";
import type { AppLocale } from "@/features/landing/i18n/types";
import { getChatCopy } from "@/features/chat/i18n";

export function AdminChatInbox({ locale }: { locale: AppLocale }) {
  const copy = getChatCopy(locale);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/chat", { cache: "no-store" });
      const payload = (await response.json()) as { ok: boolean; conversations?: ChatConversation[] };
      if (!response.ok || !payload.ok || !payload.conversations) throw new Error("Chat inbox unavailable");
      setConversations(payload.conversations);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 25000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  return (
    <section className="panel p-4 sm:p-6">
      <div className="flex justify-end">
        <button type="button" className="btn-secondary inline-flex items-center gap-2 text-sm" onClick={() => void refresh()} disabled={loading}>
          <TbRefresh className="h-4 w-4" aria-hidden="true" /> {copy.refresh}
        </button>
      </div>
      {error ? <p role="alert" className="text-accent mt-4 text-sm">{copy.unavailable}</p> : null}
      {loading && conversations.length === 0 ? <p className="text-muted mt-4 text-sm">{copy.loading}</p> : null}
      {!loading && !error && conversations.length === 0 ? <p className="text-muted mt-4 text-sm">{copy.emptyInbox}</p> : null}
      <ul className="mt-4 space-y-3">
        {conversations.map((conversation) => (
          <li key={conversation.customerId}>
            <Link href={`/admin/chat/${conversation.customerId}`} className="bg-canvas border-subtle block rounded-xl border p-4 transition-colors hover:border-[var(--color-accent)]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-primary font-semibold">{conversation.fullName || conversation.email || copy.student}</span>
                <time className="text-muted text-xs" dateTime={conversation.lastMessageAt}>
                  {new Date(conversation.lastMessageAt).toLocaleString(locale === "es" ? "es-AR" : "en-US", { dateStyle: "short", timeStyle: "short" })}
                </time>
              </div>
              {conversation.email && conversation.fullName ? <p className="text-muted mt-1 text-xs">{conversation.email}</p> : null}
              <p className="text-accent mt-2 text-xs">{conversation.lastSenderKind === "customer" ? copy.lastFromStudent : copy.lastFromTeam}</p>
              <p className="text-muted mt-1 truncate text-sm">{conversation.lastMessage}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
