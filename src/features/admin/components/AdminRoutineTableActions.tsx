"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TbEdit, TbEye, TbTrash } from "react-icons/tb";

type AdminRoutineTableActionsProps = {
  routineId: number;
  userId: string;
};

const iconButtonClass =
  "admin-routine-action-button border-subtle inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40";

export function AdminRoutineTableActions({ routineId, userId }: AdminRoutineTableActionsProps) {
  const router = useRouter();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const routinesHref = `/admin/subscribers/${userId}/routines`;

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/admin/routines/${routineId}?userId=${encodeURIComponent(userId)}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        throw new Error(result.error ?? "No se pudo eliminar la rutina.");
      }

      router.refresh();
      setIsConfirmOpen(false);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "No se pudo eliminar la rutina.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Link href={`/my-plan/${routineId}?backTo=${encodeURIComponent(routinesHref)}`} className={iconButtonClass} aria-label="Ver rutina" title="Ver rutina">
        <TbEye className="h-5 w-5" />
      </Link>
      <Link href={`/admin/subscribers/${userId}/routine-draft?routineId=${routineId}`} className={iconButtonClass} aria-label="Editar rutina" title="Editar rutina">
        <TbEdit className="h-5 w-5" />
      </Link>
      <button
        type="button"
        className={iconButtonClass}
        onClick={() => {
          setDeleteError(null);
          setIsConfirmOpen(true);
        }}
        disabled={isDeleting}
        aria-label="Eliminar rutina"
        title="Eliminar rutina"
      >
        <TbTrash className="h-5 w-5" />
      </button>
      {isConfirmOpen ? (
        <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setIsConfirmOpen(false)}>
          <div className="bg-surface border-subtle w-full max-w-sm rounded-2xl border p-5 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <h2 className="text-lg font-semibold text-primary">Eliminar rutina</h2>
            <p className="text-muted mt-2 text-sm">La rutina se ocultara de este usuario. Esta accion no borra los ejercicios del catalogo.</p>
            {deleteError ? <p className="mt-3 rounded-lg border border-subtle p-3 text-sm text-danger">{deleteError}</p> : null}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setIsConfirmOpen(false)} disabled={isDeleting}>
                Cancelar
              </button>
              <button type="button" className="btn-primary" onClick={() => void handleDelete()} disabled={isDeleting}>
                {isDeleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
