"use client";

import { useState } from "react";
import { createTender } from "../../ssr/tenders";

export default function NewTenderPage() {
  const [formState, setFormState] = useState({
    reference: "",
    deadline_at: "",
    status: "new",
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await createTender(formState);
  }

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold">Create Tender</h1>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <div>
          <label className="text-sm font-medium">Reference</label>
          <input
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
            value={formState.reference}
            onChange={(event) =>
              setFormState({ ...formState, reference: event.target.value })
            }
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">Deadline</label>
          <input
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
            type="datetime-local"
            value={formState.deadline_at}
            onChange={(event) =>
              setFormState({ ...formState, deadline_at: event.target.value })
            }
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">Status</label>
          <select
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
            value={formState.status}
            onChange={(event) =>
              setFormState({ ...formState, status: event.target.value })
            }
          >
            <option value="new">New</option>
            <option value="in_review">In review</option>
            <option value="submitted">Submitted</option>
            <option value="awarded">Awarded</option>
            <option value="lost">Lost</option>
          </select>
        </div>
        <button
          className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          type="submit"
        >
          Save Tender
        </button>
      </form>
    </div>
  );
}
