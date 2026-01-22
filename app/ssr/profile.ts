"use server";

import { currentUser } from "@clerk/nextjs/server";
import { createServiceSupabaseClient } from "./client";

export async function upsertProfile() {
  const user = await currentUser();
  if (!user) {
    throw new Error("Not authenticated");
  }

  const email = user.emailAddresses[0]?.emailAddress ?? null;
  const displayName = user.fullName ?? user.username ?? user.id;

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase.from("profiles").upsert(
    {
      clerk_user_id: user.id,
      email,
      display_name: displayName,
    },
    { onConflict: "clerk_user_id" }
  ).select('id').single();

  if (error) {
    throw new Error(error.message);
  }

  return { clerkUserId: user.id, profileId: data.id };
}
