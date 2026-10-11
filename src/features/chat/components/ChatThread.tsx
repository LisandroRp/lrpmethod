"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { TbRefresh } from "react-icons/tb";

import type { AppLocale } from "@/features/landing/i18n/types";
import { getChatCopy } from "@/features/chat/i18n";
import { CHAT_MESSAGE_LIMIT } from "@/lib/chat/chat-policy";
import type { ChatMessage, ChatStatus } from "@/lib/server/chat-admin";

type ChatResponse = {
  ok: boolean;
  error?: string;
  messages?: ChatMessage[];
  hasMore?: boolean;
  status?: ChatStatus | null;
  message?: ChatMessage;
};

type ChatThreadProps = {
  endpoint: string;
  locale: AppLocale;
  isAdmin: boolean;
  routineId?: number | null;
};

function mergeMessages(current: ChatMessage[], incoming: ChatMessage[]) {
  const byId = new Map(current.map((message) => [message.id, message]));
  for (const message of incoming) {
    byId.set(message.id, message);
  }
  return [...byId.values()].sort((a, b) => a.id - b.id);
}

export function ChatThread({ endpoint, locale, isAdmin, routineId = null }: ChatThreadProps) {
  const copy = getChatCopy(locale);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const shouldStickToBottom = useRef(true);

  const readError = useCallback((code?: string) => {
    if (code === "limit_reached") return copy.limitReached;
    if (code === "plan_required") return copy.planRequired;
    if (code === "invalid_message") return copy.invalidMessage;
    return copy.unavailable;
  }, [copy.invalidMessage, copy.limitReached, copy.planRequired, copy.unavailable]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch(endpoint, { cache: "no-store" });
      const payload = (await response.json()) as ChatResponse;
      if (!response.ok || !payload.ok || !payload.messages) {
        throw new Error(readError(payload.error));
      }
      setMessages((current) => hasLoaded ? mergeMessages(current, payload.messages ?? []) : payload.messages ?? []);
      if (!hasLoaded) setHasMore(Boolean(payload.hasMore));
      setStatus(payload.status ?? null);
      setHasLoaded(true);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : copy.unavailable);
    } finally {
      setIsRefreshing(false);
    }
  }, [copy.unavailable, endpoint, hasLoaded, readError]);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 25000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  useEffect(() => {
    if (hasLoaded && shouldStickToBottom.current && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [hasLoaded, messages]);

  async function loadOlder() {
    const oldestId = messages[0]?.id;
    if (!oldestId || isLoadingOlder) return;
    shouldStickToBottom.current = false;
    setIsLoadingOlder(true);
    try {
      const response = await fetch(`${endpoint}?before=${oldestId}`, { cache: "no-store" });
      const payload = (await response.json()) as ChatResponse;
      if (!response.ok || !payload.ok || !payload.messages) throw new Error(readError(payload.error));
      setMessages((current) => mergeMessages(current, payload.messages ?? []));
      setHasMore(Boolean(payload.hasMore));
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : copy.unavailable);
    } finally {
      setIsLoadingOlder(false);
    }
  }

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || body.length > CHAT_MESSAGE_LIMIT || isSending) {
      setError(copy.invalidMessage);
      return;
    }

    setIsSending(true);
    setError(null);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, routineId: isAdmin ? null : routineId })
      });
      const payload = (await response.json()) as ChatResponse;
      if (!response.ok || !payload.ok || !payload.message) throw new Error(readError(payload.error));
      shouldStickToBottom.current = true;
      setMessages((current) => mergeMessages(current, [payload.message as ChatMessage]));
      if (payload.status !== undefined) setStatus(payload.status ?? null);
      setDraft("");
      void refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : copy.unavailable);
    } finally {
      setIsSending(false);
    }
  }

  const remaining = status?.messageLimit === null || status === null ? null : Math.max(0, status.messageLimit - status.used);
  const canSend = Boolean(status) && (isAdmin || remaining === null || remaining > 0);
  const dateLocale = locale === "es" ? "es-AR" : "en-US";

  return (
    <section className="panel p-4 sm:p-6" aria-label={copy.title}>
      <div className="border-subtle flex items-start justify-between gap-3 border-b pb-4">
        <div>
          {!isAdmin && status?.planCode === "premium" ? <p className="text-accent text-sm">{copy.premiumUnlimited}</p> : null}
          {!isAdmin && remaining !== null ? (
            <p className="text-accent text-sm">{copy.remaining(remaining)}</p>
          ) : null}
          {!isAdmin && status?.resetsAt ? (
            <p className="text-muted mt-1 text-xs">{copy.resets(new Date(status.resetsAt).toLocaleDateString(dateLocale))}</p>
          ) : null}
          {!status && hasLoaded ? <p className="text-muted text-sm">{copy.planRequired}</p> : null}
        </div>
        <button type="button" className="btn-secondary inline-flex items-center gap-2 text-sm" onClick={() => void refresh()} disabled={isRefreshing}>
          <TbRefresh className="h-4 w-4" aria-hidden="true" /> {copy.refresh}
        </button>
      </div>

      {hasMore ? (
        <button type="button" className="text-accent mt-4 text-sm hover:underline" onClick={() => void loadOlder()} disabled={isLoadingOlder}>
          {copy.loadOlder}
        </button>
      ) : null}

      <div
        ref={listRef}
        className="mt-4 max-h-[60vh] min-h-48 space-y-3 overflow-y-auto pr-1"
        aria-live="polite"
        aria-relevant="additions text"
        onScroll={(event) => {
          const list = event.currentTarget;
          shouldStickToBottom.current = list.scrollHeight - list.scrollTop - list.clientHeight < 100;
        }}
      >
        {!hasLoaded && isRefreshing ? <p className="text-muted text-sm">{copy.loading}</p> : null}
        {hasLoaded && messages.length === 0 ? <p className="text-muted text-sm">{isAdmin ? copy.emptyAdminChat : copy.emptyChat}</p> : null}
        {messages.map((message) => {
          const isMine = isAdmin ? message.senderKind === "admin" : message.senderKind === "customer";
          return (
            <article key={message.id} className={`border-subtle max-w-[90%] rounded-xl border p-3 sm:max-w-[78%] ${isMine ? "bg-surface ml-auto" : "bg-canvas"}`}>
              <div className="text-muted flex items-center justify-between gap-3 text-xs">
                <span>{message.senderKind === "admin" ? copy.teamName : isAdmin ? copy.student : copy.you}</span>
                <time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleString(dateLocale, { dateStyle: "short", timeStyle: "short" })}</time>
              </div>
              <p className="text-primary mt-2 whitespace-pre-wrap break-words text-sm">{message.body}</p>
              {message.routineId ? (
                <Link className="text-accent mt-2 inline-block text-xs hover:underline" href={`/my-plan/${message.routineId}`}>
                  {copy.routineLink} #{message.routineId}
                </Link>
              ) : null}
            </article>
          );
        })}
      </div>

      {error ? <p role="alert" className="text-accent mt-4 text-sm">{error}</p> : null}
      {remaining === 0 && !isAdmin ? <p className="text-muted mt-4 text-sm">{copy.limitReached}</p> : null}
      {routineId && !isAdmin && canSend ? <p className="text-muted mt-4 text-xs">{copy.routineContext}</p> : null}

      {canSend ? (
        <form className="border-subtle mt-5 space-y-3 border-t pt-5" onSubmit={(event) => void send(event)}>
          <label htmlFor="chat-message" className="text-primary block text-sm font-medium">{isAdmin ? copy.replyLabel : copy.messageLabel}</label>
          <textarea
            id="chat-message"
            className="bg-canvas border-subtle text-primary min-h-28 w-full resize-y rounded-xl border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={CHAT_MESSAGE_LIMIT}
            placeholder={isAdmin ? copy.replyPlaceholder : copy.placeholder}
            required
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted text-xs">{draft.length}/{CHAT_MESSAGE_LIMIT}</span>
            <button type="submit" className="btn-primary" disabled={isSending || !draft.trim()}>{isSending ? copy.sending : copy.send}</button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
