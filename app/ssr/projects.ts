"use server";

import { revalidatePath } from "next/cache";
import { createServiceSupabaseClient } from "./client";
import { upsertProfile } from "./profile";
import { writeAudit } from "./audit";

export async function createProject(input: {
  code: string;
  name: string;
  status: string;
}) {
  const { profileId } = await upsertProfile();
  const supabase = createServiceSupabaseClient();

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      code: input.code,
      name: input.name,
      status: input.status,
      pm_profile_id: profileId,
    })
    .select("id")
    .single();

  if (error || !project) {
    throw new Error(error?.message ?? "Failed to create project");
  }

  await writeAudit("create", "project", project.id, { code: input.code });
  revalidatePath("/projects");
  return project;
}

export async function updateProject(
  projectId: string,
  input: {
    code?: string;
    name?: string;
    status?: string;
    progress_pct?: number;
    start_date?: string | null;
    end_date?: string | null;
    dlp_date?: string | null;
  }
) {
  await upsertProfile(); // Ensure user is authenticated
  const supabase = createServiceSupabaseClient();

  const { data: project, error } = await supabase
    .from("projects")
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId)
    .select("id, code")
    .single();

  if (error || !project) {
    throw new Error(error?.message ?? "Failed to update project");
  }

  await writeAudit("update", "project", project.id, input);
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  return project;
}

export async function deleteProject(projectId: string) {
  await upsertProfile(); // Ensure user is authenticated
  const supabase = createServiceSupabaseClient();

  // Get project info for audit log before deleting
  const { data: project } = await supabase
    .from("projects")
    .select("id, code, name")
    .eq("id", projectId)
    .single();

  if (!project) {
    throw new Error("Project not found");
  }

  // Get all documents for this project
  const { data: documents } = await supabase
    .from("documents")
    .select("id, storage_path, storage_bucket")
    .eq("project_id", projectId);

  // Delete document files from storage
  if (documents && documents.length > 0) {
    const storagePaths = documents.map(d => d.storage_path);
    await supabase.storage
      .from("mce-documents")
      .remove(storagePaths);

    // Delete document records
    await supabase
      .from("documents")
      .delete()
      .eq("project_id", projectId);
  }

  // Delete related tenders' documents (if any tenders are linked)
  const { data: tenders } = await supabase
    .from("tenders")
    .select("id")
    .eq("project_id", projectId);

  if (tenders && tenders.length > 0) {
    for (const tender of tenders) {
      const { data: tenderDocs } = await supabase
        .from("documents")
        .select("storage_path")
        .eq("tender_id", tender.id);

      if (tenderDocs && tenderDocs.length > 0) {
        await supabase.storage
          .from("mce-documents")
          .remove(tenderDocs.map(d => d.storage_path));

        await supabase
          .from("documents")
          .delete()
          .eq("tender_id", tender.id);
      }
    }
  }

  // Now delete the project (cascade will handle milestones, members, tenders, etc.)
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId);

  if (error) {
    throw new Error(error.message ?? "Failed to delete project");
  }

  await writeAudit("delete", "project", projectId, {
    code: project.code,
    name: project.name,
    documents_deleted: documents?.length ?? 0
  });

  revalidatePath("/projects");
  return { success: true };
}
