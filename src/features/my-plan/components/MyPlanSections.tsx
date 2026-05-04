"use client";

import Link from "next/link";
import { useState } from "react";

export type BasicPlanCard = {
  id: string;
  title: string;
  description: string;
};

export type MyPlanCopy = {
  sectionSwitchLabel: string;
  customPlansTitle: string;
  customPlansDescription: string;
  customPlansEmpty: string;
  customPlansAssigned: string;
  customPlansAssignedHelp: string;
  basicPlansTitle: string;
  basicPlansDescription: string;
  basicPlansLocked: string;
  basicPlansEmpty: string;
  basicPlansOpenCtaLabel: string;
  basicPlansCtaLabel: string;
};

type MyPlanSectionsProps = {
  copy: MyPlanCopy;
  basicPlans: BasicPlanCard[];
  hasCustomPlanAssigned: boolean;
  hasBasicPlansAccess: boolean;
};

type SectionTab = "basic" | "custom";

function BasicPlansSection({
  copy,
  basicPlans,
  hasBasicPlansAccess
}: {
  copy: MyPlanCopy;
  basicPlans: BasicPlanCard[];
  hasBasicPlansAccess: boolean;
}) {
  return (
    <section className="panel border-accent/30 p-5 sm:p-6">
      <h2 className="text-accent text-lg font-semibold">{copy.basicPlansTitle}</h2>
      <p className="text-muted mt-1 text-sm">{copy.basicPlansDescription}</p>

      {!hasBasicPlansAccess ? <p className="text-accent mt-4 text-sm">{copy.basicPlansLocked}</p> : null}

      <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
        {basicPlans.map((plan) => (
          <article key={plan.id} className="card flex flex-col justify-between">
            <div>
            <h3 className="text-sm font-semibold">{plan.title}</h3>
            <p
              className="text-muted mt-2 text-sm"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 4,
                WebkitBoxOrient: "vertical",
                overflow: "hidden"
              }}
            >
              {plan.description}
            </p>
            </div>
            {hasBasicPlansAccess ? (
              <Link href={`/my-plan/${plan.id}`} className="btn-primary mt-4 block w-full text-center">
                {copy.basicPlansOpenCtaLabel}
              </Link>
            ) : (
              <button type="button" className="btn-secondary btn-static mt-4 w-full text-center" disabled>
                {copy.basicPlansCtaLabel}
              </button>
            )}
          </article>
        ))}
      </div>

      {!basicPlans.length ? (
        <div className="bg-canvas border-subtle mt-4 rounded-xl border p-4">
          <p className="text-muted text-sm">{copy.basicPlansEmpty}</p>
        </div>
      ) : null}
    </section>
  );
}

function CustomPlansSection({ copy, hasCustomPlanAssigned }: { copy: MyPlanCopy; hasCustomPlanAssigned: boolean }) {
  return (
    <section className="panel border-accent/30 p-5 sm:p-6">
      <h2 className="text-accent text-lg font-semibold">{copy.customPlansTitle}</h2>
      <p className="text-muted mt-1 text-sm">{copy.customPlansDescription}</p>

      {hasCustomPlanAssigned ? (
        <div className="bg-canvas border-subtle mt-4 rounded-xl border p-4">
          <p className="text-accent text-sm font-medium">{copy.customPlansAssigned}</p>
          <p className="text-muted mt-1 text-sm">{copy.customPlansAssignedHelp}</p>
        </div>
      ) : (
        <div className="bg-canvas border-subtle mt-4 rounded-xl border p-4">
          <p className="text-muted text-sm">{copy.customPlansEmpty}</p>
        </div>
      )}
    </section>
  );
}

export function MyPlanSections({ copy, basicPlans, hasCustomPlanAssigned, hasBasicPlansAccess }: MyPlanSectionsProps) {
  const [selectedSection, setSelectedSection] = useState<SectionTab>("basic");

  return (
    <>
      <div className="lg:hidden">
        <label className="text-accent mb-2 block text-xs font-semibold uppercase tracking-[0.12em]">{copy.sectionSwitchLabel}</label>
        <div className="bg-canvas hover:border-accent rounded-xl border border-[color:var(--color-accent)] px-3 py-2 transition-colors">
          <select
            className="text-primary w-full cursor-pointer bg-transparent text-sm font-semibold outline-none"
            value={selectedSection}
            onChange={(event) => setSelectedSection(event.target.value as SectionTab)}
          >
            <option value="basic">{copy.basicPlansTitle}</option>
            <option value="custom">{copy.customPlansTitle}</option>
          </select>
        </div>

        <div className="mt-4">
          {selectedSection === "basic" ? (
            <BasicPlansSection copy={copy} basicPlans={basicPlans} hasBasicPlansAccess={hasBasicPlansAccess} />
          ) : (
            <CustomPlansSection copy={copy} hasCustomPlanAssigned={hasCustomPlanAssigned} />
          )}
        </div>
      </div>

      <div className="hidden items-start gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)]">
        <BasicPlansSection copy={copy} basicPlans={basicPlans} hasBasicPlansAccess={hasBasicPlansAccess} />
        <div className="h-[95%] m-auto min-h-[22rem] w-px bg-[color:var(--color-accent)]" aria-hidden="true" />
        <CustomPlansSection copy={copy} hasCustomPlanAssigned={hasCustomPlanAssigned} />
      </div>
    </>
  );
}
