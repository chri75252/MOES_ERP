"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "./client";
import { upsertProfile } from "./profile";
import { writeAudit } from "./audit";

export async function createProject(input: {
  code: string;
  name: string;
  status: string;
}) {
  await upsertProfile();
  const supabase = createServerSupabaseClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .single();

  if (!profile) {
    throw new Error("Profile not found");
  }

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      code: input.code,
      name: input.name,
      status: input.status,
      pm_profile_id: profile.id,
    })
    .select("id")
    .single();

  if (error || !project) {
    throw new Error(error?.message ?? "Failed to create project");
  }

  await writeAudit("create", "project", project.id, { code: input.code });
  revalidatePath("/projects");
}
