import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceSupabaseClient } from "../../ssr/client";

export const dynamic = 'force-dynamic';

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createServiceSupabaseClient();

  console.log('[ProjectDetailPage] Loading project:', id);

  const { data: project, error } = await supabase
    .from("projects")
    .select(
      "id, code, name, status, progress_pct, start_date, end_date, dlp_date, tags, pm:profiles!pm_profile_id(display_name), client:clients(name)"
    )
    .eq("id", id)
    .single();

  console.log('[ProjectDetailPage] project:', project, 'error:', error);

  if (!project) {
    console.log('[ProjectDetailPage] Project not found, calling notFound()');
    notFound();
  }

  const [{ data: milestones }, { data: documents }, { data: tenders }] =
    await Promise.all([
      supabase
        .from("project_milestones")
        .select("id, title, due_date, status")
        .eq("project_id", id)
        .order("due_date", { ascending: true }),
      supabase
        .from("documents")
        .select("id, title, doc_type, sensitivity, created_at")
        .eq("project_id", id)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("tenders")
        .select("id, reference, deadline_at, status")
        .eq("project_id", id)
        .order("deadline_at", { ascending: true }),
    ]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase text-slate-500">Project Code</div>
          <h1 className="text-2xl font-semibold">{project.code}</h1>
          <p className="text-sm text-slate-600">{project.name}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-slate-400">UUID:</span>
            <code className="rounded bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-600 select-all">
              {project.id}
            </code>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            className="rounded border border-blue-600 bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
            href={`/projects/${project.id}/edit`}
          >
            Edit Project
          </Link>
          <Link className="rounded border px-3 py-1.5 text-sm" href={`/documents?project=${project.id}`}>
            Upload Document
          </Link>
          <Link className="rounded border px-3 py-1.5 text-sm" href="/projects">
            Back to Projects
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border bg-white p-4 lg:col-span-2">
          <div className="text-sm font-semibold">Project Summary</div>
          <div className="mt-3 grid gap-2 text-sm text-slate-600">
            <div>Client: -</div>
            <div>PM: -</div>
            <div>Status: {project.status}</div>
            <div>Progress: {project.progress_pct ?? 0}%</div>
            <div>Start: {project.start_date ?? "-"}</div>
            <div>End: {project.end_date ?? "-"}</div>
            <div>DLP: {project.dlp_date ?? "-"}</div>
            <div>Tags: {(project.tags ?? []).join(", ")}</div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm font-semibold">Upcoming Milestones</div>
          <div className="mt-3 space-y-2 text-sm">
            {(milestones ?? []).slice(0, 5).map((milestone) => (
              <div key={milestone.id} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{milestone.title}</div>
                  <div className="text-xs text-slate-500">{milestone.due_date ?? ""}</div>
                </div>
                <span className="text-xs text-slate-500">{milestone.status}</span>
              </div>
            ))}
            {milestones?.length === 0 && (
              <div className="text-sm text-slate-500">No milestones yet.</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm font-semibold">Linked Tenders</div>
          <div className="mt-3 space-y-2 text-sm">
            {(tenders ?? []).map((tender) => (
              <div key={tender.id} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{tender.reference}</div>
                  <div className="text-xs text-slate-500">{tender.deadline_at ?? ""}</div>
                </div>
                <Link className="text-xs text-blue-600" href={`/tenders/${tender.id}`}>
                  Open
                </Link>
              </div>
            ))}
            {tenders?.length === 0 && (
              <div className="text-sm text-slate-500">No tenders linked.</div>
            )}
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm font-semibold">Recent Documents</div>
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
