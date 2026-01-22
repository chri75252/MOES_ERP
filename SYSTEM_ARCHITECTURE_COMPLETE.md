# MCE Command Center — System Architecture Guide

**Last Updated:** 2026-01-21  
**Version:** 2.0

---

## For Non-Technical Readers

This document explains how the MCE Command Center works. Think of it like a blueprint for a building — it shows how all the rooms connect and what each room does.

---

## 1. What is MCE Command Center?

MCE Command Center is a web application for managing construction projects and tenders. It allows you to:

- **Track Projects** — Create and monitor construction projects
- **Manage Tenders** — Handle tender submissions and evaluations
- **Upload Documents** — Store important files securely
- **Audit Trail** — Keep a record of all actions

---

## 2. Technology Stack (The Tools We Use)

| Tool | What It Does | Why We Use It |
|------|--------------|---------------|
| **Next.js 15** | The main framework | Fast, modern, handles both frontend and backend |
| **React 18** | User interface | Interactive, component-based design |
| **TypeScript** | Programming language | Catches errors before they happen |
| **Clerk** | User authentication | Handles login, signup, passwords securely |
| **Supabase** | Database + Storage | PostgreSQL database with built-in security |
| **Tailwind CSS** | Styling | Makes the app look nice |

### Simple Diagram

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│             │      │             │      │             │
│    USER     │ ───► │   CLERK     │ ───► │  NEXT.JS    │
│  (Browser)  │      │   (Login)   │      │   (App)     │
│             │      │             │      │             │
└─────────────┘      └─────────────┘      └─────────────┘
                                                │
                                                ▼
                                         ┌─────────────┐
                                         │             │
                                         │  SUPABASE   │
                                         │ (Database)  │
                                         │             │
                                         └─────────────┘
```

---

## 3. Folder Structure

Here's what each folder contains:

```
mce-command-center/
├── app/                      # 📱 All the pages and logic
│   ├── ssr/                  # 🔧 Server-side code (database operations)
│   │   ├── client.tsx       # Creates database connections
│   │   ├── projects.ts      # Project operations (create, read)
│   │   ├── tenders.ts       # Tender operations
│   │   ├── documents.ts     # Document upload/download
│   │   ├── profile.ts       # User profile management
│   │   └── audit.ts         # Logging all actions
│   │
│   ├── dashboard/            # 📊 Main dashboard page
│   ├── projects/             # 📁 Project pages
│   │   ├── page.tsx         # List all projects
│   │   ├── new/             # Create new project
│   │   │   └── page.tsx
│   │   └── [id]/            # View specific project
│   │       └── page.tsx
│   ├── tenders/              # 📋 Tender pages (similar structure)
│   ├── documents/            # 📄 Document upload page
│   ├── notifications/        # 🔔 Notifications page
│   ├── sign-in/              # 🔐 Login page
│   └── sign-up/              # 📝 Registration page
│
├── supabase/                 # 🗄️ Database setup files
│   └── migrations/           
│       ├── 001_day1_schema.sql      # Tables and columns
│       ├── 002_day1_rls.sql         # Security rules
│       ├── 003_storage_policies.sql  # File storage security
│       └── 004_security_hotfix.sql   # Bug fixes
│
├── backup/                   # 💾 Backup copies of fixed files
├── public/                   # 🖼️ Static assets (images, icons)
├── .env.local               # 🔑 Your secret keys (DO NOT SHARE!)
├── package.json             # 📦 Dependencies list
├── middleware.ts            # 🛡️ Route protection
└── guide.txt                # 📖 Setup instructions
```

---

## 4. How Authentication Works

### The Flow (Step by Step)

1. **User visits the app** → Middleware checks if they're logged in
2. **Not logged in?** → Redirect to Clerk's sign-in page
3. **User enters email/password** → Clerk verifies credentials
4. **Clerk creates a JWT token** → A secure "pass" proving who you are
5. **Token sent to Supabase** → Database knows your identity
6. **Security rules applied** → You only see what you're allowed to see

### Visual Flow

```
┌──────────┐    ┌───────────┐    ┌───────────┐    ┌──────────┐
│  Visit   │───►│ Middleware│───►│  Clerk    │───►│ Supabase │
│  /page   │    │  Check    │    │  Login    │    │ Database │
└──────────┘    └───────────┘    └───────────┘    └──────────┘
                     │                                  │
                     └──── JWT Token ──────────────────►│
```

### JWT Template

Clerk creates a special token for Supabase containing:
```json
{
  "sub": "user_abc123",        // Your Clerk user ID
  "email": "you@example.com",  // Your email
  "aud": "authenticated"       // Required by Supabase
}
```

---

## 5. Database Structure

### Tables Overview

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `profiles` | User information | id, clerk_user_id, email, role |
| `projects` | Construction projects | id, code, name, status, pm_profile_id |
| `tenders` | Tender submissions | id, reference, issuer, deadline |
| `documents` | Uploaded files | id, title, storage_path, project_id |
| `audit_log` | Action history | action, entity_type, entity_id |

### Relationships (How Tables Connect)

```
profiles ──────────────────────────────────────┐
    │                                          │
    ├── projects (pm_profile_id)               │
    │       │                                  │
    │       ├── project_members                │
    │       ├── milestones                     │
    │       └── documents ─────────────────────┘
    │
    └── tenders (owner_profile_id)
            │
            ├── tender_members
            ├── tender_comms_events
            └── documents
```

### User Roles

| Role | What They Can Do |
|------|------------------|
| `super_admin` | Everything — full access |
| `chairman_vp` | View all, approve major decisions |
| `dept_head` | Manage their department's projects |
| `finance` | View financials, approve budgets |
| `pm` | Manage assigned projects |
| `engineer` | Work on assigned projects |
| `viewer` | View only (default for new users) |

---

## 6. Security (Row Level Security / RLS)

### What is RLS?

Row Level Security makes sure users only see data they're allowed to see. Think of it like having different access cards for different rooms in a building.

### How It Works

When you query data:
```sql
SELECT * FROM projects;
```

Supabase automatically adds security checks:
```sql
SELECT * FROM projects
WHERE you_are_admin()
   OR you_are_project_manager(project_id)
   OR you_are_project_member(project_id);
```

### Security Functions

| Function | Returns |
|----------|---------|
| `current_clerk_user_id()` | Your Clerk user ID from the JWT |
| `current_profile_id()` | Your profile UUID in the database |
| `current_profile_role()` | Your role (super_admin, pm, etc.) |
| `is_admin_role()` | TRUE if you have admin privileges |
| `can_view_project(id)` | TRUE if you can view this project |
| `can_edit_project(id)` | TRUE if you can edit this project |
| `can_view_tender(id)` | TRUE if you can view this tender |
| `can_edit_tender(id)` | TRUE if you can edit this tender |

---

## 7. Server Actions (app/ssr/)

These files contain the "backend" logic that runs on the server.

### client.tsx — Database Connections

Creates connections to Supabase:

```typescript
// For normal operations (respects RLS)
createServerSupabaseClient()

// For internal operations (bypasses RLS)
createServiceSupabaseClient()
```

**Important:** Service role client is used for:
- Audit logging (internal records)
- Document uploads (missing INSERT policies)
- Data fetching (workaround for RLS issues)

### projects.ts — Project Operations

```typescript
// Create a new project
createProject({ code, name, description, status })

// Returns the new project's ID
```

### documents.ts — Document Operations

```typescript
// Prepare for upload (creates DB record, returns signed URL)
prepareDocumentUpload({ fileName, fileType, fileSize, projectId })

// Create signed download URL
createSignedDownload(referenceId)
```

### audit.ts — Audit Logging

```typescript
// Log any action
writeAudit(action, entityType, entityId, metadata)

// Examples:
writeAudit("create", "project", "uuid-123", { code: "PROJ-001" })
writeAudit("upload", "document", "uuid-456", { path: "files/doc.pdf" })
```

---

## 8. File Storage

### How Documents Are Stored

1. **User selects a file** → Browser reads file info
2. **Server creates database record** → Document entry created
3. **Server creates signed URL** → Temporary upload link (valid 60 seconds)
4. **Browser uploads directly to Supabase Storage** → Secure, fast
5. **Database record updated** → Links to actual file

### Storage Bucket

- **Name:** `mce-documents`
- **Public:** No (requires authentication)
- **Path format:** `projects/{project-id}/{timestamp}-{filename}`

### Security

Files are protected by:
1. Signed URLs (time-limited access)
2. Database record verification
3. Project/tender membership checks

---

## 9. Middleware (Route Protection)

The `middleware.ts` file protects pages from unauthorized access:

```typescript
// These routes require login
const isProtectedRoute = ["/dashboard", "/projects", "/tenders", "/documents"];

// If not logged in, redirect to sign-in
if (isProtectedRoute && !userId) {
  return redirectToSignIn();
}
```

### Public vs Protected Routes

| Route | Access |
|-------|--------|
| `/` | Public (landing page) |
| `/sign-in` | Public |
| `/sign-up` | Public |
| `/dashboard` | Protected (login required) |
| `/projects` | Protected |
| `/tenders` | Protected |
| `/documents` | Protected |
| `/notifications` | Protected |

---

## 10. Data Flow Examples

### Example 1: Creating a Project

```
1. User fills form on /projects/new
           │
           ▼
2. Form calls createProject() server action
           │
           ▼
3. Server gets user's profile ID
           │
           ▼
4. Server inserts into 'projects' table
           │
           ▼
5. Server writes to audit_log
           │
           ▼
6. Server returns success
           │
           ▼
7. Client redirects to /projects
           │
           ▼
8. Projects list shows new project
```

### Example 2: Uploading a Document

```
1. User selects file on /documents
           │
           ▼
2. Client calls prepareDocumentUpload()
           │
           ▼
3. Server creates document record
           │
           ▼
4. Server creates extraction_job record
           │
           ▼
5. Server creates signed upload URL
           │
           ▼
6. Server writes to audit_log
           │
           ▼
7. Returns signed URL to client
           │
           ▼
8. Client uploads file directly to Supabase Storage
           │
           ▼
9. Success message shown
```

---

## 11. Common Operations

### How to Add a New User

1. User signs up via Clerk
2. On first app access, profile is auto-created
3. Default role is `viewer`
4. Admin changes role in Supabase → Table Editor → profiles

### How to Change User Permissions

1. Go to Supabase Dashboard
2. Click Table Editor → profiles
3. Find the user row
4. Change the `role` column
5. User refreshes their browser

### How to View Audit Logs

1. Go to Supabase Dashboard
2. Click Table Editor → audit_log
3. Sort by `created_at` descending
4. View all actions taken in the system

---

## 12. Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key | `pk_test_...` |
| `CLERK_SECRET_KEY` | Clerk secret key | `sk_test_...` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://abc.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_KEY` | Supabase anon key | `eyJhbGci...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role | `eyJhbGci...` |
| `NEXT_PUBLIC_APP_URL` | Your app URL | `http://localhost:3000` |

---

## 13. Troubleshooting Guide

### Problem: "Profile not found"
**Cause:** Old code issue (now fixed)
**Solution:** Make sure you have the latest code

### Problem: Empty project list
**Cause:** RLS blocking or caching
**Solution:** Run migration `004_security_hotfix.sql`, refresh page

### Problem: Upload fails
**Cause:** Invalid UUID in Project ID field
**Solution:** Use the actual project UUID (from URL), not project code

### Problem: "Unauthorized" errors
**Cause:** JWT not configured properly
**Solution:** Check JWT template exists in Clerk → JWT Templates

---

## 14. Technical Reference

### Dependencies (package.json)

```json
{
  "@clerk/nextjs": "^6.x",      // Authentication
  "@supabase/supabase-js": "^2.x", // Database client
  "next": "^15.x",              // Framework
  "react": "^18.x"              // UI library
}
```

### Key Imports

```typescript
// Authentication
import { auth, currentUser } from "@clerk/nextjs/server";

// Database
import { createClient } from "@supabase/supabase-js";

// Navigation
import { useRouter } from "next/navigation";
```

---

## Appendix: Migration Files Summary

### 001_day1_schema.sql
- Creates all database tables
- Sets up data types (enums)
- Creates foreign key relationships

### 002_day1_rls.sql
- Enables Row Level Security on all tables
- Creates security helper functions
- Defines access policies

### 003_storage_policies.sql
- Reference for storage bucket policies
- Must be applied manually via Supabase UI

### 004_security_hotfix.sql
- Fixes function security vulnerabilities
- Adds missing `extraction_jobs` policies
- Safe to run multiple times (idempotent)
