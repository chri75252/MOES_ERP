"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateProject, deleteProject } from "../../../ssr/projects";

interface ProjectEditFormProps {
    project: {
        id: string;
        code: string;
        name: string;
        status: string;
        progress_pct: number | null;
        start_date: string | null;
        end_date: string | null;
        dlp_date: string | null;
    };
}

export default function ProjectEditForm({ project }: ProjectEditFormProps) {
    const router = useRouter();
    const [formData, setFormData] = useState({
        code: project.code,
        name: project.name,
        status: project.status,
        progress_pct: project.progress_pct ?? 0,
        start_date: project.start_date ?? "",
        end_date: project.end_date ?? "",
        dlp_date: project.dlp_date ?? "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            await updateProject(project.id, {
                code: formData.code,
                name: formData.name,
                status: formData.status,
                progress_pct: formData.progress_pct,
                start_date: formData.start_date || null,
                end_date: formData.end_date || null,
                dlp_date: formData.dlp_date || null,
            });
            router.push(`/projects/${project.id}`);
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update project");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleDelete() {
        setIsSubmitting(true);
        setError(null);

        try {
            await deleteProject(project.id);
            router.push("/projects");
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete project");
            setIsSubmitting(false);
        }
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-semibold">Edit Project</h1>
                <p className="text-sm text-slate-500">Update project details or delete the project</p>
            </div>

            {error && (
                <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="rounded-lg border bg-white p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Project Code
                        </label>
                        <input
                            type="text"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Project Name
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Status
                        </label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="active">Active</option>
                            <option value="on_hold">On Hold</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Progress (%)
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={formData.progress_pct}
                            onChange={(e) => setFormData({ ...formData, progress_pct: parseInt(e.target.value) || 0 })}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                End Date
                            </label>
                            <input
                                type="date"
                                value={formData.end_date}
                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                DLP Date
                            </label>
                            <input
                                type="date"
                                value={formData.dlp_date}
                                onChange={(e) => setFormData({ ...formData, dlp_date: e.target.value })}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isSubmitting ? "Saving..." : "Save Changes"}
                        </button>
                        <Link
                            href={`/projects/${project.id}`}
                            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Cancel
                        </Link>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                        Delete Project
                    </button>
                </div>
            </form>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
                        <h2 className="text-lg font-semibold text-slate-900 mb-2">
                            Delete Project?
                        </h2>
                        <p className="text-sm text-slate-600 mb-4">
                            Are you sure you want to delete <strong>{project.code}</strong>?
                            This will also delete all related milestones, documents, and other data.
                            This action cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isSubmitting}
                                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                            >
                                {isSubmitting ? "Deleting..." : "Yes, Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
