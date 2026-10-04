"use client";

import { FormEvent, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type AdminSubscribersFiltersProps = {
  status: "all" | "active" | "pending" | "canceled";
  plan: "all" | "basic" | "intermediate" | "premium";
  onboarding: "all" | "with";
  routines: "all" | "with";
  q: string;
};

function buildSearchParams(params: {
  status: string;
  plan: string;
  onboarding: "all" | "with";
  routines: "all" | "with";
  q: string;
}) {
  const nextParams = new URLSearchParams();

  if (params.status !== "all") {
    nextParams.set("status", params.status);
  }

  if (params.plan !== "all") {
    nextParams.set("plan", params.plan);
  }

  if (params.onboarding === "with") {
    nextParams.set("onboarding", "with");
  }

  if (params.routines === "with") {
    nextParams.set("routines", "with");
  }

  const normalizedQuery = params.q.trim();
  if (normalizedQuery) {
    nextParams.set("q", normalizedQuery);
  }

  return nextParams.toString();
}

function ToggleFilter({
  checked,
  label,
  onToggle
}: {
  checked: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button type="button" onClick={onToggle} className="inline-flex cursor-pointer items-center gap-3 text-left">
      <span
        className={`inline-flex h-7 w-[3.25rem] items-center rounded-full border p-1 transition-all ${
          checked
            ? "border-[var(--color-accent)] bg-[var(--color-accent)]"
            : "bg-surface border-subtle"
        }`}
        aria-hidden="true"
      >
        <span
          className={`bg-canvas h-5 w-5 rounded-full transition-transform duration-200 ${
            checked ? "translate-x-[1.25rem]" : "translate-x-0"
          }`}
        />
      </span>
      <span className="text-primary text-sm font-medium">{label}</span>
    </button>
  );
}

export function AdminSubscribersFilters({
  status: initialStatus,
  plan: initialPlan,
  onboarding: initialOnboarding,
  routines: initialRoutines,
  q: initialQuery
}: AdminSubscribersFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [status, setStatus] = useState(initialStatus);
  const [plan, setPlan] = useState(initialPlan);
  const [onboarding, setOnboarding] = useState<"all" | "with">(initialOnboarding);
  const [routines, setRoutines] = useState<"all" | "with">(initialRoutines);
  const [q, setQ] = useState(initialQuery);

  const applyFilters = (nextState?: Partial<AdminSubscribersFiltersProps>) => {
    const search = buildSearchParams({
      status: nextState?.status ?? status,
      plan: nextState?.plan ?? plan,
      onboarding: nextState?.onboarding ?? onboarding,
      routines: nextState?.routines ?? routines,
      q: nextState?.q ?? q
    });

    router.push(search ? `${pathname}?${search}` : pathname);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    applyFilters();
  };

  return (
    <form onSubmit={handleSubmit} className="panel mb-5 grid gap-3 p-4 sm:grid-cols-5">
      <label className="block text-sm">
        <span className="text-muted mb-1 block text-xs">Status</span>
        <select
          name="status"
          value={status}
          onChange={(event) => setStatus(event.target.value as AdminSubscribersFiltersProps["status"])}
          className="bg-canvas border-subtle w-full rounded-lg border px-3 py-2"
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="canceled">Canceled</option>
        </select>
      </label>

      <label className="block text-sm">
        <span className="text-muted mb-1 block text-xs">Plan</span>
        <select
          name="plan"
          value={plan}
          onChange={(event) => setPlan(event.target.value as AdminSubscribersFiltersProps["plan"])}
          className="bg-canvas border-subtle w-full rounded-lg border px-3 py-2"
        >
          <option value="all">All</option>
          <option value="basic">Basic</option>
          <option value="intermediate">Intermediate</option>
          <option value="premium">Premium</option>
        </select>
      </label>

      <div className="block text-sm">
        <span className="text-muted mb-2 block text-xs">Formulario</span>
        <ToggleFilter
          checked={onboarding === "with"}
          label="Solo con formulario"
          onToggle={() => {
            const nextValue = onboarding === "with" ? "all" : "with";
            setOnboarding(nextValue);
          }}
        />
      </div>

      <div className="block text-sm">
        <span className="text-muted mb-2 block text-xs">Rutinas</span>
        <ToggleFilter
          checked={routines === "with"}
          label="Solo con rutinas"
          onToggle={() => {
            const nextValue = routines === "with" ? "all" : "with";
            setRoutines(nextValue);
          }}
        />
      </div>

      <label className="block text-sm sm:col-span-5">
        <span className="text-muted mb-1 block text-xs">Search (name/email/user id)</span>
        <input
          type="text"
          name="q"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          className="bg-canvas border-subtle w-full rounded-lg border px-3 py-2"
          placeholder="Search..."
        />
      </label>

      <div className="sm:col-span-5">
        <button type="submit" className="btn-primary inline-block">
          Apply filters
        </button>
      </div>
    </form>
  );
}
