"use client";

import { useState } from "react";
import { createProject } from "../../ssr/projects";

export default function NewProjectPage() {
  const [formState, setFormState] = useState({
    code: "",
    name: "",
    status: "active",
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await createProject(formState);
  }

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold">Create Project</h1>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <div>
          <label className="text-sm font-medium">Project Code</label>
          <input
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
            value={formState.code}
            onChange={(event) =>
              setFormState({ ...formState, code: event.target.value })
            }
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">Project Name</label>
          <input
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
            value={formState.name}
            onChange={(event) =>
              setFormState({ ...formState, name: event.target.value })
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
            <option value="active">Active</option>
            <option value="on_hold">On hold</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <button
          className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          type="submit"
        >
          Save Project
        </button>
      </form>
    </div>
  );
}
