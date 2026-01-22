# MCE Command Center — Quick Start Guide

**Last Updated:** 2026-01-21

---

## For First-Time Users

This guide shows you how to perform common tasks in the MCE Command Center.

---

## Getting Started (After Setup)

### 1. Sign In
1. Go to your app URL (e.g., `http://localhost:3000`)
2. Click **Sign In**
3. Enter your email and password
4. You'll be redirected to the **Dashboard**

### 2. Understand the Dashboard

The dashboard shows:
- **Active Projects** — Number of projects in progress
- **Tenders Due** — Upcoming tender deadlines (14/7/3/1/today)
- **Upcoming Milestones** — Next 10 project milestones
- **Recent Notifications** — System alerts

---

## Common Tasks

### ➕ Create a New Project

1. Click **Projects** in the top menu
2. Click **+ New Project** button
3. Fill in the form:
   - **Code** — Unique project code (e.g., "PROJ-001")
   - **Name** — Project name
   - **Status** — Usually "Active" for new projects
4. Click **Save Project**
5. You'll be redirected to the projects list

**Troubleshooting:**
- If you see "duplicate key" error, the code is already used
- Choose a different unique code

---

### 📋 Create a New Tender

1. Click **Tenders** in the top menu
2. Click **+ New Tender** button
3. Fill in the form:
   - **Reference** — Tender reference number
   - **Title** — Tender name
   - **Issuer** — Who issued the tender
   - **Deadline** — Submission deadline (date and time)
   - **Project (optional)** — Link to a project if applicable
4. Click **Save Tender**

---

### 📄 Upload a Document

1. Click **Documents** in the top menu
2. In the upload form:
   - **Project ID** — Copy the project's UUID (see below)
   - **Tender ID** — (optional) Copy the tender's UUID
   - **Select file** — Click "Choose File"
3. Click **Upload Document**

**How to find a UUID:**
1. Go to Projects or Tenders page
2. Click on the item to view it
3. Look at the URL: `/projects/55eaa703-af3e-4c04-951a-1a6ae3cb4214`
4. The long string after `/projects/` is the UUID

**⚠️ Important:** Enter the full UUID, not project codes like "PROJ-001"

---

### 👤 Change Your Role (Admin Only)

If you're an admin, you can change user roles:

1. Go to **Supabase Dashboard** (supabase.com → your project)
2. Click **Table Editor** (left sidebar)
3. Click **profiles**
4. Find the user's row (by email)
5. Click the **role** dropdown
6. Select the new role (e.g., `pm`, `super_admin`)
7. Press Enter to save

The user needs to refresh their browser to see the change.

---

### 🔔 View Notifications

1. Click **Notifications** in the top menu
2. You'll see all your notifications
3. Click on a notification to view details
4. For acknowledgment-required notifications, click **Acknowledge**

---

### 📊 Export Projects to CSV

1. Click **Projects** in the top menu
2. Click **Export CSV** button
3. A CSV file will download with all project data

---

## Navigation Reference

| Menu Item | What It Shows |
|-----------|---------------|
| **Dashboard** | Overview with stats and recent items |
| **Projects** | List of all projects you can access |
| **Tenders** | List of all tenders you can access |
| **Documents** | Upload new documents |
| **Notifications** | System notifications and alerts |

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `F5` | Refresh the page |
| `Ctrl+K` / `Cmd+K` | Quick search (if enabled) |
| `Esc` | Close modals/dialogs |

---

## Understanding UUIDs

Throughout the app, you'll see UUIDs (Universally Unique Identifiers). They look like:

```
55eaa703-af3e-4c04-951a-1a6ae3cb4214
```

- They're 36 characters with dashes
- Format: 8-4-4-4-12 characters
- Each record has a unique UUID
- You'll need UUIDs when linking data (e.g., uploading documents to a project)

### Where to Find UUIDs

| Record Type | Where to Find |
|-------------|---------------|
| Project | In the URL when viewing: `/projects/{uuid}` |
| Tender | In the URL when viewing: `/tenders/{uuid}` |
| User/Profile | In Supabase → Table Editor → profiles |
| Document | In Supabase → Table Editor → documents |

---

## Error Messages and Solutions

| Error | Meaning | Solution |
|-------|---------|----------|
| "Profile not found" | User profile issue | Sign out and sign back in |
| "An error occurred during upload" | Document upload failed | Check Project ID is a valid UUID |
| "Invalid input syntax for type uuid" | Invalid UUID format | Use full UUID, not project code |
| "Duplicate key" | Record already exists | Use a different value |

---

## Tips for Success

1. **Use descriptive project codes** — Makes them easy to find later
2. **Set realistic deadlines** — The system will remind you
3. **Upload documents to projects** — Keeps everything organized
4. **Check notifications daily** — Don't miss important deadlines
5. **Use the audit log** — See who changed what and when

---

## Getting Help

1. **Check the guides:**
   - `guide.txt` — Full setup instructions
   - `ISSUE_RESOLUTION_REPORT.md` — Known issues and fixes
   - `SYSTEM_ARCHITECTURE_COMPLETE.md` — Technical details

2. **Common issues:**
   - Refresh the page if data looks stale
   - Sign out and back in if permissions seem wrong
   - Check Supabase logs if something fails

3. **For developers:**
   - Server logs show detailed error messages
   - Check console for frontend errors
   - Run `npm run dev` for development mode
