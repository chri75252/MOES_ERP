import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../ssr/client";

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("code, name, status, progress_pct")
    .order("created_at", { ascending: false });

  const rows = ["code,name,status,progress_pct", ...(projects ?? []).map((row) => {
    const code = row.code ?? "";
    const name = (row.name ?? "").replaceAll(",", " ");
    const status = row.status ?? "";
    const progress = row.progress_pct ?? 0;
    return `${code},${name},${status},${progress}`;
  })];

  return new NextResponse(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=projects.csv",
    },
  });
}
