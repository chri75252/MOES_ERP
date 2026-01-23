"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { prepareDocumentUpload, createSignedDownload } from "../ssr/documents";

export default function DocumentsPage() {
  const searchParams = useSearchParams();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [projectId, setProjectId] = useState("");
  const [tenderId, setTenderId] = useState("");
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Auto-fill project ID from URL if provided
  useEffect(() => {
    const projectFromUrl = searchParams.get("project");
    if (projectFromUrl) {
      setProjectId(projectFromUrl);
    }
  }, [searchParams]);

  async function handleUpload() {
    if (!selectedFile) return;

    setUploadStatus("uploading");
    setStatusMessage(null);

    try {
      const { signedUrl } = await prepareDocumentUpload({
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        fileSize: selectedFile.size,
        projectId: projectId || undefined,
        tenderId: tenderId || undefined,
        title: selectedFile.name,
      });

      const response = await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": selectedFile.type },
        body: selectedFile,
      });

      if (!response.ok) {
        setUploadStatus("error");
        setStatusMessage("Upload failed. Please try again.");
        return;
      }

      setUploadStatus("success");
      setStatusMessage("Document uploaded successfully!");
      setSelectedFile(null);
    } catch (err) {
      setUploadStatus("error");
      setStatusMessage("An error occurred during upload.");
    }
  }

  async function handleDownload() {
    if (!projectId) return;
    const { signedUrl } = await createSignedDownload(projectId);
    window.open(signedUrl, "_blank");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Documents</h1>
          <p className="mt-1 text-sm text-slate-500">Upload and manage project documents</p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
          onClick={handleDownload}
          disabled={!projectId}
          type="button"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Create Signed URL
        </button>
      </div>

      {/* Success/Error Messages */}
      {statusMessage && (
        <div className={`rounded-lg p-4 ${uploadStatus === "success" ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
          <div className="flex items-center gap-3">
            {uploadStatus === "success" ? (
              <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className={`text-sm font-medium ${uploadStatus === "success" ? "text-emerald-800" : "text-red-800"}`}>
              {statusMessage}
            </span>
          </div>
        </div>
      )}

      {/* Upload Form */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Upload Document</h2>
        <p className="mt-1 text-sm text-slate-500">Select a file and specify the project or tender</p>

        <div className="mt-6 grid gap-5">
          {/* Project ID Input */}
          <div>
            <label htmlFor="projectId" className="block text-sm font-medium text-slate-700 mb-1.5">
              Project ID
            </label>
            <input
              id="projectId"
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 transition-colors"
              placeholder="Enter project UUID"
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
            />
          </div>

          {/* Tender ID Input */}
          <div>
            <label htmlFor="tenderId" className="block text-sm font-medium text-slate-700 mb-1.5">
              Tender ID <span className="text-slate-400">(optional)</span>
            </label>
            <input
              id="tenderId"
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 transition-colors"
              placeholder="Enter tender UUID (optional)"
              value={tenderId}
              onChange={(event) => setTenderId(event.target.value)}
            />
          </div>

          {/* File Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Document File
            </label>
            <div className="relative">
              <input
                className="block w-full text-sm text-slate-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer cursor-pointer border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                type="file"
                onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
              />
            </div>
            {selectedFile && (
              <p className="mt-2 text-sm text-slate-500">
                Selected: <span className="font-medium text-slate-700">{selectedFile.name}</span> ({(selectedFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>
        </div>

        {/* Upload Button */}
        <button
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleUpload}
          disabled={!selectedFile || uploadStatus === "uploading"}
          type="button"
        >
          {uploadStatus === "uploading" ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload Document
            </>
          )}
        </button>
      </div>
    </div>
  );
}
