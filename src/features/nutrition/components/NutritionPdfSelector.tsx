"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { TbChevronDown } from "react-icons/tb";

export type NutritionPdfOption = {
  id: string;
  title: string;
  uploadedAtLabel: string;
  href: string;
};

type NutritionPdfSelectorProps = {
  downloadLabel: string;
  options: NutritionPdfOption[];
  placeholder: string;
};

export function NutritionPdfSelector({ downloadLabel, options, placeholder }: NutritionPdfSelectorProps) {
  const [selectedResourceId, setSelectedResourceId] = useState("");
  const selectedResource = useMemo(
    () => options.find((option) => option.id === selectedResourceId) ?? null,
    [options, selectedResourceId]
  );

  return (
    <div>
      <div className="relative">
        <select
          className="bg-canvas border-subtle text-primary w-full cursor-pointer appearance-none rounded-lg border px-3 py-3 pr-10 text-sm font-semibold outline-none transition-colors hover:border-[color:var(--color-accent)]"
          value={selectedResourceId}
          onChange={(event) => setSelectedResourceId(event.target.value)}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.uploadedAtLabel} - {option.title}
            </option>
          ))}
        </select>
        <TbChevronDown className="text-muted pointer-events-none absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2" aria-hidden="true" />
      </div>

      {selectedResource ? (
        <Link href={selectedResource.href} className="btn-primary mt-3 inline-flex w-full justify-center" target="_blank" rel="noreferrer">
          {downloadLabel}
        </Link>
      ) : null}
    </div>
  );
}
