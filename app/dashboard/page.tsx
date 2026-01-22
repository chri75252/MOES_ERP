import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { upsertProfile } from "../ssr/profile";
import { createServerSupabaseClient } from "../ssr/client";

function daysUntil(date: Date) {
  const diff = date.getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getUrgencyBadge(days: number) {
  if (days <= 0) return "bg-red-100 text-red-700 border-red-200";
  if (days <= 1) return "bg-orange-100 text-orange-700 border-orange-200";
  if (days <= 3) return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-slate-100 text-slate-600 border-slate-200";
}

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) {
    return null;
  }

  await upsertProfile();
  const supabase = createServerSupabaseClient();

  const [{ data: tenders }, { data: milestones }, { data: notifications }] =
    await Promise.all([
      supabase.from("tenders").select("id, reference, deadline_at, status, next_followup_at"),
      supabase
        .from("project_milestones")
        .select("id, title, due_date, status, project:projects(code, name)"),
      supabase
        .from("notifications")
        .select("id, severity, ack_required, acked_at")
        .eq("severity", "critical"),
    ]);

  const tendersDue = {
    today: 0,
    d1: 0,
    d3: 0,
    d7: 0,
    d14: 0,
  };

  (tenders ?? []).forEach((tender) => {
    if (!tender.deadline_at) return;
    const days = daysUntil(new Date(tender.deadline_at));
    if (days <= 0) tendersDue.today += 1;
    if (days <= 1) tendersDue.d1 += 1;
    if (days <= 3) tendersDue.d3 += 1;
    if (days <= 7) tendersDue.d7 += 1;
    if (days <= 14) tendersDue.d14 += 1;
  });

  const upcomingMilestones = (milestones ?? [])
    .filter((item) => item.due_date)
    .sort((a, b) =>
      new Date(a.due_date as string).getTime() -
      new Date(b.due_date as string).getTime()
    )
    .slice(0, 10);

  const criticalUnacked = (notifications ?? []).filter(
    (note) => note.ack_required && !note.acked_at
  ).length;

  return (
    <div className="space-y-8">
      {/* Critical Alert Banner */}
      {criticalUnacked > 0 && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-red-800">{criticalUnacked} Critical Notification{criticalUnacked > 1 ? 's' : ''} Pending</div>
              <div className="text-sm text-red-600">Requires immediate attention</div>
            </div>
          </div>
          <Link
            href="/notifications"
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 transition-colors"
          >
            View Now
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Overview of your operational status</p>
        </div>
        <div className="flex gap-3">
          <Link
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            href="/projects/new"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Project
          </Link>
          <Link
            className="inline-flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
            href="/tenders/new"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Tender
          </Link>
          <Link
            className="inline-flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
            href="/documents"
          >
            Upload Document
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <div className="rounded-xl border bg-blue-50 border-blue-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-xs uppercase tracking-wider text-blue-600 font-semibold">Tenders due 14d</div>
          <div className="mt-2 text-3xl font-bold text-blue-900">{tendersDue.d14}</div>
        </div>
        <div className="rounded-xl border bg-emerald-50 border-emerald-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-xs uppercase tracking-wider text-emerald-600 font-semibold">Due 7d</div>
          <div className="mt-2 text-3xl font-bold text-emerald-900">{tendersDue.d7}</div>
        </div>
        <div className="rounded-xl border bg-amber-50 border-amber-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-xs uppercase tracking-wider text-amber-600 font-semibold">Due 3d</div>
          <div className="mt-2 text-3xl font-bold text-amber-900">{tendersDue.d3}</div>
        </div>
        <div className="rounded-xl border bg-orange-50 border-orange-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-xs uppercase tracking-wider text-orange-600 font-semibold">Due 1d</div>
          <div className="mt-2 text-3xl font-bold text-orange-900">{tendersDue.d1}</div>
        </div>
        <div className="rounded-xl border bg-red-50 border-red-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-xs uppercase tracking-wider text-red-600 font-semibold">Due Today</div>
          <div className="mt-2 text-3xl font-bold text-red-900">{tendersDue.today}</div>
        </div>
      </div>

      {/* Data Lists */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Tenders Due Soon</h2>
            <Link href="/tenders" className="text-sm text-blue-600 hover:text-blue-700 font-medium">View all →</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {(tenders ?? []).slice(0, 8).map((tender) => {
              const days = tender.deadline_at ? daysUntil(new Date(tender.deadline_at)) : null;
              return (
                <div key={tender.id} className="flex items-center justify-between py-3 hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors">
                  <div>
                    <div className="font-medium text-slate-900">{tender.reference}</div>
                    <div className="text-xs text-slate-500">
                      {tender.deadline_at ? new Date(tender.deadline_at).toLocaleDateString() : "No deadline"}
                    </div>
                  </div>
                  {days !== null && (
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${getUrgencyBadge(days)}`}>
                      T-{days}d
                    </span>
                  )}
                </div>
              );
            })}
            {(tenders ?? []).length === 0 && (
              <div className="py-8 text-center text-sm text-slate-500">No tenders yet</div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Upcoming Milestones</h2>
            <Link href="/projects" className="text-sm text-blue-600 hover:text-blue-700 font-medium">View all →</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {upcomingMilestones.map((milestone) => {
              const days = milestone.due_date ? daysUntil(new Date(milestone.due_date as string)) : null;
              return (
                <div key={milestone.id} className="flex items-center justify-between py-3 hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors">
                  <div>
                    <div className="font-medium text-slate-900">{milestone.title}</div>
                    <div className="text-xs text-slate-500">
                      {milestone.due_date ? new Date(milestone.due_date as string).toLocaleDateString() : ""}
                    </div>
                  </div>
                  {days !== null && (
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${getUrgencyBadge(days)}`}>
                      T-{days}d
                    </span>
                  )}
                </div>
              );
            })}
            {upcomingMilestones.length === 0 && (
              <div className="py-8 text-center text-sm text-slate-500">No milestones due yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
