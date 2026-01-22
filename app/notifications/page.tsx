import { acknowledgeNotification } from "../ssr/notifications";
import { createServerSupabaseClient } from "../ssr/client";

function getSeverityBadge(severity: string) {
  switch (severity) {
    case "critical":
      return "bg-red-100 text-red-700 border-red-200";
    case "warn":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "info":
      return "bg-blue-100 text-blue-700 border-blue-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

function getStatusBadge(acked: boolean) {
  if (acked) {
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  }
  return "bg-amber-100 text-amber-700 border-amber-200";
}

export default async function NotificationsPage() {
  const supabase = createServerSupabaseClient();
  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, message, severity, ack_required, acked_at, created_at")
    .order("created_at", { ascending: false });

  async function handleAck(formData: FormData) {
    "use server";
    const id = formData.get("id")?.toString();
    if (!id) {
      throw new Error("Missing notification id");
    }
    await acknowledgeNotification(id);
  }

  const pendingCount = (notifications ?? []).filter(n => n.ack_required && !n.acked_at).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Notifications</h1>
          <p className="mt-1 text-sm text-slate-500">
            {pendingCount > 0
              ? `You have ${pendingCount} notification${pendingCount > 1 ? 's' : ''} requiring acknowledgement`
              : "All notifications are acknowledged"
            }
          </p>
        </div>
      </div>

      {/* Pending Alert */}
      {pendingCount > 0 && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
            <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div>
            <div className="font-semibold text-amber-800">{pendingCount} Pending Acknowledgement{pendingCount > 1 ? 's' : ''}</div>
            <div className="text-sm text-amber-600">Please review and acknowledge these notifications</div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Message</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Severity</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Requires Ack</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(notifications ?? []).map((note) => (
              <tr key={note.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-4">
                  <span className="font-medium text-slate-900">{note.message}</span>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {note.created_at ? new Date(note.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    }) : ""}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${getSeverityBadge(note.severity)}`}>
                    {note.severity}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-slate-600">{note.ack_required ? "Yes" : "No"}</span>
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusBadge(!!note.acked_at)}`}>
                    {note.acked_at ? "Acknowledged" : "Pending"}
                  </span>
                </td>
                <td className="px-5 py-4">
                  {note.ack_required && !note.acked_at ? (
                    <form action={handleAck}>
                      <input type="hidden" name="id" value={note.id} />
                      <button
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        type="submit"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Acknowledge
                      </button>
                    </form>
                  ) : note.acked_at ? (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Done
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
              </tr>
            ))}
            {notifications?.length === 0 && (
              <tr>
                <td className="px-5 py-12 text-center text-sm text-slate-500" colSpan={5}>
                  <div className="flex flex-col items-center gap-2">
                    <svg className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <span>No notifications yet</span>
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
