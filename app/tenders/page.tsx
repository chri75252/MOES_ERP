import Link from "next/link";
import { createServerSupabaseClient } from "../ssr/client";

function daysUntil(date: Date) {
  const diff = date.getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getStatusBadge(status: string) {
  switch (status) {
    case "new":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "in_review":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "submitted":
      return "bg-purple-100 text-purple-700 border-purple-200";
    case "awarded":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "lost":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

function getUrgencyBadge(days: number) {
  if (days < 0) return { class: "bg-red-100 text-red-700 border-red-200", label: "Overdue" };
  if (days === 0) return { class: "bg-red-100 text-red-700 border-red-200", label: "Today" };
  if (days <= 1) return { class: "bg-orange-100 text-orange-700 border-orange-200", label: `${days}d` };
  if (days <= 3) return { class: "bg-amber-100 text-amber-700 border-amber-200", label: `${days}d` };
  if (days <= 7) return { class: "bg-yellow-100 text-yellow-700 border-yellow-200", label: `${days}d` };
  return { class: "bg-slate-100 text-slate-600 border-slate-200", label: `${days}d` };
}

export default async function TendersPage() {
  const supabase = createServerSupabaseClient();
  const { data: tenders } = await supabase
    .from("tenders")
    .select("id, reference, deadline_at, status, owner:profiles(display_name)")
    .order("deadline_at", { ascending: true });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Tenders</h1>
          <p className="mt-1 text-sm text-slate-500">Track bids and submission deadlines</p>
        </div>
        <div className="flex gap-3">
          <Link
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            href="/tenders/new"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Tender
          </Link>
          <Link
            className="inline-flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
            href="/tenders/export"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Reference</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Deadline</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Countdown</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Owner</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(tenders ?? []).map((tender) => {
              const owner = tender.owner as { display_name: string } | null;
              const days = tender.deadline_at ? daysUntil(new Date(tender.deadline_at)) : null;
              const urgency = days !== null ? getUrgencyBadge(days) : null;

              return (
                <tr key={tender.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4">
                    <span className="font-semibold text-slate-900">{tender.reference}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-slate-600">
                      {tender.deadline_at ? new Date(tender.deadline_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      }) : "—"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {urgency && (
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${urgency.class}`}>
                        {urgency.label}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${getStatusBadge(tender.status)}`}>
                      {tender.status?.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-slate-600">{owner?.display_name ?? "—"}</span>
                  </td>
                  <td className="px-5 py-4">
                    <Link
                      className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                      href={`/tenders/${tender.id}`}
                    >
                      Open
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </td>
                </tr>
              );
            })}
            {tenders?.length === 0 && (
              <tr>
                <td className="px-5 py-12 text-center text-sm text-slate-500" colSpan={6}>
                  <div className="flex flex-col items-center gap-2">
                    <svg className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>No tenders yet</span>
                    <Link href="/tenders/new" className="text-blue-600 hover:text-blue-700 font-medium">Create your first tender →</Link>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
