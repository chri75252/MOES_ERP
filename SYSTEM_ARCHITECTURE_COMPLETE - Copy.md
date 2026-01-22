# MCE Command Center — Complete System Architecture & Workflows

**Version:** 1.0  
**Last Updated:** January 20, 2026  
**Purpose:** Comprehensive technical documentation of the entire system architecture, data flows, security model, and operational workflows.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Technology Stack](#2-technology-stack)
3. [Architecture Layers](#3-architecture-layers)
4. [Authentication & Authorization Deep Dive](#4-authentication--authorization-deep-dive)
5. [Database Schema & Relationships](#5-database-schema--relationships)
6. [Row Level Security (RLS) Policy Matrix](#6-row-level-security-rls-policy-matrix)
7. [File Upload Workflow (Complete)](#7-file-upload-workflow-complete)
8. [User Workflows by Role](#8-user-workflows-by-role)
9. [Server Actions & API Patterns](#9-server-actions--api-patterns)
10. [Storage Architecture](#10-storage-architecture)
11. [Audit & Compliance System](#11-audit--compliance-system)
12. [Notification System](#12-notification-system)
13. [Deployment & Configuration](#13-deployment--configuration)
14. [Future Extension Points](#14-future-extension-points)

---

## 1. System Overview

### What is MCE Command Center?

An **internal enterprise resource planning (ERP) system** for managing:
- **Projects** (Engineering projects with milestones, teams, clients)
- **Tenders** (Bid tracking with deadlines, communications logs, and document packs)
- **Documents** (Secure file storage with version control and sensitivity classification)
- **Notifications** (In-app alerts with acknowledgement tracking)

### Core Design Principles

1. **Security First**: Row-Level Security (RLS) enforces permissions at the database layer. The application cannot bypass these rules.
2. **Clerk = Identity, Supabase = Authorization**: Clerk handles user authentication; Supabase enforces data access rules.
3. **Append-Only Audit**: All mutations are logged. Audit logs and communications cannot be modified or deleted.
4. **Signed URLs for Files**: Files are never exposed directly. Time-limited signed URLs control access.
5. **Future-Safe Schema**: The database includes tables (`extraction_jobs`, `version_group_id`) that support Phase 2 features (AI extraction, RAG, finance).

---

## 2. Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 15.2.4 (App Router) | React 19-based server/client component framework |
| **Authentication** | Clerk 6.12.12 | Identity provider, session management, JWT token generation |
| **Database** | Supabase (Postgres 15+) | Relational data storage with RLS |
| **Storage** | Supabase Storage | S3-compatible object storage with RLS policies |
| **Styling** | Tailwind CSS | Utility-first CSS framework |
| **Deployment** | Vercel | Serverless deployment for Next.js |
| **Language** | TypeScript 5+ | Type-safe JavaScript |

---

## 3. Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     USER (Browser)                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│               CLERK (Authentication)                         │
│  - Sign In/Sign Up UI                                       │
│  - JWT Token Generation (with template: 'supabase')         │
│  - Session Management                                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│            NEXT.JS (App Router)                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  middleware.ts (Route Protection)                   │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  app/*/page.tsx (Server Components)                 │   │
│  │  - Render UI                                         │   │
│  │  - Fetch data via Supabase client                   │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  app/ssr/*.ts (Server Actions)                      │   │
│  │  - createProject(), createTender(), etc.            │   │
│  │  - Database mutations + audit logging               │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  app/ssr/client.tsx (Supabase Client Factory)       │   │
│  │  - createServerSupabaseClient()                     │   │
│  │    → Uses Clerk JWT for RLS                         │   │
│  │  - createServiceSupabaseClient()                    │   │
│  │    → Bypasses RLS (profile bootstrap only)          │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│               SUPABASE (Backend)                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Postgres Database                                  │   │
│  │  - Tables: profiles, projects, tenders, etc.       │   │
│  │  - Row Level Security (RLS) Policies                │   │
│  │  - Helper Functions (can_view_project, etc.)       │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Storage (S3-Compatible)                            │   │
│  │  - Bucket: mce-documents (Private)                  │   │
│  │  - RLS Policies on storage.objects                  │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Auth (JWT Verification)                            │   │
│  │  - Validates Clerk JWT via JWKS URL                 │   │
│  │  - Exposes auth.jwt() for RLS functions             │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Authentication & Authorization Deep Dive

### The Identity Bridge (Clerk ↔ Supabase)

#### Step 1: User Signs In
1. User clicks "Sign In" in the app.
2. Redirected to Clerk's hosted sign-in page.
3. User enters credentials (email/password, SSO, etc.).
4. Clerk creates a **session** and stores it in an HTTP-only cookie.

#### Step 2: JWT Token Generation
When the app needs to talk to Supabase:

```typescript
// app/ssr/client.tsx
export function createServerSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_KEY!,
    {
      async accessToken() {
        // THIS IS THE BRIDGE:
        return (await auth()).getToken({ template: 'supabase' });
      },
    }
  );
}
```

**What happens:**
- `auth()` retrieves the Clerk session.
- `.getToken({ template: 'supabase' })` generates a **JWT token** using a Clerk template.
- This token contains:
  - `sub`: Clerk User ID (e.g., `user_2xyz123`)
  - `aud`: `'authenticated'` (tells Supabase this is a logged-in user)
  - `exp`: Token expiration timestamp

#### Step 3: Supabase Verifies the Token
1. Next.js sends a query to Supabase with the JWT in the `Authorization: Bearer <token>` header.
2. Supabase uses the **JWKS URL** (configured in Supabase Dashboard) to verify the token signature.
3. If valid, Supabase extracts the `sub` (Clerk User ID) and exposes it via `auth.jwt()`.

#### Step 4: RLS Enforcement
Every RLS policy uses helper functions that call `auth.jwt()`:

```sql
-- supabase/migrations/002_day1_rls.sql
create or replace function public.current_clerk_user_id()
returns text
language sql
stable
set search_path = public
as $$
  select nullif(auth.jwt() ->> 'sub', '');
$$;
```

This means:
- RLS policies can now check: *"Who is this Clerk user?"*
- The system looks up their `profiles` row to get their **role** (super_admin, pm, viewer, etc.).
- Based on the role, the database allows or denies the query.

### Profile Bootstrapping (Chicken-and-Egg Problem)

**Problem:** A brand-new Clerk user has no row in the `profiles` table yet. How do they pass RLS to create their profile?

**Solution:** Use a **service role client** (bypasses RLS) to insert the initial profile.

```typescript
// app/ssr/profile.ts
export async function upsertProfile() {
  const user = await currentUser(); // Get Clerk user
  if (!user) throw new Error("Not authenticated");

  const supabase = createServiceSupabaseClient(); // SERVICE ROLE KEY
  const { data, error } = await supabase.from("profiles").upsert(
    {
      clerk_user_id: user.id,
      email: user.emailAddresses[0]?.emailAddress ?? null,
      display_name: user.fullName ?? user.username ?? user.id,
    },
    { onConflict: "clerk_user_id" }
  ).select('id').single();

  if (error) throw new Error(error.message);
  return { clerkUserId: user.id, profileId: data.id };
}
```

**Flow:**
1. User signs in for the first time.
2. Next.js page calls `upsertProfile()`.
3. Service role client inserts/updates the `profiles` row.
4. All subsequent requests use the **user-scoped client**, which enforces RLS.

---

## 5. Database Schema & Relationships

### Entity-Relationship Diagram

```
profiles (Identity)
   ├──> projects (pm_profile_id)
   ├──> project_members (profile_id)
   ├──> tenders (owner_profile_id)
   ├──> tender_members (profile_id)
   ├──> documents (uploaded_by_profile_id)
   ├──> notifications (recipient_profile_id)
   └──> audit_log (actor_profile_id)

projects
   ├──> project_members (project_id)
   ├──> project_milestones (project_id)
   ├──> documents (project_id)
   └──> tenders (project_id) [optional link]

tenders
   ├──> tender_members (tender_id)
   ├──> tender_comms_events (tender_id)
   └──> documents (tender_id)

documents
   └──> extraction_jobs (document_id)
```

### Table Details

#### 1. `profiles`
**Purpose:** Internal user records linked to Clerk accounts.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `clerk_user_id` | text | Unique Clerk user ID (e.g., `user_2xyz`) |
| `email` | text | User's email address |
| `display_name` | text | Full name or username |
| `role` | profile_role | Enum: `super_admin`, `chairman_vp`, `dept_head`, `pm`, `engineer`, `finance`, `viewer` |
| `created_at` | timestamptz | When the profile was created |
| `updated_at` | timestamptz | Last modification timestamp |

**Key Constraint:** `clerk_user_id` is unique.

---

#### 2. `clients`
**Purpose:** External organizations (customers, partners).

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `name` | text | Client name |
| `classification` | text | Optional: VIP, Standard, etc. |
| `notes` | text | Internal notes |

---

#### 3. `projects`
**Purpose:** Engineering projects.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `code` | text | Unique project code (e.g., `PRJ-2024-001`) |
| `name` | text | Project name |
| `client_id` | uuid | Foreign key → `clients` |
| `pm_profile_id` | uuid | Foreign key → `profiles` (Project Manager) |
| `stage` | text | Current stage (e.g., "Design", "Construction") |
| `start_date` | date | Project start date |
| `end_date` | date | Project end date |
| `dlp_date` | date | Defects Liability Period end date |
| `progress_pct` | integer | Progress percentage (0-100) |
| `status` | project_status | Enum: `active`, `on_hold`, `completed` |
| `tags` | text[] | Array of tags for categorization |

**Indexes:**
- `projects_client_idx` on `client_id`
- `projects_pm_idx` on `pm_profile_id`

---

#### 4. `project_members`
**Purpose:** Many-to-many relationship for project team members.

| Column | Type | Description |
|--------|------|-------------|
| `project_id` | uuid | Foreign key → `projects` |
| `profile_id` | uuid | Foreign key → `profiles` |
| `member_role` | profile_role | Team member's role for this project |

**Primary Key:** `(project_id, profile_id)`

---

#### 5. `project_milestones`
**Purpose:** Deliverables or checkpoints within a project.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `project_id` | uuid | Foreign key → `projects` |
| `title` | text | Milestone name |
| `due_date` | date | Deadline |
| `owner_profile_id` | uuid | Foreign key → `profiles` (responsible person) |
| `status` | milestone_status | Enum: `not_started`, `in_progress`, `done`, `blocked` |

**Index:** `milestones_due_idx` on `due_date`

---

#### 6. `tenders`
**Purpose:** Bid opportunities or RFPs.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `client_id` | uuid | Foreign key → `clients` |
| `project_id` | uuid | Optional foreign key → `projects` (if linked) |
| `reference` | text | Tender reference number |
| `title` | text | Tender title |
| `deadline_at` | timestamptz | Submission deadline |
| `status` | tender_status | Enum: `new`, `in_review`, `submitted`, `awarded`, `lost` |
| `value_amount` | numeric(12,2) | Contract value |
| `value_currency` | text | Currency code (default: `GBP`) |
| `owner_profile_id` | uuid | Foreign key → `profiles` (lead) |
| `next_followup_at` | timestamptz | Next scheduled follow-up |

**Indexes:**
- `tenders_deadline_idx` on `deadline_at`
- `tenders_owner_idx` on `owner_profile_id`

---

#### 7. `tender_members`
**Purpose:** Many-to-many for tender team members.

| Column | Type | Description |
|--------|------|-------------|
| `tender_id` | uuid | Foreign key → `tenders` |
| `profile_id` | uuid | Foreign key → `profiles` |

**Primary Key:** `(tender_id, profile_id)`

---

#### 8. `tender_comms_events` (Append-Only)
**Purpose:** Communication log for tender follow-ups.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `tender_id` | uuid | Foreign key → `tenders` |
| `actor_profile_id` | uuid | Foreign key → `profiles` (who logged this) |
| `occurred_at` | timestamptz | When the communication happened |
| `channel` | tender_channel | Enum: `email`, `call`, `meeting`, `other` |
| `outcome` | text | Result of the communication |
| `notes` | text | Detailed notes |

**Immutability:** A database trigger prevents UPDATE/DELETE on this table.

---

#### 9. `documents`
**Purpose:** File metadata (the actual file is in Supabase Storage).

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `doc_type` | text | Document category (e.g., "tender_pack", "drawing") |
| `sensitivity` | document_sensitivity | Enum: `confidential`, `restricted` |
| `project_id` | uuid | Optional foreign key → `projects` |
| `tender_id` | uuid | Optional foreign key → `tenders` |
| `title` | text | Display name |
| `storage_bucket` | text | Storage bucket name (default: `mce-documents`) |
| `storage_path` | text | Path to the file in storage |
| `mime_type` | text | File MIME type |
| `size_bytes` | bigint | File size |
| `uploaded_by_profile_id` | uuid | Foreign key → `profiles` |
| `version_group_id` | uuid | Optional: links multiple versions of the same document |
| `version_number` | integer | Version number (default: 1) |

**Constraint:** `(project_id IS NOT NULL OR tender_id IS NOT NULL)` — every document must be linked to a project or tender.

**Indexes:**
- `documents_project_idx` on `project_id`
- `documents_tender_idx` on `tender_id`

---

#### 10. `extraction_jobs`
**Purpose:** Tracks background jobs for AI extraction (Phase 2).

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `document_id` | uuid | Foreign key → `documents` |
| `job_type` | text | Job type (e.g., `tender_pack`, `sow_extract`) |
| `status` | text | Status: `pending`, `running`, `succeeded`, `failed` |
| `started_at` | timestamptz | When the job started |
| `finished_at` | timestamptz | When the job finished |
| `result_json` | jsonb | Extracted data (JSON) |
| `error_message` | text | Error details if failed |

---

#### 11. `notifications`
**Purpose:** In-app alerts with acknowledgement tracking.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `recipient_profile_id` | uuid | Foreign key → `profiles` |
| `severity` | notification_severity | Enum: `info`, `warn`, `critical` |
| `type` | notification_type | Enum: `tender_deadline`, `milestone_due`, `followup_due`, `system` |
| `message` | text | Notification text |
| `entity_type` | audit_entity | Related entity type |
| `entity_id` | uuid | Related entity ID |
| `ack_required` | boolean | Whether acknowledgement is mandatory |
| `acked_at` | timestamptz | When acknowledged |
| `acked_by_profile_id` | uuid | Who acknowledged it |
| `read_at` | timestamptz | When the notification was read |

**Index:** `notifications_recipient_idx` on `recipient_profile_id`

---

#### 12. `audit_log` (Append-Only)
**Purpose:** Immutable audit trail for all mutations.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `actor_profile_id` | uuid | Foreign key → `profiles` |
| `action` | audit_action | Enum: `create`, `update`, `delete`, `upload`, `ack` |
| `entity_type` | audit_entity | Entity type |
| `entity_id` | uuid | Entity ID |
| `occurred_at` | timestamptz | Timestamp |
| `metadata` | jsonb | Additional context (JSON) |

**Immutability:** A database trigger prevents UPDATE/DELETE on this table.

**Index:** `audit_entity_idx` on `(entity_type, entity_id)`

---

## 6. Row Level Security (RLS) Policy Matrix

### RLS Policy Summary (All Tables)

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| **profiles** | ✅ Self or Admin | 🚫 None | ✅ Self only | 🚫 None |
| **clients** | ✅ PM+ roles | ✅ Dept Head+ | ✅ Dept Head+ | 🚫 None |
| **projects** | ✅ PM, Members, Admin | ✅ PM+ | ✅ PM or Admin | 🚫 None |
| **project_members** | ✅ Project viewers | ✅ Project editors | ✅ Project editors | ✅ Project editors |
| **project_milestones** | ✅ Project viewers | ✅ Project editors | ✅ Project editors | 🚫 None |
| **tenders** | ✅ Owner, Members, Admin | ✅ PM+ (owner=self) | ✅ Owner or Admin | 🚫 None |
| **tender_members** | ✅ Tender viewers | ✅ Tender editors | ✅ Tender editors | ✅ Tender editors |
| **tender_comms_events** | ✅ Tender viewers | ✅ Tender viewers (actor=self) | 🚫 Append-only | 🚫 Append-only |
| **documents** | ✅ Project/Tender viewers | ✅ Project/Tender editors (uploader=self) | ✅ Admin or editors | ✅ Admin only |
| **extraction_jobs** | ✅ Document viewers | ✅ Document editors | ✅ Admin only | ✅ Admin only |
| **notifications** | ✅ Recipient or Admin | 🚫 None | ✅ Recipient only (ack fields) | 🚫 None |
| **audit_log** | ✅ Actor or Admin | ✅ Actor=self | 🚫 Append-only | 🚫 Append-only |

### RLS Helper Functions

These functions centralize permission logic:

```sql
-- Extract Clerk user ID from JWT
public.current_clerk_user_id() → text

-- Get internal profile ID
public.current_profile_id() → uuid

-- Get current user's role
public.current_profile_role() → profile_role

-- Check if user has admin privileges
public.is_admin_role() → boolean

-- Check if user can view a project
public.can_view_project(project_id uuid) → boolean

-- Check if user can edit a project
public.can_edit_project(project_id uuid) → boolean

-- Check if user can view a tender
public.can_view_tender(tender_id uuid) → boolean

-- Check if user can edit a tender
public.can_edit_tender(tender_id uuid) → boolean
```

### Example Policy: `documents_insert`

```sql
create policy documents_insert
  on public.documents
  for insert
  with check (
    (
      (project_id is not null and public.can_edit_project(project_id))
      or (tender_id is not null and public.can_edit_tender(tender_id))
    )
    and uploaded_by_profile_id = public.current_profile_id()
  );
```

**Translation:** You can insert a document if:
1. The document is linked to a project YOU can edit, OR
2. The document is linked to a tender YOU can edit, AND
3. You mark yourself as the uploader.

---

## 7. File Upload Workflow (Complete)

### The Problem
How do you securely upload a file to Supabase Storage when the file might be 50MB and the upload takes 30 seconds?

### The Solution: Two-Phase Upload with Signed URLs

```
┌───────────────────────────────────────────────────────────┐
│                USER (Browser)                             │
│  1. Selects file: "TenderPack.pdf" (50MB)                │
└──────────────────┬────────────────────────────────────────┘
                   │
                   │ 2. POST /ssr/documents (prepareDocumentUpload)
                   ▼
┌───────────────────────────────────────────────────────────┐
│           NEXT.JS (Server Action)                         │
│  3. Validate: Does user have permission?                  │
│  4. Create DB row in "documents" table                    │
│     ├─ storage_path = "tenders/{tender_id}/1234-file.pdf" │
│     ├─ uploaded_by_profile_id = current_user_id           │
│     └─ RLS CHECK: Can they edit this tender?              │
│  5. Request signed upload URL from Supabase Storage       │
│     └─ supabase.storage.createSignedUploadUrl(path)       │
│  6. Create "extraction_jobs" row (status: pending)        │
│  7. Write audit log entry (action: upload)                │
│  8. Return: { documentId, signedUrl, path }               │
└──────────────────┬────────────────────────────────────────┘
                   │
                   │ 9. signedUrl returned to browser
                   ▼
┌───────────────────────────────────────────────────────────┐
│                USER (Browser)                             │
│ 10. PUT signedUrl (file bytes directly)                  │
│     ├─ Headers: Content-Type: application/pdf             │
│     └─ Body: <50MB of PDF data>                           │
└──────────────────┬────────────────────────────────────────┘
                   │
                   │ 11. Direct upload to Supabase Storage
                   ▼
┌───────────────────────────────────────────────────────────┐
│           SUPABASE STORAGE                                │
│ 12. Validate signed URL signature                         │
│ 13. Check storage RLS policy (INSERT)                     │
│     └─ Does a "documents" row exist with this path?       │
│        └─ Does the uploader match current_profile_id?     │
│ 14. If valid: Save file to bucket                         │
│ 15. Return: 200 OK                                        │
└───────────────────────────────────────────────────────────┘
```

### Code Walkthrough

#### Phase 1: Metadata + Signed URL

```typescript
// app/ssr/documents.ts
export async function prepareDocumentUpload(input: {
  fileName: string;
  fileType: string;
  fileSize: number;
  tenderId?: string;
  projectId?: string;
  docType?: string;
  sensitivity?: string;
  title?: string;
}) {
  // Step 1: Ensure user has a profile
  const { profileId } = await upsertProfile();
  const supabase = createServerSupabaseClient();
  const profile = { id: profileId };

  // Step 2: Generate storage path
  const safeName = sanitizeFileName(input.fileName);
  const prefix = input.projectId
    ? `projects/${input.projectId}`
    : `tenders/${input.tenderId}`;
  const storagePath = `${prefix}/${Date.now()}-${safeName}`;

  // Step 3: Create "documents" row (RLS enforced)
  const { data: document, error: documentError } = await supabase
    .from("documents")
    .insert({
      doc_type: input.docType,
      sensitivity: input.sensitivity ?? "confidential",
      project_id: input.projectId ?? null,
      tender_id: input.tenderId ?? null,
      title: input.title ?? input.fileName,
      storage_bucket: "mce-documents",
      storage_path: storagePath,
      mime_type: input.fileType,
      size_bytes: input.fileSize,
      uploaded_by_profile_id: profile.id,
    })
    .select("id")
    .single();

  if (documentError || !document) {
    throw new Error(documentError?.message ?? "Failed to create document record");
  }

  // Step 4: Request signed upload URL
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("mce-documents")
    .createSignedUploadUrl(storagePath);

  if (uploadError || !uploadData) {
    throw new Error(uploadError?.message ?? "Unable to create signed upload URL");
  }

  // Step 5: Create extraction job (for future AI processing)
  const jobType = input.tenderId ? "tender_pack" : "document_ingest";
  const { error: jobError } = await supabase.from("extraction_jobs").insert({
    document_id: document.id,
    job_type: jobType,
  });

  if (jobError) {
    throw new Error(jobError.message);
  }

  // Step 6: Write audit log
  await writeAudit("upload", "document", document.id, {
    path: storagePath,
    projectId: input.projectId ?? null,
    tenderId: input.tenderId ?? null,
  });

  // Step 7: Return signed URL to client
  return {
    documentId: document.id,
    signedUrl: uploadData.signedUrl,
    path: storagePath,
  };
}
```

#### Phase 2: Client Upload

```typescript
// app/documents/page.tsx (Client Component)
"use client";

export default function DocumentsPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  async function handleUpload() {
    if (!selectedFile) return;

    // Step 1: Call server action
    const { signedUrl } = await prepareDocumentUpload({
      fileName: selectedFile.name,
      fileType: selectedFile.type,
      fileSize: selectedFile.size,
      tenderId: "...",
    });

    // Step 2: Upload file bytes directly to Supabase Storage
    const uploadResponse = await fetch(signedUrl, {
      method: "PUT",
      headers: { "Content-Type": selectedFile.type },
      body: selectedFile,
    });

    if (!uploadResponse.ok) {
      throw new Error("Upload failed");
    }

    alert("Upload successful!");
  }

  return (
    <div>
      <input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
      <button onClick={handleUpload}>Upload</button>
    </div>
  );
}
```

### Storage RLS Policy (INSERT)

```sql
-- supabase/migrations/003_storage_policies.sql
create policy storage_documents_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'mce-documents'
  and exists (
    select 1
    from public.documents d
    where d.storage_bucket = storage.objects.bucket_id
      and d.storage_path = storage.objects.name
      and d.uploaded_by_profile_id = public.current_profile_id()
      and (
        (d.project_id is not null and public.can_edit_project(d.project_id))
        or (d.tender_id is not null and public.can_edit_tender(d.tender_id))
      )
  )
);
```

**Translation:** Storage upload is allowed if:
1. The bucket is `mce-documents`, AND
2. There exists a `documents` row with:
   - The same `storage_path` as the upload path.
   - The uploader is the current user.
   - The user has edit permissions on the linked project/tender.

---

## 8. User Workflows by Role

### Workflow 1: Super Admin Creates a Project

1. **Login:** Super Admin signs in via Clerk.
2. **Navigate:** Clicks "Dashboard" → "+ New Project".
3. **Fill Form:**
   - Code: `PRJ-2026-001`
   - Name: `Downtown Tower`
   - Status: `active`
4. **Submit:** Clicks "Create Project".
5. **Server Action:** `createProject()` is called.
   - RLS Check: Super Admin can insert into `projects` (role check passes).
   - DB Insert: Row created in `projects` table.
   - Audit Log: Entry written to `audit_log` (action: `create`, entity_type: `project`).
   - Cache Invalidation: `revalidatePath("/projects")` refreshes the list page.
6. **Redirect:** User redirected to `/projects` page showing the new project.

---

### Workflow 2: PM Uploads a Tender Pack

1. **Login:** PM signs in via Clerk.
2. **Navigate:** Goes to `/tenders/{tender_id}` (a tender they own).
3. **Upload File:**
   - Selects "TenderPack.pdf" (50MB).
   - Clicks "Upload Document".
4. **Phase 1 (Server Action):**
   - `prepareDocumentUpload()` is called.
   - RLS Check: Does PM have edit rights on this tender? (Yes, they own it.)
   - DB Insert: `documents` row created.
   - DB Insert: `extraction_jobs` row created (status: `pending`).
   - Audit Log: Entry written (action: `upload`).
   - Returns: `{ signedUrl: "https://..." }`
5. **Phase 2 (Client Upload):**
   - Browser sends `PUT` request to `signedUrl` with file bytes.
   - Supabase Storage validates:
     - Is the URL signature valid?
     - Does a `documents` row exist with this path?
     - Does the uploader match the current user?
   - File saved to `mce-documents/tenders/{tender_id}/1234-TenderPack.pdf`.
6. **Confirmation:** UI shows "Upload successful!"

---

### Workflow 3: Engineer Views Project Documents

1. **Login:** Engineer signs in via Clerk.
2. **Navigate:** Goes to `/projects/{project_id}` (they are a team member).
3. **Documents Tab:**
   - Server component fetches documents:
     ```typescript
     const { data: documents } = await supabase
       .from("documents")
       .select("id, title, created_at")
       .eq("project_id", projectId);
     ```
   - RLS Policy: `documents_select` allows access if `can_view_project(project_id)` returns true.
   - Function `can_view_project()` checks:
     - Is user an admin? No.
     - Is user the PM? No.
     - Is user a project member? Yes. **Access granted.**
4. **Download:**
   - Engineer clicks "Download" on a document.
   - Server action `createSignedDownload()` is called:
     ```typescript
     const { data } = await supabase.storage
       .from("mce-documents")
       .createSignedUrl(document.storage_path, 60); // 60 seconds
     return { signedUrl: data.signedUrl };
     ```
   - RLS Check: Storage SELECT policy validates the user can view this document.
   - Browser redirects to the signed URL, file downloads.

---

### Workflow 4: Viewer Tries to Delete a Document (Blocked)

1. **Login:** Viewer signs in via Clerk.
2. **Navigate:** Somehow navigates to a project they can view (e.g., via URL).
3. **Attempt Delete:**
   - Viewer tries to call a hypothetical `deleteDocument(documentId)` server action.
4. **RLS Block:**
   - Server action calls:
     ```typescript
     const { error } = await supabase
       .from("documents")
       .delete()
       .eq("id", documentId);
     ```
   - RLS Policy: `documents_delete` requires `is_admin_role()` to return true.
   - Function `is_admin_role()` checks:
     - Is the user's role in `['super_admin', 'chairman_vp', 'dept_head', 'finance']`? No (role is `viewer`).
   - **Result:** Supabase returns `error: "new row violates row-level security policy"`.
5. **Error:** Server action throws an error, UI shows "Permission denied."

---

## 9. Server Actions & API Patterns

### File Structure

```
app/ssr/
├── client.tsx          → Supabase client factory
├── profile.ts          → Profile bootstrapping
├── audit.ts            → Audit logging helper
├── projects.ts         → Project CRUD
├── tenders.ts          → Tender CRUD
├── comms.ts            → Tender communications log
├── documents.ts        → Document upload/download
├── notifications.ts    → Notification acknowledgement
└── storage.ts          → (Unused - kept for reference)
```

### Naming Convention

All server actions follow this pattern:
- **Verb + Noun**: `createProject`, `addTenderComms`, `acknowledgeNotification`
- **Prefix with `"use server"`**: Marks the function as a server action.
- **Return Type**: Usually `Promise<void>` or `Promise<{ ... }>`.

### Standard Flow

Every mutation follows this pattern:

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "./client";
import { upsertProfile } from "./profile";
import { writeAudit } from "./audit";

export async function createSomething(input: { ... }) {
  // Step 1: Ensure profile exists
  await upsertProfile();

  // Step 2: Get user-scoped Supabase client
  const supabase = createServerSupabaseClient();

  // Step 3: Fetch current profile ID
  const { data: profile } = await supabase.from("profiles").select("id").single();
  if (!profile) throw new Error("Profile not found");

  // Step 4: Perform mutation (RLS enforced)
  const { data, error } = await supabase
    .from("some_table")
    .insert({ ... })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create");
  }

  // Step 5: Write audit log
  await writeAudit("create", "entity_type", data.id, { metadata });

  // Step 6: Invalidate cache
  revalidatePath("/some-page");
}
```

---

## 10. Storage Architecture

### Bucket: `mce-documents` (Private)

**Configuration:**
- **Public Access:** ❌ Disabled
- **File Size Limit:** 50MB (configurable in Supabase Dashboard)
- **Allowed File Types:** All (enforced at app level, not storage level)

### Storage Path Convention

```
mce-documents/
├── projects/
│   ├── {project_id}/
│   │   ├── 1234567890-Drawing-Sheet1.pdf
│   │   ├── 1234567891-SOW-v1.docx
│   │   └── ...
│   └── {another_project_id}/
│       └── ...
└── tenders/
    ├── {tender_id}/
    │   ├── 1234567892-TenderPack.pdf
    │   ├── 1234567893-PriceSchedule.xlsx
    │   └── ...
    └── {another_tender_id}/
        └── ...
```

**File Naming:** `{timestamp}-{sanitized_filename}`  
**Why Timestamp?** Prevents filename collisions and provides a chronological order.

### Storage RLS Policies

Three policies control access:

1. **SELECT (View/Download):**
   - User must be able to view the related project/tender.
   - Generates time-limited signed URLs (60 seconds by default).

2. **INSERT (Upload):**
   - User must be able to edit the related project/tender.
   - Requires a matching `documents` row with the exact path.

3. **DELETE (Remove):**
   - Admin-only.
   - Prevents accidental data loss.

---

## 11. Audit & Compliance System

### Audit Log Schema

Every mutation writes to `audit_log`:

```sql
{
  "actor_profile_id": "uuid",
  "action": "create | update | delete | upload | ack",
  "entity_type": "project | tender | document | notification | ...",
  "entity_id": "uuid",
  "occurred_at": "2026-01-20T12:34:56Z",
  "metadata": { "custom": "data" }
}
```

### Append-Only Enforcement

```sql
create trigger audit_no_update
before update or delete on public.audit_log
for each row execute function public.prevent_updates();
```

**Result:** Any attempt to UPDATE or DELETE an audit log row raises an exception: `"append-only"`.

### Audit Queries (Examples)

**Who created project PRJ-2026-001?**
```sql
SELECT p.display_name, a.occurred_at
FROM audit_log a
JOIN profiles p ON a.actor_profile_id = p.id
WHERE a.entity_type = 'project'
  AND a.entity_id = (SELECT id FROM projects WHERE code = 'PRJ-2026-001')
  AND a.action = 'create';
```

**All uploads by a specific user in the last 30 days:**
```sql
SELECT a.occurred_at, d.title
FROM audit_log a
JOIN documents d ON a.entity_id = d.id
WHERE a.actor_profile_id = 'user-uuid'
  AND a.action = 'upload'
  AND a.occurred_at > NOW() - INTERVAL '30 days';
```

---

## 12. Notification System

### Notification Flow

1. **Creation:** Notifications are manually inserted via SQL or (Phase 2) automatically via Vercel Cron.
2. **Display:** User sees notifications in `/notifications` page.
3. **Acknowledgement:** User clicks "Acknowledge" on critical notifications.
   - Server action `acknowledgeNotification()` updates `acked_at` and `acked_by_profile_id`.
   - Audit log entry created (action: `ack`).

### Notification Types

| Type | Description | Example |
|------|-------------|---------|
| `tender_deadline` | Tender submission due soon | "Tender T-2026-001 due in 3 days" |
| `milestone_due` | Project milestone approaching | "Milestone 'Foundation' due tomorrow" |
| `followup_due` | Tender follow-up scheduled | "Follow up with Client X today" |
| `system` | System announcements | "Database maintenance scheduled" |

### Severity Levels

| Severity | Description | UI Color |
|----------|-------------|----------|
| `info` | Informational | Blue |
| `warn` | Warning | Yellow |
| `critical` | Requires acknowledgement | Red |

---

## 13. Deployment & Configuration

### Environment Variables

Create `.env.local` (never commit this file):

```bash
# Clerk (Authentication)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Supabase (Database + Storage)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (anon key)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (service role key)

# App URLs (Clerk Redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

### Deployment Steps (Vercel)

1. **Push to GitHub:**
   ```bash
   git push origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com).
   - Import repository.
   - Framework: Next.js (auto-detected).

3. **Add Environment Variables:**
   - In Vercel Dashboard → Settings → Environment Variables.
   - Paste all variables from `.env.local`.

4. **Deploy:**
   - Vercel auto-deploys on every push to `main`.

5. **Configure Clerk for Production:**
   - In Clerk Dashboard → API Keys → Select Production.
   - Update `NEXT_PUBLIC_APP_URL` to your Vercel domain (e.g., `https://mce.vercel.app`).

6. **Run Migrations on Production Supabase:**
   - Go to Supabase Dashboard → SQL Editor.
   - Run `001_day1_schema.sql`, `002_day1_rls.sql`, `003_storage_policies.sql` in order.
   - Manually create storage policies via Storage → Policies.

---

## 14. Future Extension Points

The system is designed for Phase 2/3 expansions:

### Phase 2: Automation & AI
- **Vercel Cron Jobs:** Daily deadline checks, notification generation.
- **Tender Pack Extraction:** Use `extraction_jobs` table to trigger AI processing.
  - Parse PDFs for dates, prices, requirements.
  - Store results in `result_json` (jsonb).

### Phase 3: RAG & Search
- **Add Tables:**
  - `document_chunks` (text chunks from PDFs)
  - `document_embeddings` (vector embeddings)
- **Use pgvector:** Supabase supports vector similarity search.
- **Search API:** Full-text search + semantic search.

### Phase 4: Finance & HR
- **Add Tables:**
  - `finance_exports` (invoice tracking)
  - `resource_allocations` (manpower planning)
- **Dashboards:** Real-time budget vs. actual reports.

---

## Summary

This document provides a **complete technical blueprint** of the MCE Command Center system. Every workflow, permission check, and data flow has been documented to ensure clarity for:
- **Developers:** Understand the codebase structure and patterns.
- **Admins:** Configure roles, permissions, and storage policies.
- **Stakeholders:** Grasp how the system enforces security and compliance.

**Key Takeaway:** Security is enforced at the **database layer** (RLS), not just in the app. This makes the system robust against attacks and bugs in the application code.
