# MCE Command Center — Migration Files Guide

**Last Updated:** 2026-01-21

---

## What Are Migrations?

Migration files are SQL scripts that create and modify your database structure. Think of them like blueprints — they tell the database what tables to create and how to connect them.

---

## Migration Files Overview

| File | Purpose | Order |
|------|---------|-------|
| `001_day1_schema.sql` | Creates all tables and columns | Run 1st |
| `002_day1_rls.sql` | Sets up security rules | Run 2nd |
| `003_storage_policies.sql` | Storage security (manual) | Manual setup |
| `004_security_hotfix.sql` | Bug fixes | Run 3rd |

---

## How to Run Migrations

### Step 1: Open SQL Editor
1. Go to [supabase.com](https://supabase.com) and log in
2. Select your project
3. Click **SQL Editor** (left sidebar, looks like `</>`)

### Step 2: Run Each Migration

**For each migration file (except 003):**

1. Click **+ New query** button
2. In your code editor, open the migration file
3. **Select ALL** the text (Ctrl+A / Cmd+A)
4. **Copy** (Ctrl+C / Cmd+C)
5. Go back to Supabase SQL Editor
6. **Paste** into the query box (Ctrl+V / Cmd+V)
7. Click **Run** button
8. Wait for **"Success. No rows returned"** message ✅
9. Repeat for the next migration

---

## Migration Details

### 001_day1_schema.sql

**What it does:**
- Enables the pgcrypto extension (for UUID generation)
- Creates custom data types (enums):
  - `profile_role` — User permission levels
  - `project_status` — Project states (active, on_hold, completed)
  - `milestone_status` — Milestone states
  - `tender_status` — Tender states
  - `tender_channel` — Communication channels
  - `document_sensitivity` — Document access levels
  - `notification_severity` — Alert levels
  - `audit_action` — Types of actions logged
  - `audit_entity` — Types of records tracked

- Creates tables:
  - `profiles` — User accounts
  - `clients` — Client organizations
  - `projects` — Construction projects
  - `project_members` — Project team assignments
  - `project_milestones` — Project deadlines
  - `tenders` — Tender opportunities
  - `tender_members` — Tender team assignments
  - `tender_comms_events` — Communication history
  - `documents` — Uploaded files
  - `extraction_jobs` — AI processing queue
  - `notifications` — User alerts
  - `audit_log` — Action history

- Creates indexes for performance

**Safe to run again?** Yes — Uses `IF NOT EXISTS`

---

### 002_day1_rls.sql

**What it does:**
- Enables Row Level Security (RLS) on all tables
- Creates helper functions:
  - `current_clerk_user_id()` — Gets your Clerk ID from JWT
  - `current_profile_id()` — Gets your database profile ID
  - `current_profile_role()` — Gets your permission level
  - `is_admin_role()` — Checks if you're an admin
  - `can_view_project()` — Checks project access
  - `can_edit_project()` — Checks project edit rights
  - `can_view_tender()` — Checks tender access
  - `can_edit_tender()` — Checks tender edit rights
  - `is_document_owner()` — Checks document ownership

- Creates security policies for each table
- Prevents modifications to audit tables (append-only)

**Safe to run again?** Mostly — May show some errors on duplicate policies, but this is OK

---

### 003_storage_policies.sql

**What it does:**
- Contains reference SQL for storage bucket policies
- **DO NOT** run this in SQL Editor — it will fail!

**How to use:**
1. Go to Supabase → **Storage**
2. Create bucket named `mce-documents`
3. Click **Policies** tab
4. Create policies manually using the SQL as reference

**Policies to create:**
1. **SELECT** — Who can download files
2. **INSERT** — Who can upload files
3. **DELETE** — Who can delete files (admins only)

See main `guide.txt` for step-by-step policy creation.

---

### 004_security_hotfix.sql

**What it does:**
- Fixes security vulnerabilities in functions
- Adds `SET search_path = public` to all functions
- Drops and recreates `extraction_jobs` policies
- Fixes the upload functionality

**Why it's needed:**
- Earlier functions had a security issue with search_path
- The `extraction_jobs` table had blocking policies
- This fixes document upload errors

**Safe to run again?** Yes — Uses `CREATE OR REPLACE` and `DROP IF EXISTS`

---

## Common Migration Errors

### "relation already exists"
**Cause:** Table was already created
**Solution:** This is OK — the migration uses `IF NOT EXISTS`

### "policy already exists"
**Cause:** Security policy already created
**Solution:** This is OK — you can ignore this error

### "function already exists"
**Cause:** Function was created before
**Solution:** This is OK — `CREATE OR REPLACE` handles this

### "permission denied"
**Cause:** Wrong user or missing permissions
**Solution:** Make sure you're logged in as project owner

### "syntax error at or near 'storage'"
**Cause:** Trying to run 003_storage_policies.sql in SQL Editor
**Solution:** Don't run this file — create storage policies manually

---

## Verifying Migrations Worked

After running migrations, verify in Supabase:

### Check Tables Exist
1. Go to **Table Editor** (left sidebar)
2. You should see all tables:
   - profiles
   - clients
   - projects
   - project_members
   - project_milestones
   - tenders
   - tender_members
   - tender_comms_events
   - documents
   - extraction_jobs
   - notifications
   - audit_log

### Check Functions Exist
1. Go to **Database** → **Functions**
2. Look for:
   - current_clerk_user_id
   - current_profile_id
   - is_admin_role
   - can_view_project
   - etc.

### Check Policies Exist
1. Go to **Authentication** → **Policies**
2. Each table should have multiple policies listed

---

## Resetting the Database (Caution!)

If you need to start fresh:

⚠️ **WARNING: This deletes ALL data!**

```sql
-- Run in SQL Editor to drop all tables
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS extraction_jobs CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS tender_comms_events CASCADE;
DROP TABLE IF EXISTS tender_members CASCADE;
DROP TABLE IF EXISTS tenders CASCADE;
DROP TABLE IF EXISTS project_milestones CASCADE;
DROP TABLE IF EXISTS project_members CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Then run migrations again
```

---

## Need Help?

1. Check error messages carefully
2. Try running the same migration again (most are safe to re-run)
3. Check Supabase logs for detailed errors
4. See `ISSUE_RESOLUTION_REPORT.md` for known issues
