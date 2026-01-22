"use server";

import { createServiceSupabaseClient } from "./client";
import { upsertProfile } from "./profile";

export async function writeAudit(
  action: string,
  entityType: string,
  entityId: string | null,
  metadata: Record<string, unknown> = {}
) {
  const { profileId } = await upsertProfile();
  const supabase = createServiceSupabaseClient();

  const profile = { id: profileId };

  const { error } = await supabase.from("audit_log").insert({
    actor_profile_id: profile.id,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata,
  });

  if (error) {
    throw new Error(error.message);
  }
}
