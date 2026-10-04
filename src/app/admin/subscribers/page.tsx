import Link from "next/link";
import { redirect } from "next/navigation";
import { TbClipboardText } from "react-icons/tb";

import { AdminSubscribersFilters } from "@/features/admin/components/AdminSubscribersFilters";
import { AdminSubscriptionHistoryMenu } from "@/features/admin/components/AdminSubscriptionHistoryMenu";
import { LandingHeader } from "@/features/landing/components/LandingHeader";
import { getLandingContent } from "@/features/landing/i18n/messages";
import { getCurrentAuthenticatedUser } from "@/lib/server/supabase-auth";
import { isUserAdmin, listSubscribers } from "@/lib/server/supabase-admin";

type PageProps = {
  searchParams: Promise<{
    status?: string;
    plan?: string;
    onboarding?: string;
    routines?: string;
    q?: string;
  }>;
};

function normalizeStatus(value: string | undefined) {
  if (value === "active" || value === "pending" || value === "canceled") {
    return value;
  }
  return "all";
}

function normalizePlan(value: string | undefined) {
  if (value === "basic" || value === "intermediate" || value === "premium") {
    return value;
  }
  return "all";
}

function normalizePresenceFilter(value: string | undefined) {
  if (value === "with") {
    return value;
  }
  return "all";
}

export default async function AdminSubscribersPage({ searchParams }: PageProps) {
  const content = getLandingContent("es");
  const user = await getCurrentAuthenticatedUser();
  if (!user?.id) {
    redirect("/");
  }

  const admin = await isUserAdmin(user.id);
  if (!admin) {
    redirect("/");
  }

  const params = await searchParams;
  const status = normalizeStatus(params.status);
  const plan = normalizePlan(params.plan);
  const onboarding = normalizePresenceFilter(params.onboarding);
  const routines = normalizePresenceFilter(params.routines);
  const q = params.q?.trim() ?? "";

  const subscribers = await listSubscribers({ status, plan, onboarding, routines, q });

  return (
    <div className="bg-canvas text-primary min-h-screen">
      <LandingHeader content={content} showSectionLinks={false} />
      <main className="px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold sm:text-3xl">Subscribers</h1>
            <Link href="/" className="btn-secondary inline-block">
              Back to landing
            </Link>
          </div>

          <AdminSubscribersFilters status={status} plan={plan} onboarding={onboarding} routines={routines} q={q} />

          <div className="panel overflow-x-auto">
            <table className="w-full min-w-[1040px] text-left text-sm">
              <thead className="text-muted border-subtle border-b">
                <tr>
                  <th className="px-3 py-3 font-medium">User</th>
                  <th className="px-3 py-3 font-medium">Email</th>
                  <th className="px-3 py-3 font-medium">Plan</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Created</th>
                  <th className="px-3 py-3 font-medium">Canceled</th>
                  <th className="px-3 py-3 font-medium">Historial</th>
                  <th className="px-3 py-3 text-center font-medium">Rutinas</th>
                  <th className="px-3 py-3 text-center font-medium">Alimentacion</th>
                  <th className="px-3 py-3 text-center font-medium">Formulario</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((row) => (
                  <tr key={row.id} className="border-subtle border-b last:border-b-0">
                    <td className="px-3 py-3">{row.fullName ?? row.userId}</td>
                    <td className="px-3 py-3">{row.email ?? "-"}</td>
                    <td className="px-3 py-3 capitalize">{row.planCode}</td>
                    <td className="px-3 py-3 capitalize">{row.status}</td>
                    <td className="px-3 py-3">{new Date(row.createdAt).toLocaleString()}</td>
                    <td className="px-3 py-3">{row.canceledAt ? new Date(row.canceledAt).toLocaleString() : "-"}</td>
                    <td className="px-3 py-3">
                      <AdminSubscriptionHistoryMenu history={row.subscriptionHistory} />
                    </td>
                    <td className="px-3 py-3 text-center">
                      {row.routineCount > 0 ? (
                        <Link
                          href={`/admin/subscribers/${row.userId}/routines`}
                          className="admin-routine-count-link inline-flex h-9 min-w-9 items-center justify-center rounded-full px-3 font-semibold"
                          aria-label={`Ver ${row.routineCount} rutinas de ${row.fullName ?? row.userId}`}
                          title={`Ver rutinas de ${row.fullName ?? row.userId}`}
                        >
                          {row.routineCount}
                        </Link>
                      ) : (
                        <span className="text-muted cursor-not-allowed opacity-60" aria-label="Sin rutinas" title="Sin rutinas">
                          0
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {row.nutritionCount > 0 ? (
                        <Link
                          href={`/admin/subscribers/${row.userId}/nutrition`}
                          className="admin-routine-count-link inline-flex h-9 min-w-9 items-center justify-center rounded-full px-3 font-semibold"
                          aria-label={`Ver ${row.nutritionCount} PDFs de alimentacion de ${row.fullName ?? row.userId}`}
                          title={`Ver alimentacion de ${row.fullName ?? row.userId}`}
                        >
                          {row.nutritionCount}
                        </Link>
                      ) : (
                        <span className="text-muted cursor-not-allowed opacity-60" aria-label="Sin PDFs de alimentacion" title="Sin PDFs de alimentacion">
                          0
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {row.hasOnboarding ? (
                        <Link
                          href={`/admin/subscribers/${row.userId}/onboarding`}
                          className="admin-form-link inline-flex h-10 w-10 items-center justify-center rounded-full border"
                          aria-label={`Ver formulario de ${row.fullName ?? row.userId}`}
                          title={`Ver formulario de ${row.fullName ?? row.userId}`}
                        >
                          <TbClipboardText className="h-5 w-5" aria-hidden="true" />
                        </Link>
                      ) : (
                        <span
                          className="bg-surface border-subtle text-muted inline-flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-full border opacity-60"
                          aria-label="Formulario no enviado"
                          title="Formulario no enviado"
                        >
                          <TbClipboardText className="h-5 w-5" aria-hidden="true" />
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {!subscribers.length ? (
                  <tr>
                    <td className="text-muted px-3 py-6" colSpan={10}>
                      No subscribers found with these filters.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
