"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "./client";
import { upsertProfile } from "./profile";
import { writeAudit } from "./audit";

export async function createTender(input: {
  reference: string;
  deadline_at: string;
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

  const { data: tender, error } = await supabase
    .from("tenders")
    .insert({
      reference: input.reference,
      deadline_at: input.deadline_at,
      status: input.status,
      owner_profile_id: profile.id,
    })
    .select("id")
    .single();

  if (error || !tender) {
    throw new Error(error?.message ?? "Failed to create tender");
  }

  await writeAudit("create", "tender", tender.id, { reference: input.reference });
  revalidatePath("/tenders");
}
