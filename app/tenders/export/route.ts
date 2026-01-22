import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../ssr/client";

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: tenders } = await supabase
    .from("tenders")
    .select("reference, deadline_at, status")
    .order("deadline_at", { ascending: true });

  const rows = ["reference,deadline_at,status", ...(tenders ?? []).map((row) => {
    const reference = row.reference ?? "";
    const deadline = row.deadline_at ?? "";
    const status = row.status ?? "";
    return `${reference},${deadline},${status}`;
  })];

  return new NextResponse(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=tenders.csv",
    },
  });
}
