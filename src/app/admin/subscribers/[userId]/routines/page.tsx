import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminRoutineTableActions } from "@/features/admin/components/AdminRoutineTableActions";
import { LandingHeader } from "@/features/landing/components/LandingHeader";
import { getLandingContent } from "@/features/landing/i18n/messages";
import { getCurrentAuthenticatedUser } from "@/lib/server/supabase-auth";
import { findProfileById, isUserAdmin, listPersonalizedRoutineTemplatesByUserId } from "@/lib/server/supabase-admin";

type AdminSubscriberRoutinesPageProps = {
  params: Promise<{
    userId: string;
  }>;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("es-AR");
}

function formatDifficulty(value: "beginner" | "intermediate" | "advanced" | null) {
  if (value === "beginner") {
    return "Principiante";
  }

  if (value === "intermediate") {
    return "Intermedio";
  }

  if (value === "advanced") {
    return "Avanzado";
  }

  return "-";
}

export default async function AdminSubscriberRoutinesPage({ params }: AdminSubscriberRoutinesPageProps) {
  const content = getLandingContent("es");
  const user = await getCurrentAuthenticatedUser();

  if (!user?.id) {
    redirect("/");
  }

  const admin = await isUserAdmin(user.id);
  if (!admin) {
    redirect("/");
  }

  const { userId } = await params;
  const [profile, routines] = await Promise.all([
    findProfileById(userId),
    listPersonalizedRoutineTemplatesByUserId(userId)
  ]);
  const formHref = `/admin/subscribers/${userId}/onboarding`;

  return (
    <div className="bg-canvas text-primary min-h-screen">
      <LandingHeader content={content} showSectionLinks={false} />
      <main className="px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="section-kicker">Rutinas subidas</p>
              <h1 className="text-2xl font-semibold sm:text-3xl">{profile?.fullName ?? profile?.email ?? "Alumno"}</h1>
              {profile?.email ? <p className="text-muted mt-2 text-sm sm:text-base">{profile.email}</p> : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href={formHref} className="btn-secondary inline-block">
                Volver al formulario
              </Link>
              <Link href="/admin/subscribers" className="btn-secondary inline-block">
                Volver a suscriptores
              </Link>
            </div>
          </div>

          {routines.length ? (
            <div className="panel overflow-x-auto p-5">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="text-muted border-b border-subtle">
                  <tr>
                    <th className="px-3 py-3 font-semibold">Rutina</th>
                    <th className="px-3 py-3 font-semibold">Dificultad</th>
                    <th className="px-3 py-3 font-semibold">Estado</th>
                    <th className="px-3 py-3 font-semibold">Creada</th>
                    <th className="px-3 py-3 font-semibold">Actualizada</th>
                    <th className="px-3 py-3 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {routines.map((routine) => (
                    <tr key={routine.id} className="border-b border-subtle last:border-b-0">
                      <td className="px-3 py-4">
                        <p className="font-semibold">{routine.name}</p>
                        <p className="text-muted mt-1 line-clamp-2">{routine.shortDescription ?? routine.description ?? "-"}</p>
                      </td>
                      <td className="px-3 py-4">{formatDifficulty(routine.difficulty)}</td>
                      <td className="px-3 py-4">{routine.isActive ? "Activa" : "Inactiva"}</td>
                      <td className="px-3 py-4">{formatDate(routine.createdAt)}</td>
                      <td className="px-3 py-4">{formatDate(routine.updatedAt)}</td>
                      <td className="px-3 py-4">
                        <AdminRoutineTableActions routineId={routine.id} userId={userId} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <section className="panel p-5">
              <p className="text-muted text-sm">Todavia no hay rutinas personalizadas subidas para este usuario.</p>
              <Link href={formHref} className="btn-primary mt-4 inline-block">
                Volver al formulario
              </Link>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
