import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white p-6">
        <h1 className="text-2xl font-semibold">MCE Command Center</h1>
        <p className="mt-2 text-sm text-slate-600">
          Day-1 deliverable scaffold. Continue to the dashboard once you are signed in.
        </p>
        <div className="mt-4 flex gap-3">
          <Link
            className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            href="/dashboard"
          >
            Go to Dashboard
          </Link>
          <Link
            className="rounded border px-4 py-2 text-sm font-medium"
            href="/projects"
          >
            View Projects
          </Link>
        </div>
      </div>
    </div>
  );
}
