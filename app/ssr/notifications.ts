"use server";

import { createServerSupabaseClient } from "./client";
import { upsertProfile } from "./profile";
import { writeAudit } from "./audit";

export async function acknowledgeNotification(notificationId: string) {
  const { profileId } = await upsertProfile();
  const supabase = createServerSupabaseClient();

  const profile = { id: profileId };

  const { error } = await supabase
    .from("notifications")
    .update({
      acked_at: new Date().toISOString(),
      acked_by_profile_id: profile.id,
    })
    .eq("id", notificationId);

  if (error) {
    throw new Error(error.message);
  }

  await writeAudit("ack", "notification", notificationId, {});
}
