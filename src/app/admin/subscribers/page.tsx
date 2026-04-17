import Link from "next/link";
import { redirect } from "next/navigation";

import { LandingHeader } from "@/features/landing/components/LandingHeader";
import { getLandingContent } from "@/features/landing/i18n/messages";
import { getCurrentAuthenticatedUser } from "@/lib/server/supabase-auth";
import { isUserAdmin, listSubscribers } from "@/lib/server/supabase-admin";

type PageProps = {
  searchParams: Promise<{
    status?: string;
    plan?: string;
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

export default async function AdminSubscribersPage({ searchParams }: PageProps) {
  const content = getLandingContent("es");
  const user = await getCurrentAuthenticatedUser();
  if (!user?.id) {
    redirect("/?auth=1");
  }

  const admin = await isUserAdmin(user.id);
  if (!admin) {
    redirect("/");
  }

  const params = await searchParams;
  const status = normalizeStatus(params.status);
  const plan = normalizePlan(params.plan);
  const q = params.q?.trim() ?? "";

  const subscribers = await listSubscribers({ status, plan, q });

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

          <form method="GET" className="panel mb-5 grid gap-3 p-4 sm:grid-cols-4">
            <label className="block text-sm">
              <span className="text-muted mb-1 block text-xs">Status</span>
              <select name="status" defaultValue={status} className="bg-canvas border-subtle w-full rounded-lg border px-3 py-2">
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="canceled">Canceled</option>
              </select>
            </label>

            <label className="block text-sm">
              <span className="text-muted mb-1 block text-xs">Plan</span>
              <select name="plan" defaultValue={plan} className="bg-canvas border-subtle w-full rounded-lg border px-3 py-2">
                <option value="all">All</option>
                <option value="basic">Basic</option>
                <option value="intermediate">Intermediate</option>
                <option value="premium">Premium</option>
              </select>
            </label>

            <label className="block text-sm sm:col-span-2">
              <span className="text-muted mb-1 block text-xs">Search (name/email/user id)</span>
              <input
                type="text"
                name="q"
                defaultValue={q}
                className="bg-canvas border-subtle w-full rounded-lg border px-3 py-2"
                placeholder="Search..."
              />
            </label>

            <div className="sm:col-span-4">
              <button type="submit" className="btn-primary inline-block">
                Apply filters
              </button>
            </div>
          </form>

          <div className="panel overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-muted border-subtle border-b">
                <tr>
                  <th className="px-3 py-3 font-medium">User</th>
                  <th className="px-3 py-3 font-medium">Email</th>
                  <th className="px-3 py-3 font-medium">Plan</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Created</th>
                  <th className="px-3 py-3 font-medium">Canceled</th>
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
                  </tr>
                ))}
                {!subscribers.length ? (
                  <tr>
                    <td className="text-muted px-3 py-6" colSpan={6}>
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
