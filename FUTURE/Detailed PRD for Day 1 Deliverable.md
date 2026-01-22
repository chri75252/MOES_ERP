Below is a **detailed PRD for a “Day-1 deliverable”** (a functioning system you can use immediately) built on the **recommended future-safe foundation**:

* **Template (base):** `clerk/clerk-supabase-nextjs` (official companion repo) ([GitHub][1])
* **Core integration approach:** Clerk session/JWT → Supabase RLS using `auth.jwt()` ([Clerk][2])
* **Docs security:** Supabase Storage + **signed URLs** + storage access control via RLS ([Supabase][3])
* **Future scheduling:** Vercel Cron Jobs (Phase 2+) ([Vercel][4])
* **Future long tasks constraint:** Vercel function duration/timeouts must be engineered around for Tender Pack extraction ([Vercel][5])

---

# PRD — MCE Command Center (Day-1 Deliverable, Future-Safe)

## 0) Document control

* **Version:** 0.1 (Day-1 Deliverable)
* **Timezone:** Asia/Dubai
* **Stack (fixed):** Next.js (App Router) + Supabase (Postgres/RLS/Storage) + Clerk + Vercel
* **Template:** `clerk/clerk-supabase-nextjs` ([GitHub][1])

---

## 1) Executive summary

Build a production-credible internal system in **one day** that is already aligned with the full roadmap (Project Tracker + Tender Tracker + Documents + Notifications + Tender Optimization PoC + later RAG/Finance/HR). Day-1 must be **usable** and **secure**, and it must **not** introduce architectural debt that blocks later additions like deadline escalations, acknowledgements, tender-pack extraction, discipline briefs, and RAG indexing.

Day-1 focuses on:

* **Secure identity + authorization foundation** (Clerk + Supabase RLS)
* **Core entities + CRUD** (Projects, Clients, Tenders)
* **Documents** (upload + metadata + signed access)
* **Milestones panel (basic)** + **Tender countdown fields (basic)**
* **Minimal audit log** + **minimal in-app notifications table** (not full escalation engine yet)

---

## 2) Goals and non-goals

### 2.1 Goals (Day-1)

**G1 — Working System:** A user can sign in, create a project, create a tender, upload a tender pack/document, and retrieve it securely.

**G2 — Security baseline:**

* RLS is enabled on all core tables and verified using real user sessions. Supabase RLS is the “final gate.” ([Supabase][6])
* No public/anonymous writes to core tables.

**G3 — Future-safe data model:** Schema includes the “hooks” required for the planned features (milestones, follow-ups/comms log, notifications/ack, extraction jobs, discipline tags, document taxonomy).

**G4 — Deployable:** Runs locally + deploys to Vercel with environment variables configured.

### 2.2 Non-goals (explicitly deferred)

These are **not** delivered Day-1 (but the design must accommodate them cleanly):

* Automatic email sending + acknowledgement enforcement + escalation
* Vercel Cron schedules and background processing
* Tender Pack “<5 minutes” extraction with robust parsing (Day-1 only stores pack + creates a pending job record)
* RAG chunking/embedding/retrieval UI with citations
* Finance forecasting dashboards from exports
* HR manpower planning/utilization dashboard
* Stage timeline/Gantt and full stage history UI

---

## 3) Users, roles, and access model

### 3.1 Roles (from your requirements)

* Super Admin
* Chairman/VP
* Dept Head
* PM
* Engineer
* Finance
* Viewer

Day-1 implementation: roles exist and are enforced in **RLS + app checks**. UI can be uniform initially; access filtering is enforced at DB level.

### 3.2 Access rules (Day-1 baseline)

* **Super Admin:** full CRUD across everything.
* **Chairman/VP, Dept Head:** read all; edit limited fields (configurable later).
* **PM:** CRUD only for projects/tenders they own/are assigned to.
* **Engineer:** read assigned; add notes/comms entries; upload documents.
* **Finance:** read all; add finance notes later.
* **Viewer:** read-only within permitted scope.

**Key design principle:** app checks are convenience; **RLS is authoritative**. ([Supabase][6])

---

## 4) Day-1 functional scope (what is delivered)

### 4.1 Module A — Authentication & Profile provisioning

**User story:** As a user, I sign in and the system creates/updates my internal profile automatically.

**Requirements**

* Clerk sign-in/sign-up integrated via template.
* On first login:

  * Insert/update `profiles` row with `clerk_user_id`, email, display name.
  * Default role assignment strategy:

    * Day-1: manual assignment via SQL or a simple admin-only page.

**Implementation note:** the Clerk↔Supabase integration depends on Clerk session token/JWT data being available to Supabase RLS via `auth.jwt()` patterns. ([Clerk][2])

---

### 4.2 Module B — Projects (Project Tracker, “quick win”)

From your checklist: CRUD + list + filters + export. Milestone panel shows next 10 milestones. (P0 / MVP=Yes)

**Features (Day-1)**

* Projects list page:

  * table view
  * filters: status, PM, client
  * search: by code/name
  * export: CSV of filtered list
* Project detail page:

  * core fields: code, name, client, PM, stage, start/end/DLP dates, % progress, tags
  * related: documents list, milestones list, linked tenders list (if any)
* Milestones panel:

  * show next 10 upcoming milestones across all projects the user can access
  * compute “T-x days” from due date

**Acceptance criteria (Day-1)**

* Create → view → edit project works and respects RLS.
* Milestones panel renders and shows T-x days.

---

### 4.3 Module C — Tenders (Tender Tracker “lite”, but usable)

From your checklist: tender intake CRUD + required fields validation; countdown thresholds and follow-ups/comms (P0 / MVP=Yes).

**Features (Day-1)**

* Tender list + detail pages
* Tender intake form with required fields validation:

  * client, reference, deadline, status, value, team owners
* Tender countdown fields:

  * store deadline
  * compute derived fields for UI: days_remaining, “T-14/T-7/T-3/T-1/day-of” flags
  * Day-1: store only flags; do not implement escalation engine
* Follow-ups + comms log:

  * `tender_comms_events` append-only events (who, when, outcome, notes)
  * `next_followup_at` on tender record

**Acceptance criteria (Day-1)**

* Create tender with required field validation.
* Add comms event; event is append-only.
* Deadline countdown displays correctly.

---

### 4.4 Module D — Documents (per-project folder scaffolding + controlled access)

From your checklist: per-project folder templates + controlled sharing (P0 / MVP=Yes). Also aligns to Document_Taxonomy.

**Day-1 Features**

* Upload file to Supabase Storage (private)
* Create `documents` metadata record:

  * doc_type (from taxonomy)
  * sensitivity_default (confidential/restricted)
  * entity link: project_id and/or tender_id
  * storage bucket/path, filename, size, mime type
  * status: uploaded
* Download/view:

  * generate **signed URL** (time-limited) for authorized users ([Supabase][7])
* “Folder scaffolding” (Day-1 minimal):

  * create a predictable storage prefix:
    `projects/{project_id}/...` and `tenders/{tender_id}/...`
  * optional: create placeholder “folders” by convention (no actual folder objects needed)

**Acceptance criteria (Day-1)**

* Upload succeeds; metadata row is created.
* Signed URL works for authorized user and fails for unauthorized user. ([Supabase][7])

---

### 4.5 Module E — Minimal notifications (DB-backed, UI-visible)

From your checklist: in-app + email alerts with acknowledgements (P0 / MVP=Yes).
Day-1 delivers the *foundation*, not full automation.

**Day-1 Features**

* `notifications` table (in-app):

  * recipient_user_id
  * type (tender_deadline, milestone_due, followup_due, system)
  * severity (info/warn/critical)
  * message
  * related entity refs
  * status: unread/read
  * ack_required (boolean)
  * acked_at, acked_by (nullable)
* Simple UI widget:

  * “Notifications” dropdown/list
  * mark as read
  * acknowledge if required (manual)

**Deferred (Phase 2+)**

* Email sending
* Escalation if not acknowledged
* Scheduled generation via Cron

Vercel Cron Jobs are the intended upgrade path. ([Vercel][4])

---

### 4.6 Module F — Basic search (minimal)

Day-1: simple search across:

* projects (code/name)
* tenders (ref/title)
* documents (title/filename/doc_type)

Implementation can start as `ilike` queries; upgrade to Postgres FTS later without breaking UI.

---

### 4.7 Module G — Minimal BI “one page”

Your checklist shows BI as P1 but MVP=Yes (“one page with core KPIs”).

**Day-1 KPI page**

* Projects count by status
* Tenders due in next 14/7/3/1 days
* Overdue milestones
* Unacknowledged critical notifications

No charts required Day-1; later add charts.js.

---

## 5) Data model (Day-1 schema, designed for future additions)

Below is the **minimum set of tables** that still supports your future roadmap without schema rewrites.

### 5.1 Tables (Day-1)

1. `profiles`

* `id` (uuid, pk)
* `clerk_user_id` (text, unique)
* `email`
* `display_name`
* `role` (enum/text)
* `created_at`, `updated_at`

2. `clients`

* `id`
* `name`
* `classification` (future)
* `notes`
* `created_at`, `updated_at`

3. `projects`

* `id`
* `code` (unique)
* `name`
* `client_id` (fk)
* `pm_profile_id` (fk → profiles)
* `stage` (text)
* `start_date`, `end_date`, `dlp_date`
* `progress_pct` (int)
* `status` (text)
* `tags` (text[])
* `created_at`, `updated_at`

4. `project_milestones`

* `id`
* `project_id` (fk)
* `title`
* `due_date`
* `owner_profile_id` (fk)
* `status`
* `created_at`

5. `tenders`

* `id`
* `client_id` (fk)
* `project_id` (nullable fk)  *(supports “tender first, project later”)*
* `reference`
* `title` (optional)
* `deadline_at`
* `status`
* `value_amount` + `value_currency`
* `owner_profile_id`
* `next_followup_at`
* `created_at`, `updated_at`

6. `tender_comms_events` (append-only)

* `id`
* `tender_id` (fk)
* `actor_profile_id` (fk)
* `occurred_at`
* `channel` (email/call/meeting/other)
* `outcome` (text)
* `notes` (text)
* `created_at`

7. `documents`

* `id`
* `doc_type` (taxonomy)
* `sensitivity` (confidential/restricted)
* `project_id` (nullable fk)
* `tender_id` (nullable fk)
* `title`
* `storage_bucket`
* `storage_path`
* `mime_type`, `size_bytes`
* `uploaded_by_profile_id`
* `created_at`
* `version_group_id` (nullable; future versioning)
* `version_number` (int; future)

8. `extraction_jobs` (future-safe placeholder for Tender Optimization)

* `id`
* `document_id`
* `job_type` (tender_pack_extract, sow_extract, etc.)
* `status` (pending/running/succeeded/failed)
* `started_at`, `finished_at`
* `result_json` (jsonb)
* `error_message`

9. `notifications`

* `id`
* `recipient_profile_id`
* `severity`
* `type`
* `message`
* `entity_type`, `entity_id`
* `ack_required`
* `acked_at`, `acked_by_profile_id`
* `read_at`
* `created_at`

10. `audit_log` (minimal but non-negotiable)

* `id`
* `actor_profile_id`
* `action` (create/update/delete/upload/ack)
* `entity_type`, `entity_id`
* `occurred_at`
* `metadata` (jsonb)

### 5.2 Future tables (explicitly planned, not Day-1)

* `workflow_definitions`, `workflow_instances`, `workflow_events` (deterministic automation layer)
* `document_chunks`, `document_embeddings` (RAG / pgvector)
* `tender_requirements`, `deliverables`, `review_assignments` (discipline briefs + compliance)
* `email_outbox` / `notification_delivery_attempts` (retries, idempotency)
* `finance_exports`, `invoice_alerts`
* `resource_allocations`, `utilization_snapshots`

Supabase supports pgvector and vector workflows in Postgres for RAG phases. ([Vercel][4])

---

## 6) Security, RLS, and token model (Day-1 must-have)

### 6.1 Clerk ↔ Supabase auth model

* Use Clerk session/JWT data in Supabase via `auth.jwt()` and write RLS policies accordingly. ([Clerk][2])
* This is the canonical way to keep Clerk as the identity provider while still enforcing Postgres RLS. ([Clerk][2])

### 6.2 RLS rules (Day-1 minimum)

* Enable RLS on: clients, projects, milestones, tenders, comms events, documents, notifications, audit_log
* Policies rely on:

  * role in `profiles`
  * ownership/assignment (pm_profile_id, owner_profile_id)
* Anonymous:

  * no insert/update/delete
  * minimal select (ideally none)

Supabase positions RLS as defense-in-depth for browser access and third-party tooling. ([Supabase][6])

### 6.3 Storage access

* Use private buckets + signed URLs for authorized access. Signed URL creation is supported and ties into Storage access control. ([Supabase][7])

---

## 7) UX: Day-1 pages and actions (App Router)

### 7.1 Routes/pages

* `/` → redirect to `/dashboard`
* `/dashboard` → KPI tiles + “Upcoming milestones” + “Tenders due soon”
* `/projects` → list, filters, export
* `/projects/[id]` → detail + milestones + documents + linked tenders
* `/tenders` → list, filters
* `/tenders/[id]` → detail + comms log + documents + deadline countdown
* `/documents` → global doc library (filters: type, sensitivity, project/tender)
* `/notifications` (or dropdown) → list + ack/read actions
* `/search` (optional) → unified search results

### 7.2 Write operations

Use Next.js server actions / route handlers for writes; ensure:

* auth check
* role check (app-layer)
* DB will still enforce via RLS

---

## 8) “Day-1 Definition of Done” (hard gates)

Day-1 is accepted only if:

1. **Auth works**

* A user can sign in (Clerk).

2. **RLS verified**

* A non-authorized user cannot access other users’ projects/tenders/documents via direct queries. (RLS is authoritative.) ([Supabase][6])

3. **Core CRUD works**

* Projects CRUD works.
* Tenders CRUD works.
* Comms event append works.
* Document upload creates Storage object + DB metadata row.

4. **Signed URL works**

* Authorized user can access; unauthorized fails. ([Supabase][7])

5. **Minimal audit log**

* Create/update/upload actions write an audit row.

6. **Deployable**

* Runs locally and deploys to Vercel.

---

# 9) “How to use the template” — concrete Day-1 build steps (actions + outputs)

This is the **operational playbook** the build agent should follow, based on the official companion repo and Clerk/Supabase guidance.

## 9.1 Initialize codebase

1. Create a new Git repo.
2. Use the official companion template:

   * `clerk/clerk-supabase-nextjs` ([GitHub][1])
3. Install dependencies; run locally.

**Output:** app boots with Clerk auth + Supabase connectivity scaffold.

## 9.2 Create Clerk application and configure JWT for Supabase

1. In Clerk dashboard:

   * Create application
   * Obtain keys (publishable + secret)
2. Create/configure a **JWT template** appropriate for Supabase usage (so the session token includes what Supabase needs). Clerk documents JWT templates. ([Clerk][8])

**Output:** Clerk can mint tokens usable for Supabase authorization flow.

## 9.3 Create Supabase project and enable Clerk as third-party auth

1. Create Supabase project.
2. Add Clerk as third-party auth provider (Supabase documents Clerk integration). ([Supabase][9])
3. Confirm Supabase JWT/RLS understanding:

   * JWT is the foundation for RLS decisions. ([Supabase][10])

**Output:** Supabase accepts the identity tokens used to evaluate RLS policies.

## 9.4 Configure environment variables (local + Vercel)

* Add Clerk keys
* Add Supabase URL and keys
* Verify runtime has access to all needed secrets

**Output:** local app can authenticate and query Supabase.

## 9.5 Implement schema + RLS policies (Day-1 v0)

1. Create the core tables (Section 5.1).
2. Enable RLS on core tables.
3. Write initial policies using `auth.jwt()` mapping to `profiles.clerk_user_id`. Clerk’s guide explicitly describes setting up RLS policies using Clerk session token data via `auth.jwt()`. ([Clerk][2])

**Output:** DB enforces access rules; unauthorized access is blocked.

## 9.6 Implement pages + server actions

* Implement list/detail views for projects/tenders
* Implement create/edit forms with server actions
* Implement document upload:

  * upload to Storage
  * insert metadata row
  * signed URL for viewing/downloading ([Supabase][7])

**Output:** end-to-end “create project → create tender → upload doc → view doc” works.

## 9.7 Deploy to Vercel

* Connect repo to Vercel
* Add environment variables
* Deploy and run smoke checks

**Output:** production URL with working auth and core flows.

---

# 10) Future additions (explicit roadmap, so the build agent designs for them now)

This is the “do not paint into a corner” list. The agent must:

* keep schema extensible
* avoid synchronous long-running extraction calls
* store events/jobs in DB so they can be scheduled/retried later

## Phase 2 — Deadline engine + notifications escalation

* Configurable countdown thresholds (14/7/3/1/day-of) + escalation rules
* Email delivery + acknowledgement enforcement
* Scheduled generation with **Vercel Cron Jobs** ([Vercel][4])

## Phase 2 — Tender Optimization (real)

* Tender pack upload triggers async extraction job:

  * extract key dates/requirements
  * produce summary report + checklist + discipline briefs
* Must be built as **async job** (DB job row + worker/cron trigger), not a single request.
* Reason: Vercel function duration/timeouts; use duration config and/or background pattern. ([Vercel][5])

## Phase 2 — Documents “folder templates” and versioning

* Enforced per-project/tender folder structure conventions
* Document version groups (pointer-based rollback)
* Controlled sharing rules by sensitivity (confidential vs restricted)

## Phase 3 — RAG / Retrieval UI with citations

* Chunking rules per Document_Taxonomy
* Metadata index
* Embeddings + vector search (pgvector)
* Retrieval UI that returns citations/source locations

## Phase 3 — Finance

* Import CSV exports
* invoice/payment alerts
* 30/60/90 dashboard

## Phase 4 — HR

* manpower planning by project
* utilization dashboard

## Ongoing — Deterministic agentic workflows

* `workflow_definitions` (versioned)
* `workflow_instances` state machine
* `workflow_events` append-only
* evaluator harness (security, integrity, regression)

---

# 11) Open questions (HITL checkpoints)

From your uncertainty/assumptions, Day-1 proceeds with defaults but flags these as HITL decisions:

* Whether client portal/multi-tenant is needed immediately (default: single-tenant now, multi-tenant-ready columns later)
* Data residency / hosting constraints (affects RAG and document handling)
* Max file sizes and retention rules (affects Storage + extraction pipeline design)
* Whether reminder escalations must be automated in Phase 2 or can stay manual longer

---

## If you want, I can also produce (in the same PRD style):

1. a **role → permission matrix** for every table/action (so the agent can implement RLS correctly), and
2. a **Day-1 smoke test checklist** that explicitly verifies RLS failures using real session tokens.

[1]: https://github.com/clerk/clerk-supabase-nextjs?utm_source=chatgpt.com "clerk/clerk-supabase-nextjs: The official companion repo ..."
[2]: https://clerk.com/docs/guides/development/integrations/databases/supabase?utm_source=chatgpt.com "Development: Integrate Supabase with Clerk"
[3]: https://supabase.com/docs/guides/storage?utm_source=chatgpt.com "Storage | Supabase Docs"
[4]: https://vercel.com/docs/cron-jobs/quickstart?utm_source=chatgpt.com "Getting started with cron jobs"
[5]: https://vercel.com/kb/guide/what-can-i-do-about-vercel-serverless-functions-timing-out?utm_source=chatgpt.com "What can I do about Vercel Functions timing out?"
[6]: https://supabase.com/docs/guides/database/postgres/row-level-security?utm_source=chatgpt.com "Row Level Security | Supabase Docs"
[7]: https://supabase.com/docs/reference/javascript/storage-from-createsignedurl?utm_source=chatgpt.com "JavaScript: Create a signed URL"
[8]: https://clerk.com/docs/guides/sessions/jwt-templates?utm_source=chatgpt.com "Session management: JWT templates"
[9]: https://supabase.com/docs/guides/auth/third-party/clerk?utm_source=chatgpt.com "Clerk | Supabase Docs"
[10]: https://supabase.com/docs/guides/auth/jwts?utm_source=chatgpt.com "JSON Web Token (JWT) | Supabase Docs"