import { notFound } from "next/navigation";
import { createServiceSupabaseClient } from "../../../ssr/client";
import ProjectEditForm from "./form";

export const dynamic = 'force-dynamic';

export default async function ProjectEditPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = createServiceSupabaseClient();

    const { data: project, error } = await supabase
        .from("projects")
        .select("id, code, name, status, progress_pct, start_date, end_date, dlp_date")
        .eq("id", id)
        .single();

    if (!project || error) {
        notFound();
    }

    return <ProjectEditForm project={project} />;
}
