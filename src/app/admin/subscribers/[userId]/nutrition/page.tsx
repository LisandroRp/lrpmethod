import Link from "next/link";
import { redirect } from "next/navigation";
import { TbExternalLink, TbFileText } from "react-icons/tb";

import { LandingHeader } from "@/features/landing/components/LandingHeader";
import { getLandingContent } from "@/features/landing/i18n/messages";
import { listNutritionResourcesByUserId } from "@/lib/server/nutrition-admin";
import { findProfileById, isUserAdmin } from "@/lib/server/supabase-admin";
import { getCurrentAuthenticatedUser } from "@/lib/server/supabase-auth";

type AdminSubscriberNutritionPageProps = {
  params: Promise<{
    userId: string;
  }>;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("es-AR");
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function AdminSubscriberNutritionPage({ params }: AdminSubscriberNutritionPageProps) {
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
  const [profile, resources] = await Promise.all([
    findProfileById(userId),
    listNutritionResourcesByUserId(userId).catch(() => [])
  ]);
  const formHref = `/admin/subscribers/${userId}/onboarding`;

  return (
    <div className="bg-canvas text-primary min-h-screen">
      <LandingHeader content={content} showSectionLinks={false} />
      <main className="px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="section-kicker">Alimentacion subida</p>
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

          {resources.length ? (
            <div className="panel overflow-x-auto p-5">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="text-muted border-b border-subtle">
                  <tr>
                    <th className="px-3 py-3 font-semibold">PDF</th>
                    <th className="px-3 py-3 font-semibold">Plan minimo</th>
                    <th className="px-3 py-3 font-semibold">Tamano</th>
                    <th className="px-3 py-3 font-semibold">Subido</th>
                    <th className="px-3 py-3 text-center font-semibold">Abrir</th>
                  </tr>
                </thead>
                <tbody>
                  {resources.map((resource) => (
                    <tr key={resource.id} className="border-b border-subtle last:border-b-0">
                      <td className="px-3 py-4">
                        <div className="flex items-start gap-3">
                          <TbFileText className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
                          <div>
                            <p className="font-semibold">{resource.title}</p>
                            <p className="text-muted mt-1 text-xs">{resource.fileName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4 capitalize">{resource.minimumPlanCode}</td>
                      <td className="px-3 py-4">{formatFileSize(resource.fileSizeBytes)}</td>
                      <td className="px-3 py-4">{formatDate(resource.createdAt)}</td>
                      <td className="px-3 py-4 text-center">
                        <Link
                          href={`/api/nutrition/resources/${resource.id}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="admin-form-link inline-flex h-10 w-10 items-center justify-center rounded-full border"
                          aria-label={`Abrir ${resource.title}`}
                          title={`Abrir ${resource.title}`}
                        >
                          <TbExternalLink className="h-5 w-5" aria-hidden="true" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <section className="panel p-5">
              <p className="text-muted text-sm">Todavia no hay PDFs de alimentacion subidos para este usuario.</p>
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
