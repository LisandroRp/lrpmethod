"use client";

import { TbDownload } from "react-icons/tb";

type DownloadRoutinePdfButtonProps = {
  label: string;
};

export function DownloadRoutinePdfButton({ label }: DownloadRoutinePdfButtonProps) {
  return (
    <button type="button" className="btn-secondary routine-print-action inline-flex items-center gap-2" onClick={() => window.print()}>
      <TbDownload className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}
