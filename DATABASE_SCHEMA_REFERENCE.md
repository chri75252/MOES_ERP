# MCE Command Center — Database Schema Reference

**Last Updated:** 2026-01-21  
**Database:** PostgreSQL (via Supabase)

---

## For Non-Technical Readers

This document explains all the database tables in the MCE Command Center. Think of tables like spreadsheets — they store your data in rows and columns.

---

## Quick Overview

| Table | Purpose | Records Count (Example) |
|-------|---------|------------------------|
| `profiles` | User accounts | One per user |
| `projects` | Construction projects | Your active projects |
| `tenders` | Tender submissions | Each tender you're pursuing |
| `documents` | Uploaded files | Your project documents |
| `audit_log` | Action history | All changes made in the system |

---

## 1. profiles — User Accounts

Every user who signs up gets a profile.

### Columns

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Unique identifier (auto-generated) |
| `clerk_user_id` | TEXT | ID from Clerk authentication |
| `email` | TEXT | User's email address |
| `display_name` | TEXT | User's name (shown in UI) |
| `role` | ENUM | Permission level (see below) |
| `created_at` | TIMESTAMP | When account was created |
| `updated_at` | TIMESTAMP | Last update time |

### User Roles Explained

| Role | Description | Can Create Projects? | Can Edit? | Admin? |
|------|-------------|---------------------|-----------|--------|
| `super_admin` | Full system access | ✅ Yes | ✅ All | ✅ Yes |
| `chairman_vp` | Executive oversight | ✅ Yes | ✅ All | ✅ Yes |
| `dept_head` | Department manager | ✅ Yes | ✅ Department | ✅ Yes |
| `finance` | Financial oversight | ❌ No | ✅ Budget items | ✅ Yes |
| `pm` | Project manager | ✅ Yes | ✅ Assigned | ❌ No |
| `engineer` | Technical staff | ❌ No | ✅ Assigned | ❌ No |
| `viewer` | Read-only access | ❌ No | ❌ No | ❌ No |

### How to Change a User's Role

1. Go to **Supabase Dashboard**
2. Click **Table Editor** → **profiles**
3. Find the user's row
4. Click the `role` cell
5. Select the new role from the dropdown
6. Press Enter to save

---

## 2. projects — Construction Projects

Each construction project you manage.

### Columns

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Unique identifier |
| `code` | TEXT | Project code (e.g., "PROJ-001") — must be unique |
| `name` | TEXT | Project name |
| `client_id` | UUID | Reference to client (optional) |
| `pm_profile_id` | UUID | Project manager's profile ID |
| `stage` | TEXT | Current stage (free text) |
| `start_date` | DATE | When project started |
| `end_date` | DATE | Expected completion |
| `dlp_date` | DATE | Defects Liability Period end |
| `progress_pct` | INTEGER | Completion percentage (0-100) |
| `status` | ENUM | `active`, `on_hold`, or `completed` |
| `tags` | TEXT[] | Array of tags |
| `created_at` | TIMESTAMP | When record was created |
| `updated_at` | TIMESTAMP | Last update time |

### Project Status Values

| Status | Meaning |
|--------|---------|
| `active` | Currently in progress |
| `on_hold` | Temporarily paused |
| `completed` | Finished |

---

## 3. project_members — Project Team

Tracks who is assigned to which project.

### Columns

| Column | Type | Description |
|--------|------|-------------|
| `project_id` | UUID | Reference to project |
| `profile_id` | UUID | Reference to user profile |
| `member_role` | ENUM | Their role on this project |
| `created_at` | TIMESTAMP | When they were added |

### Primary Key

This table uses a **composite primary key** of `(project_id, profile_id)`, meaning each user can only be in a project once.

---

## 4. project_milestones — Project Deadlines

Key dates and tasks within projects.

### Columns

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Unique identifier |
| `project_id` | UUID | Reference to project |
| `title` | TEXT | Milestone name |
| `due_date` | DATE | When it's due |
| `owner_profile_id` | UUID | Who is responsible |
| `status` | ENUM | `not_started`, `in_progress`, `done`, `blocked` |
| `created_at` | TIMESTAMP | When created |

### Milestone Status Values

| Status | Meaning |
|--------|---------|
| `not_started` | Not yet begun |
| `in_progress` | Currently being worked on |
| `done` | Completed |
| `blocked` | Cannot proceed (dependency issue) |

---

## 5. clients — Client Organizations

Companies or individuals you work with.

### Columns

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Unique identifier |
| `name` | TEXT | Client name |
| `classification` | TEXT | Type of client (free text) |
| `notes` | TEXT | General notes |
| `created_at` | TIMESTAMP | When created |
| `updated_at` | TIMESTAMP | Last update |

---

## 6. tenders — Tender Submissions

Each tender opportunity you're pursuing.

### Columns

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Unique identifier |
| `client_id` | UUID | Who issued the tender |
| `project_id` | UUID | Related project (optional) |
| `reference` | TEXT | Tender reference number |
| `title` | TEXT | Tender title |
| `deadline_at` | TIMESTAMP | Submission deadline |
| `status` | ENUM | Current status (see below) |
| `value_amount` | DECIMAL | Estimated value |
| `value_currency` | TEXT | Currency (default: GBP) |
| `owner_profile_id` | UUID | Who manages this tender |
| `next_followup_at` | TIMESTAMP | Next action date |
| `created_at` | TIMESTAMP | When created |
| `updated_at` | TIMESTAMP | Last update |

### Tender Status Values

| Status | Meaning |
|--------|---------|
| `new` | Just received, not started |
| `in_review` | Being evaluated |
| `submitted` | Bid submitted |
| `awarded` | Won! |
| `lost` | Did not win |

---

## 7. tender_members — Tender Team

Who is working on each tender.

### Columns

| Column | Type | Description |
|--------|------|-------------|
| `tender_id` | UUID | Reference to tender |
| `profile_id` | UUID | Reference to user |
| `created_at` | TIMESTAMP | When added |

---

## 8. tender_comms_events — Communication Log

History of all communications about a tender.

### Columns

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Unique identifier |
| `tender_id` | UUID | Reference to tender |
| `actor_profile_id` | UUID | Who made the communication |
| `occurred_at` | TIMESTAMP | When it happened |
| `channel` | ENUM | `email`, `call`, `meeting`, `other` |
| `outcome` | TEXT | Result/response |
| `notes` | TEXT | Additional notes |
| `created_at` | TIMESTAMP | When recorded |

**Important:** This table is **append-only** — you cannot update or delete entries. This ensures a complete audit trail.

---

## 9. documents — Uploaded Files

Metadata about files stored in Supabase Storage.

### Columns

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Unique identifier |
| `doc_type` | TEXT | Type of document |
| `sensitivity` | ENUM | `confidential` or `restricted` |
| `project_id` | UUID | Related project (optional) |
| `tender_id` | UUID | Related tender (optional) |
| `title` | TEXT | Document title |
| `storage_bucket` | TEXT | Storage bucket name |
| `storage_path` | TEXT | Path within bucket |
| `mime_type` | TEXT | File type (e.g., "application/pdf") |
| `size_bytes` | BIGINT | File size |
| `uploaded_by_profile_id` | UUID | Who uploaded it |
| `created_at` | TIMESTAMP | When uploaded |
| `version_group_id` | UUID | For versioned documents |
| `version_number` | INTEGER | Version (1, 2, 3...) |

**Constraint:** Every document must have either a `project_id` OR a `tender_id`.

---

## 10. extraction_jobs — AI Processing Queue

Tracks document processing jobs (e.g., AI analysis).

### Columns

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Unique identifier |
| `document_id` | UUID | Which document to process |
| `job_type` | TEXT | Type of processing |
| `status` | TEXT | `pending`, `running`, `completed`, `failed` |
| `started_at` | TIMESTAMP | When processing started |
| `finished_at` | TIMESTAMP | When processing finished |
| `result_json` | JSONB | Processing results |
| `error_message` | TEXT | Error details (if failed) |

---

## 11. notifications — User Alerts

System notifications for users.

### Columns

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Unique identifier |
| `recipient_profile_id` | UUID | Who receives it |
| `severity` | ENUM | `info`, `warn`, `critical` |
| `type` | ENUM | Category (see below) |
| `message` | TEXT | Notification text |
| `entity_type` | ENUM | Related entity type |
| `entity_id` | UUID | Related entity ID |
| `ack_required` | BOOLEAN | Needs acknowledgment? |
| `acked_at` | TIMESTAMP | When acknowledged |
| `acked_by_profile_id` | UUID | Who acknowledged |
| `read_at` | TIMESTAMP | When read |
| `created_at` | TIMESTAMP | When created |

### Notification Types

| Type | Meaning |
|------|---------|
| `tender_deadline` | Tender deadline approaching |
| `milestone_due` | Project milestone due |
| `followup_due` | Follow-up action needed |
| `system` | System notification |

---

## 12. audit_log — Action History

Complete record of all changes in the system.

### Columns

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Unique identifier |
| `actor_profile_id` | UUID | Who performed action |
| `action` | ENUM | `create`, `update`, `delete`, `upload`, `ack` |
| `entity_type` | ENUM | What type of thing was affected |
| `entity_id` | UUID | Which specific record |
| `occurred_at` | TIMESTAMP | When it happened |
| `metadata` | JSONB | Additional details |

**Important:** This table is **append-only** — records cannot be modified or deleted.

### Example Audit Entries

| action | entity_type | metadata |
|--------|-------------|----------|
| `create` | `project` | `{"code": "PROJ-001"}` |
| `upload` | `document` | `{"path": "projects/abc/file.pdf"}` |
| `ack` | `notification` | `{"notification_id": "..."}` |

---

## Relationships Diagram

```
                    ┌─────────────┐
                    │   clients   │
                    └─────────────┘
                          │ (optional)
                          ▼
┌───────────┐      ┌─────────────┐      ┌────────────────┐
│  profiles │◄─────│  projects   │──────│project_members │
└───────────┘      └─────────────┘      └────────────────┘
      │                   │
      │                   ├──────────── project_milestones
      │                   │
      │                   └──────────── documents
      │
      │            ┌─────────────┐      ┌───────────────┐
      └───────────│   tenders   │──────│ tender_members │
                   └─────────────┘      └───────────────┘
                          │
                          ├──────────── tender_comms_events
                          │
                          └──────────── documents
```

---

## Common Queries

### Find all projects for a user
```sql
SELECT p.* 
FROM projects p
LEFT JOIN project_members pm ON p.id = pm.project_id
WHERE p.pm_profile_id = 'user-uuid'
   OR pm.profile_id = 'user-uuid';
```

### Get upcoming tender deadlines
```sql
SELECT * FROM tenders
WHERE deadline_at > now()
  AND deadline_at < now() + interval '7 days'
ORDER BY deadline_at;
```

### Recent audit log entries
```sql
SELECT al.*, p.display_name
FROM audit_log al
LEFT JOIN profiles p ON al.actor_profile_id = p.id
ORDER BY occurred_at DESC
LIMIT 50;
```

---

## Indexes

For performance, these indexes are created:

| Index | Table | Purpose |
|-------|-------|---------|
| `projects_client_idx` | projects | Find projects by client |
| `projects_pm_idx` | projects | Find projects by PM |
| `milestones_due_idx` | project_milestones | Sort by due date |
| `tenders_deadline_idx` | tenders | Sort by deadline |
| `tenders_owner_idx` | tenders | Find tenders by owner |
| `documents_project_idx` | documents | Find project documents |
| `documents_tender_idx` | documents | Find tender documents |
| `notifications_recipient_idx` | notifications | User's notifications |
| `audit_entity_idx` | audit_log | Find logs for entity |

---

## Running Migrations

To set up this database:

1. **Go to Supabase Dashboard** → SQL Editor
2. **Run migrations in order:**
   - `001_day1_schema.sql` — Creates tables
   - `002_day1_rls.sql` — Sets up security
   - `004_security_hotfix.sql` — Applies fixes

3. **For storage:**
   - Create bucket `mce-documents` manually
   - Apply policies from `003_storage_policies.sql` via UI

---

## Troubleshooting

### "duplicate key value violates unique constraint"
**Cause:** You're trying to create a record with a value that already exists (e.g., project code)
**Solution:** Use a different unique value

### "null value in column ... violates not-null constraint"
**Cause:** Required field is missing
**Solution:** Provide all required fields

### "insert or update on table ... violates foreign key constraint"
**Cause:** Referenced record doesn't exist
**Solution:** Create the referenced record first (e.g., create profile before project)
