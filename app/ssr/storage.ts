"use server";

import { createServerSupabaseClient } from "./client";
import { upsertProfile } from "./profile";

export async function createSignedUpload(filename: string) {
  await upsertProfile();
  const supabase = createServerSupabaseClient();

  const path = `uploads/${Date.now()}-${filename}`;
  const { data, error } = await supabase.storage
    .from("mce-documents")
    .createSignedUploadUrl(path);

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to create signed upload URL");
  }

  return { signedUrl: data.signedUrl, path };
}

export async function createSignedDownload(path: string) {
  await upsertProfile();
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.storage
    .from("mce-documents")
    .createSignedUrl(path, 60);

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to create signed URL");
  }

  return { signedUrl: data.signedUrl };
}
