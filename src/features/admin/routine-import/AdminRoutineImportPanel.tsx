"use client";

import { ChangeEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TbDownload, TbListDetails, TbUpload } from "react-icons/tb";

import { OnboardingAnswersInput } from "@/features/onboarding/schema";
import { RoutineImportDraft, routineImportDraftSchema } from "@/lib/routines/routine-import-schema";

import { buildRoutinePromptMarkdown, getRoutinePromptFilename } from "./routinePrompt";

type AdminRoutineImportPanelProps = {
  userId: string;
  answers: OnboardingAnswersInput;
};

export function getRoutineDraftStorageKey(userId: string) {
  return `lrp:routine-draft:${userId}`;
}

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function AdminRoutineImportPanel({ userId, answers }: AdminRoutineImportPanelProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingNutrition, setIsUploadingNutrition] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleDownloadPrompt = () => {
    downloadTextFile(getRoutinePromptFilename(answers), buildRoutinePromptMarkdown(answers));
  };

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    setError(null);
    setSuccessMessage(null);

    if (!file) {
      return;
    }

    setIsUploading(true);

    try {
      const raw = JSON.parse(await file.text()) as unknown;
      const parsed = routineImportDraftSchema.safeParse(raw);
      if (!parsed.success) {
        setError(parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("\n"));
        return;
      }

      const response = await fetch("/api/admin/routines/validate-import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          draft: parsed.data
        })
      });

      const result = (await response.json()) as { draft?: RoutineImportDraft; error?: string };
      if (!response.ok || !result.draft) {
        throw new Error(result.error ?? "No se pudo validar la rutina.");
      }

      window.sessionStorage.setItem(getRoutineDraftStorageKey(userId), JSON.stringify(result.draft));
      router.push(`/admin/subscribers/${userId}/routine-draft`);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "No pude leer el archivo. Subi un JSON valido sin markdown fences.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleNutritionUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    setError(null);
    setSuccessMessage(null);

    if (!files.length) {
      return;
    }

    setIsUploadingNutrition(true);

    try {
      const formData = new FormData();
      formData.append("userId", userId);
      files.forEach((file) => {
        formData.append("pdfs", file);
      });

      const response = await fetch("/api/admin/nutrition/upload", {
        method: "POST",
        body: formData
      });
      const result = (await response.json()) as { uploadedCount?: number; error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "No se pudieron subir los PDFs.");
      }

      const uploadedCount = result.uploadedCount ?? files.length;
      setSuccessMessage(uploadedCount === 1 ? "Plan de alimentacion subido correctamente." : `${uploadedCount} planes de alimentacion subidos correctamente.`);
      router.refresh();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "No se pudieron subir los PDFs.");
    } finally {
      setIsUploadingNutrition(false);
    }
  };

  return (
    <section className="panel mb-6 p-5">
      <div className="space-y-4">
        <div>
          <h2 className="text-accent text-lg font-semibold">Rutina personalizada</h2>
          <p className="text-muted mt-1 text-sm">
            Descarga el prompt del formulario y subi el JSON devuelto por ChatGPT. La app valida los ejercicios contra la base antes de abrir el
            borrador.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="grid gap-2 sm:grid-cols-3 xl:max-w-3xl">
            <button type="button" className="btn-secondary inline-flex items-center justify-center gap-2 px-4" onClick={handleDownloadPrompt}>
              <TbDownload className="h-5 w-5" />
              Descargar formulario
            </button>
            <label className={`btn-primary inline-flex items-center justify-center gap-2 px-4 ${isUploading ? "cursor-wait opacity-70" : "cursor-pointer"}`}>
              <TbUpload className="h-5 w-5" />
              {isUploading ? "Validando..." : "Subir rutina"}
              <input className="hidden" type="file" accept="application/json,.json" onChange={(event) => void handleUpload(event)} disabled={isUploading} />
            </label>
            <label className={`btn-secondary inline-flex items-center justify-center gap-2 px-4 ${isUploadingNutrition ? "cursor-wait opacity-70" : "cursor-pointer"}`}>
              <TbUpload className="h-5 w-5" />
              {isUploadingNutrition ? "Subiendo..." : "Subir alimentacion"}
              <input
                className="hidden"
                type="file"
                accept="application/pdf,.pdf"
                multiple
                onChange={(event) => void handleNutritionUpload(event)}
                disabled={isUploadingNutrition}
              />
            </label>
          </div>
          <div className="ml-auto flex flex-col items-stretch gap-2 sm:min-w-60">
            <Link href={`/admin/subscribers/${userId}/nutrition`} className="btn-secondary inline-flex items-center justify-center gap-2 px-4">
              <TbListDetails className="h-5 w-5" />
              Alimentacion subida
            </Link>
            <Link href={`/admin/subscribers/${userId}/routines`} className="btn-secondary inline-flex items-center justify-center gap-2 px-4">
              <TbListDetails className="h-5 w-5" />
              Rutinas subidas
            </Link>
          </div>
        </div>
      </div>

      {successMessage ? <p className="mt-4 rounded-lg border border-subtle p-3 text-sm font-semibold text-accent">{successMessage}</p> : null}
      {error ? <p className="mt-4 whitespace-pre-wrap rounded-lg border border-subtle p-3 text-sm text-danger">{error}</p> : null}
    </section>
  );
}
