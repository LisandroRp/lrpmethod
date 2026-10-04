"use client";

import { useEffect, useId, useState } from "react";

type SubscriptionHistoryItem = {
  id: number;
  planCode: string;
  status: string;
  createdAt: string;
  canceledAt: string | null;
};

type AdminSubscriptionHistoryMenuProps = {
  history: SubscriptionHistoryItem[];
};

export function AdminSubscriptionHistoryMenu({ history }: AdminSubscriptionHistoryMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <button type="button" className="text-accent cursor-pointer text-sm font-medium" onClick={() => setIsOpen((current) => !current)}>
        {history.length} {history.length === 1 ? "registro" : "registros"}
      </button>

      {isOpen ? (
        <div className="modal-backdrop fixed inset-0 z-40 flex items-center justify-center p-4" onMouseDown={() => setIsOpen(false)}>
          <div
            className="bg-surface border-subtle w-full max-w-md rounded-2xl border p-5 shadow-lg"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id={titleId} className="text-lg font-semibold">
                  Historial de suscripciones
                </h2>
                <p className="text-muted mt-1 text-sm">
                  {history.length} {history.length === 1 ? "registro" : "registros"}
                </p>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setIsOpen(false)} aria-label="Cerrar historial">
                ×
              </button>
            </div>

            <div className="mt-4 max-h-[60vh] space-y-3 overflow-y-auto pr-1">
              {history.map((subscription) => (
                <div key={subscription.id} className="border-subtle rounded-xl border p-3 text-sm">
                  <p className="text-primary font-semibold capitalize">
                    {subscription.planCode} · {subscription.status}
                  </p>
                  <p className="text-muted mt-2">Alta: {new Date(subscription.createdAt).toLocaleString()}</p>
                  <p className="text-muted mt-1">Baja: {subscription.canceledAt ? new Date(subscription.canceledAt).toLocaleString() : "-"}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
