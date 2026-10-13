"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { ChatConversation } from "@/lib/server/chat-admin";
import type { AppLocale } from "@/features/landing/i18n/types";
import { selectChatConversations, type LastMessageOrder, type PlanFilter } from "@/features/chat/chat-inbox";
import { ChatRefreshButton } from "@/features/chat/components/ChatRefreshButton";
import { getChatCopy } from "@/features/chat/i18n";

export function AdminChatInbox({ locale }: { locale: AppLocale }) {
  const copy = getChatCopy(locale);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<PlanFilter>("all");
  const [lastMessageOrder, setLastMessageOrder] = useState<LastMessageOrder>("newest");

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

  const planLabels: Record<Exclude<PlanFilter, "all">, string> = {
    basic: "Basic",
    intermediate: "Intermedio",
    premium: "Premium",
    none: copy.noPlan
  };

  const filteredConversations = useMemo(
    () => selectChatConversations(conversations, search, planFilter, lastMessageOrder),
    [conversations, lastMessageOrder, planFilter, search]
  );

  return (
    <section className="panel p-4 sm:p-6">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_11rem_11rem_auto] md:items-end">
        <label className="block">
          <span className="text-muted mb-2 block text-sm font-medium">{copy.searchLabel}</span>
          <input
            className="bg-canvas border-subtle text-primary h-12 w-full rounded-xl border px-4 text-sm outline-none transition focus:ring-2 focus:ring-[var(--color-accent)]"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={copy.searchPlaceholder}
          />
        </label>
        <label className="block">
          <span className="text-muted mb-2 block text-sm font-medium">{copy.planFilterLabel}</span>
          <select
            className="bg-canvas border-subtle text-primary h-12 w-full rounded-xl border px-4 text-sm outline-none transition focus:ring-2 focus:ring-[var(--color-accent)]"
            value={planFilter}
            onChange={(event) => setPlanFilter(event.target.value as PlanFilter)}
          >
            <option value="all">{copy.allPlans}</option>
            <option value="basic">Basic</option>
            <option value="intermediate">Intermedio</option>
            <option value="premium">Premium</option>
            <option value="none">{copy.noPlan}</option>
          </select>
        </label>
        <label className="block">
          <span className="text-muted mb-2 block text-sm font-medium">{copy.lastMessageOrderLabel}</span>
          <select
            className="bg-canvas border-subtle text-primary h-12 w-full rounded-xl border px-4 text-sm outline-none transition focus:ring-2 focus:ring-[var(--color-accent)]"
            value={lastMessageOrder}
            onChange={(event) => setLastMessageOrder(event.target.value as LastMessageOrder)}
          >
            <option value="newest">{copy.newestFirst}</option>
            <option value="oldest">{copy.oldestFirst}</option>
          </select>
        </label>
        <ChatRefreshButton label={copy.refresh} isRefreshing={loading} onRefresh={() => void refresh()} />
      </div>
      {error ? <p role="alert" className="text-accent mt-4 text-sm">{copy.unavailable}</p> : null}
      {loading && conversations.length === 0 ? (
        <div className="flex min-h-32 items-center justify-center" aria-label={copy.loading} role="status">
          <span className="border-subtle h-8 w-8 animate-spin rounded-full border-4" aria-hidden="true" />
        </div>
      ) : null}
      {!loading && !error && filteredConversations.length === 0 ? <p className="text-muted mt-4 text-sm">{copy.emptyInbox}</p> : null}
      <ul className="mt-4 space-y-3">
        {filteredConversations.map((conversation) => (
          <li key={conversation.customerId}>
            <Link
              href={`/admin/chat/${conversation.customerId}`}
              className="bg-canvas border-subtle block rounded-xl border p-4 transition-colors hover:border-[color:var(--color-accent)] focus-visible:border-[color:var(--color-accent)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-primary font-semibold">{conversation.fullName || conversation.email || copy.student}</span>
                <time className="text-muted text-xs" dateTime={conversation.lastMessageAt}>
                  {new Date(conversation.lastMessageAt).toLocaleString(locale === "es" ? "es-AR" : "en-US", { dateStyle: "short", timeStyle: "short" })}
                </time>
              </div>
              {conversation.email && conversation.fullName ? <p className="text-muted mt-1 text-xs">{conversation.email}</p> : null}
              <p className="text-muted mt-2 text-xs">{conversation.planCode ? planLabels[conversation.planCode] : copy.noPlan}</p>
              <p className="text-accent mt-2 text-xs">{conversation.lastSenderKind === "customer" ? copy.lastFromStudent : copy.lastFromTeam}</p>
              <p className="text-muted mt-1 truncate text-sm">{conversation.lastMessage}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
