import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "../../ssr/client";

function daysUntil(date: Date) {
  const diff = date.getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default async function TenderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createServerSupabaseClient();
  const { data: tender } = await supabase
    .from("tenders")
    .select(
      "id, reference, title, deadline_at, status, value_amount, value_currency, next_followup_at, owner:profiles(display_name)"
    )
    .eq("id", id)
    .single();

  if (!tender) {
    notFound();
  }

  const [{ data: comms }, { data: documents }] = await Promise.all([
    supabase
      .from("tender_comms_events")
      .select("id, occurred_at, channel, outcome, notes, actor:profiles(display_name)")
      .eq("tender_id", id)
      .order("occurred_at", { ascending: false }),
    supabase
      .from("documents")
      .select("id, title, doc_type, sensitivity, created_at")
      .eq("tender_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const deadlineText = tender.deadline_at
    ? `T-${daysUntil(new Date(tender.deadline_at))}`
    : "";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{tender.reference}</h1>
          <p className="text-sm text-slate-600">{tender.title ?? ""}</p>
        </div>
        <div className="flex gap-2">
          <Link className="rounded border px-3 py-1.5 text-sm" href="/documents">
            Upload Document
          </Link>
          <Link className="rounded border px-3 py-1.5 text-sm" href="/tenders">
            Back to Tenders
          </Link>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4">
        <div className="text-sm font-semibold">Deadline in {deadlineText}</div>
        <div className="mt-2 text-sm text-slate-600">
          {tender.deadline_at ? new Date(tender.deadline_at).toLocaleString() : ""}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm font-semibold">Tender Summary</div>
          <div className="mt-3 grid gap-2 text-sm text-slate-600">
            <div>Owner: -</div>
            <div>Status: {tender.status}</div>
            <div>Value: {tender.value_amount ?? "-"} {tender.value_currency ?? ""}</div>
            <div>Next follow-up: {tender.next_followup_at ?? "-"}</div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm font-semibold">Due Soon Checklist (Day-1)</div>
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            <div>Draft clarifications</div>
            <div>Confirm submission format</div>
            <div>Review prior proposal</div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm font-semibold">Communications</div>
          <div className="mt-3 space-y-2 text-sm">
            {(comms ?? []).map((event) => (
              <div key={event.id} className="rounded border p-2">
                <div className="text-xs text-slate-500">
                  {event.channel} · {event.occurred_at}
                </div>
                <div className="text-sm">{event.notes ?? event.outcome}</div>
              </div>
            ))}
            {comms?.length === 0 && (
              <div className="text-sm text-slate-500">No communications logged.</div>
            )}
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm font-semibold">Documents</div>
          <div className="mt-3 space-y-2 text-sm">
            {(documents ?? []).map((doc) => (
              <div key={doc.id} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{doc.title ?? "Untitled"}</div>
                  <div className="text-xs text-slate-500">{doc.doc_type ?? "-"}</div>
                </div>
                <span className="text-xs text-slate-500">{doc.sensitivity}</span>
              </div>
            ))}
            {documents?.length === 0 && (
              <div className="text-sm text-slate-500">No documents yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
