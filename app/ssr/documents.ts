"use server";

import { createServiceSupabaseClient } from "./client";
import { upsertProfile } from "./profile";
import { writeAudit } from "./audit";

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

// Validate UUID format - returns null if invalid
function validateUuid(value: string | undefined): string | null {
  if (!value || value.trim() === '') return null;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value.trim()) ? value.trim() : null;
}

export async function prepareDocumentUpload(input: {
  fileName: string;
  fileType: string;
  fileSize: number;
  projectId?: string;
  tenderId?: string;
  docType?: string;
  sensitivity?: "confidential" | "restricted";
  title?: string;
}) {
  const { profileId } = await upsertProfile();
  const supabase = createServiceSupabaseClient();

  const profile = { id: profileId };

  // Validate and sanitize UUIDs
  const projectId = validateUuid(input.projectId);
  const tenderId = validateUuid(input.tenderId);

  if (!projectId && !tenderId) {
    throw new Error("Valid project or tender UUID is required");
  }

  const safeName = sanitizeFileName(input.fileName);
  const prefix = projectId
    ? `projects/${projectId}`
    : `tenders/${tenderId}`;
  const storagePath = `${prefix}/${Date.now()}-${safeName}`;

  const { data: document, error: documentError } = await supabase
    .from("documents")
    .insert({
      doc_type: input.docType,
      sensitivity: input.sensitivity ?? "confidential",
      project_id: projectId,
      tender_id: tenderId,
      title: input.title ?? input.fileName,
      storage_bucket: "mce-documents",
      storage_path: storagePath,
      mime_type: input.fileType,
      size_bytes: input.fileSize,
      uploaded_by_profile_id: profile.id,
    })
    .select("id")
    .single();

  if (documentError || !document) {
    throw new Error(documentError?.message ?? "Failed to create document record");
  }

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("mce-documents")
    .createSignedUploadUrl(storagePath);

  if (uploadError || !uploadData) {
    throw new Error(uploadError?.message ?? "Unable to create signed upload URL");
  }

  const jobType = input.tenderId ? "tender_pack" : "document_ingest";
  const { error: jobError } = await supabase.from("extraction_jobs").insert({
    document_id: document.id,
    job_type: jobType,
  });

  if (jobError) {
    throw new Error(jobError.message);
  }

  await writeAudit("upload", "document", document.id, {
    path: storagePath,
    projectId: input.projectId ?? null,
    tenderId: input.tenderId ?? null,
  });

  return {
    documentId: document.id,
    signedUrl: uploadData.signedUrl,
    path: storagePath,
  };
}

export async function createSignedDownload(referenceId: string) {
  await upsertProfile();
  const supabase = createServiceSupabaseClient();

  const { data: document, error } = await supabase
    .from("documents")
    .select("storage_path")
    .or(`id.eq.${referenceId},project_id.eq.${referenceId},tender_id.eq.${referenceId}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !document) {
    throw new Error(error?.message ?? "Document not found");
  }

  const { data, error: urlError } = await supabase.storage
    .from("mce-documents")
    .createSignedUrl(document.storage_path, 60);

  if (urlError || !data) {
    throw new Error(urlError?.message ?? "Unable to create signed URL");
  }

  return { signedUrl: data.signedUrl };
}
