# Tender CRUD Operations

<cite>
**Referenced Files in This Document**
- [app/tenders/page.tsx](file://app/tenders/page.tsx)
- [app/tenders/[id]/page.tsx](file://app/tenders/[id]/page.tsx)
- [app/tenders/new/page.tsx](file://app/tenders/new/page.tsx)
- [app/tenders/export/route.ts](file://app/tenders/export/route.ts)
- [app/ssr/tenders.ts](file://app/ssr/tenders.ts)
- [app/ssr/client.tsx](file://app/ssr/client.tsx)
- [app/ssr/profile.ts](file://app/ssr/profile.ts)
- [app/ssr/audit.ts](file://app/ssr/audit.ts)
- [app/ssr/comms.ts](file://app/ssr/comms.ts)
- [app/documents/page.tsx](file://app/documents/page.tsx)
- [supabase/migrations/001_day1_schema.sql](file://supabase/migrations/001_day1_schema.sql)
- [supabase/migrations/002_day1_rls.sql](file://supabase/migrations/002_day1_rls.sql)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)
10. [Appendices](#appendices)

## Introduction
This document describes the tender CRUD operations in the MCE Command Center system. It covers the complete tender lifecycle: listing, viewing, creating, modifying, and exporting. It also documents the tender detail view, the new tender creation form, modification workflows, access controls, and audit logging. Practical scenarios illustrate adding opportunities, updating statuses, and managing tenders.

## Project Structure
The tender feature spans Next.js app router pages, server-side actions, and Supabase database tables with Row Level Security (RLS) policies.

```mermaid
graph TB
subgraph "UI Pages"
L["app/tenders/page.tsx<br/>List tenders"]
D["app/tenders/[id]/page.tsx<br/>Tender detail"]
N["app/tenders/new/page.tsx<br/>Create tender"]
E["app/tenders/export/route.ts<br/>Export CSV"]
DOC["app/documents/page.tsx<br/>Upload documents"]
end
subgraph "Server Actions"
CT["app/ssr/tenders.ts<br/>createTender()"]
CL["app/ssr/client.tsx<br/>createServerSupabaseClient()"]
PR["app/ssr/profile.ts<br/>upsertProfile()"]
AU["app/ssr/audit.ts<br/>writeAudit()"]
CW["app/ssr/comms.ts<br/>addTenderComms()"]
end
subgraph "Database"
TBL["supabase/migrations/001_day1_schema.sql<br/>Tables & enums"]
RLS["supabase/migrations/002_day1_rls.sql<br/>Policies & functions"]
end
L --> CL
D --> CL
N --> CT
CT --> PR
CT --> AU
CT --> CL
DOC --> CL
CW --> PR
CW --> AU
CL --> RLS
CT --> RLS
CW --> RLS
E --> CL
```

**Diagram sources**
- [app/tenders/page.tsx](file://app/tenders/page.tsx#L1-L65)
- [app/tenders/[id]/page.tsx](file://app/tenders/[id]/page.tsx#L1-L130)
- [app/tenders/new/page.tsx](file://app/tenders/new/page.tsx#L1-L71)
- [app/tenders/export/route.ts](file://app/tenders/export/route.ts#L1-L25)
- [app/ssr/tenders.ts](file://app/ssr/tenders.ts#L1-L43)
- [app/ssr/client.tsx](file://app/ssr/client.tsx#L1-L25)
- [app/ssr/profile.ts](file://app/ssr/profile.ts#L1-L31)
- [app/ssr/audit.ts](file://app/ssr/audit.ts#L1-L29)
- [app/ssr/comms.ts](file://app/ssr/comms.ts#L1-L38)
- [app/documents/page.tsx](file://app/documents/page.tsx#L1-L90)
- [supabase/migrations/001_day1_schema.sql](file://supabase/migrations/001_day1_schema.sql#L1-L227)
- [supabase/migrations/002_day1_rls.sql](file://supabase/migrations/002_day1_rls.sql#L1-L348)

**Section sources**
- [app/tenders/page.tsx](file://app/tenders/page.tsx#L1-L65)
- [app/tenders/[id]/page.tsx](file://app/tenders/[id]/page.tsx#L1-L130)
- [app/tenders/new/page.tsx](file://app/tenders/new/page.tsx#L1-L71)
- [app/tenders/export/route.ts](file://app/tenders/export/route.ts#L1-L25)
- [app/ssr/tenders.ts](file://app/ssr/tenders.ts#L1-L43)
- [app/ssr/client.tsx](file://app/ssr/client.tsx#L1-L25)
- [app/ssr/profile.ts](file://app/ssr/profile.ts#L1-L31)
- [app/ssr/audit.ts](file://app/ssr/audit.ts#L1-L29)
- [app/ssr/comms.ts](file://app/ssr/comms.ts#L1-L38)
- [app/documents/page.tsx](file://app/documents/page.tsx#L1-L90)
- [supabase/migrations/001_day1_schema.sql](file://supabase/migrations/001_day1_schema.sql#L1-L227)
- [supabase/migrations/002_day1_rls.sql](file://supabase/migrations/002_day1_rls.sql#L1-L348)

## Core Components
- Tender listing page: Fetches and displays tenders with reference, deadline, status, and owner placeholder.
- Tender detail page: Loads a single tender and related communications and documents.
- New tender form: Client-side form to capture reference, deadline, and status; submits via server action.
- Server action createTender: Upserts profile, inserts tender, writes audit, and revalidates cache.
- Export endpoint: Generates CSV of tenders for download.
- Access control: RLS policies and helper functions govern visibility and editing.
- Audit trail: Centralized writeAudit service records all tender-related actions.

**Section sources**
- [app/tenders/page.tsx](file://app/tenders/page.tsx#L1-L65)
- [app/tenders/[id]/page.tsx](file://app/tenders/[id]/page.tsx#L1-L130)
- [app/tenders/new/page.tsx](file://app/tenders/new/page.tsx#L1-L71)
- [app/ssr/tenders.ts](file://app/ssr/tenders.ts#L1-L43)
- [app/tenders/export/route.ts](file://app/tenders/export/route.ts#L1-L25)
- [app/ssr/audit.ts](file://app/ssr/audit.ts#L1-L29)
- [supabase/migrations/002_day1_rls.sql](file://supabase/migrations/002_day1_rls.sql#L75-L113)

## Architecture Overview
The system integrates Clerk authentication with Supabase for data persistence and RLS. Server actions encapsulate sensitive operations and enforce permissions. The UI is rendered by Next.js app router pages, with server actions invoked from client components.

```mermaid
sequenceDiagram
participant U as "User"
participant UI as "New Tender Page<br/>app/tenders/new/page.tsx"
participant SA as "createTender<br/>app/ssr/tenders.ts"
participant PF as "upsertProfile<br/>app/ssr/profile.ts"
participant SC as "Supabase Client<br/>app/ssr/client.tsx"
participant DB as "Supabase DB"
participant AT as "Audit Log<br/>app/ssr/audit.ts"
U->>UI : Fill form (reference, deadline, status)
UI->>SA : Submit form
SA->>PF : Upsert profile
SA->>SC : Create client
SA->>DB : Insert tender with owner_profile_id
DB-->>SA : New tender record
SA->>AT : writeAudit(create, tender, id)
SA-->>UI : Revalidate "/tenders"
UI-->>U : Redirect to tenders list
```

**Diagram sources**
- [app/tenders/new/page.tsx](file://app/tenders/new/page.tsx#L1-L71)
- [app/ssr/tenders.ts](file://app/ssr/tenders.ts#L1-L43)
- [app/ssr/profile.ts](file://app/ssr/profile.ts#L1-L31)
- [app/ssr/client.tsx](file://app/ssr/client.tsx#L1-L25)
- [app/ssr/audit.ts](file://app/ssr/audit.ts#L1-L29)

## Detailed Component Analysis

### Tender Listing Interface
- Purpose: Display a paginated-like table of tenders sorted by deadline.
- Columns: Reference, Deadline, Status, Owner placeholder, Actions.
- Actions: Open link to detail view; Export CSV button; New Tender button.
- Data source: Selects id, reference, deadline_at, status, and owner display_name.
- Behavior: Shows empty state when no tenders.

```mermaid
flowchart TD
Start(["Render Tenders List"]) --> Query["Query tenders with select fields"]
Query --> Map["Map rows to table rows"]
Map --> Empty{"Any tenders?"}
Empty --> |No| ShowEmpty["Show 'No tenders' message"]
Empty --> |Yes| Render["Render table rows"]
Render --> End(["Done"])
ShowEmpty --> End
```

**Diagram sources**
- [app/tenders/page.tsx](file://app/tenders/page.tsx#L1-L65)

**Section sources**
- [app/tenders/page.tsx](file://app/tenders/page.tsx#L1-L65)

### Tender Detail View
- Purpose: Present comprehensive tender information and related data.
- Data loaded:
  - Tender summary: id, reference, title, deadline_at, status, value fields, next_followup_at, owner display_name.
  - Related communications: channel, outcome/notes, occurred_at, actor display_name.
  - Related documents: title, doc_type, sensitivity, created_at.
- UX: Back to tenders and upload document buttons; T-N countdown indicator.
- Error handling: Returns notFound if tender does not exist.

```mermaid
sequenceDiagram
participant U as "User"
participant D as "Tender Detail Page<br/>app/tenders/[id]/page.tsx"
participant C as "Supabase Client<br/>app/ssr/client.tsx"
participant DB as "Supabase DB"
U->>D : Navigate to /tenders/ : id
D->>C : Create client
D->>DB : Select tender by id
DB-->>D : Tender record
alt Tender not found
D-->>U : 404 Not Found
else Tender exists
par Load related data
D->>DB : Select communications for tender
D->>DB : Select documents for tender
and
DB-->>D : Communications
DB-->>D : Documents
end
D-->>U : Render detail view
end
```

**Diagram sources**
- [app/tenders/[id]/page.tsx](file://app/tenders/[id]/page.tsx#L1-L130)
- [app/ssr/client.tsx](file://app/ssr/client.tsx#L1-L25)

**Section sources**
- [app/tenders/[id]/page.tsx](file://app/tenders/[id]/page.tsx#L1-L130)

### New Tender Creation Form
- Purpose: Allow authorized users to create a new tender.
- Fields:
  - Reference (required)
  - Deadline (required, datetime-local)
  - Status (dropdown with predefined enum values)
- Submission: Client component posts to server action createTender.
- Validation: Basic HTML required attributes; server action validates and persists.

```mermaid
flowchart TD
Start(["Open Create Tender"]) --> Fill["Fill form fields"]
Fill --> Submit{"Submit"}
Submit --> |Click Save Tender| CallSA["Call createTender()"]
CallSA --> Upsert["Upsert profile"]
Upsert --> Insert["Insert tender with owner_profile_id"]
Insert --> Audit["Write audit log"]
Audit --> Reval["Revalidate tenders path"]
Reval --> Done(["Redirect to tenders list"])
```

**Diagram sources**
- [app/tenders/new/page.tsx](file://app/tenders/new/page.tsx#L1-L71)
- [app/ssr/tenders.ts](file://app/ssr/tenders.ts#L1-L43)
- [app/ssr/profile.ts](file://app/ssr/profile.ts#L1-L31)
- [app/ssr/audit.ts](file://app/ssr/audit.ts#L1-L29)

**Section sources**
- [app/tenders/new/page.tsx](file://app/tenders/new/page.tsx#L1-L71)
- [app/ssr/tenders.ts](file://app/ssr/tenders.ts#L1-L43)

### Tender Modification Workflows
- Current state: The UI surfaces a detail view and related data but does not expose edit forms for status, deadline, or owner in the provided files.
- Access control: RLS policies define who can edit tenders (admin roles, project editors, or owners).
- Audit trail: All create operations are audited; updates would similarly be audited if implemented.

Practical scenarios:
- Adding new opportunities: Use the new tender form to create entries; the system assigns the current authenticated user as owner.
- Updating tender statuses: If an update form were present, it would require appropriate permissions per RLS and trigger audit logging.
- Managing tender archives: Not implemented in the provided files; would require additional UI and backend logic aligned with RLS and audit.

**Section sources**
- [supabase/migrations/002_day1_rls.sql](file://supabase/migrations/002_day1_rls.sql#L98-L113)
- [app/ssr/audit.ts](file://app/ssr/audit.ts#L1-L29)

### Tender Deletion Procedures
- Current state: No explicit deletion UI or server action was identified in the provided files.
- Access control: RLS policies govern visibility and editing; deletion would require appropriate permissions.
- Audit trail: Deletion would be audited if implemented.
- Data cleanup: Cascading deletes apply to related communications and documents as per schema.

**Section sources**
- [supabase/migrations/001_day1_schema.sql](file://supabase/migrations/001_day1_schema.sql#L153-L162)
- [supabase/migrations/001_day1_schema.sql](file://supabase/migrations/001_day1_schema.sql#L164-L180)
- [supabase/migrations/002_day1_rls.sql](file://supabase/migrations/002_day1_rls.sql#L203-L222)

### Tender Export Functionality
- Purpose: Download a CSV of tenders containing reference, deadline, and status.
- Implementation: Server route queries tenders, formats CSV rows, and returns a downloadable file.

```mermaid
sequenceDiagram
participant U as "User"
participant E as "Export Route<br/>app/tenders/export/route.ts"
participant C as "Supabase Client<br/>app/ssr/client.tsx"
participant DB as "Supabase DB"
U->>E : Request CSV export
E->>C : Create client
E->>DB : Select tenders (reference, deadline_at, status)
DB-->>E : Tenders array
E-->>U : CSV file attachment
```

**Diagram sources**
- [app/tenders/export/route.ts](file://app/tenders/export/route.ts#L1-L25)
- [app/ssr/client.tsx](file://app/ssr/client.tsx#L1-L25)

**Section sources**
- [app/tenders/export/route.ts](file://app/tenders/export/route.ts#L1-L25)

### Tender Communication Logging
- Purpose: Record communications events against a tender (e.g., notes, outcomes).
- Implementation: Server action adds a communication event with channel, notes, and outcome; audits the event.

```mermaid
sequenceDiagram
participant U as "User"
participant UI as "Detail Page"
participant SA as "addTenderComms<br/>app/ssr/comms.ts"
participant PF as "upsertProfile<br/>app/ssr/profile.ts"
participant SC as "Supabase Client<br/>app/ssr/client.tsx"
participant DB as "Supabase DB"
participant AT as "Audit Log<br/>app/ssr/audit.ts"
U->>UI : Log communication
UI->>SA : Submit event
SA->>PF : Upsert profile
SA->>SC : Create client
SA->>DB : Insert tender_comms_event
DB-->>SA : Event record
SA->>AT : writeAudit(create, tender_comms, id)
SA-->>UI : Success
```

**Diagram sources**
- [app/ssr/comms.ts](file://app/ssr/comms.ts#L1-L38)
- [app/ssr/profile.ts](file://app/ssr/profile.ts#L1-L31)
- [app/ssr/client.tsx](file://app/ssr/client.tsx#L1-L25)
- [app/ssr/audit.ts](file://app/ssr/audit.ts#L1-L29)

**Section sources**
- [app/ssr/comms.ts](file://app/ssr/comms.ts#L1-L38)

### Document Upload Integration
- Purpose: Attach documents to tenders or projects via signed uploads.
- Implementation: Documents page supports selecting a tender ID and uploading files; the upload uses a signed URL.

```mermaid
sequenceDiagram
participant U as "User"
participant P as "Documents Page<br/>app/documents/page.tsx"
participant S as "Storage Service"
participant DB as "Supabase DB"
U->>P : Choose file and optional tender ID
P->>S : Prepare signed upload URL
S-->>P : Signed URL
P->>S : PUT file to signed URL
S-->>P : Upload success/failure
P->>DB : Store document metadata (if successful)
```

**Diagram sources**
- [app/documents/page.tsx](file://app/documents/page.tsx#L1-L90)

**Section sources**
- [app/documents/page.tsx](file://app/documents/page.tsx#L1-L90)

## Dependency Analysis
- UI depends on server actions for mutations and on Supabase client for queries.
- Server actions depend on profile upsert, Supabase client, and audit logging.
- Database enforces access control via RLS policies and helper functions.
- Enumerations and constraints are defined in schema migrations.

```mermaid
graph LR
UI_List["Tenders List<br/>app/tenders/page.tsx"] --> Client["Supabase Client<br/>app/ssr/client.tsx"]
UI_Detail["Tender Detail<br/>app/tenders/[id]/page.tsx"] --> Client
UI_Create["New Tender<br/>app/tenders/new/page.tsx"] --> CreateTender["createTender<br/>app/ssr/tenders.ts"]
CreateTender --> Profile["upsertProfile<br/>app/ssr/profile.ts"]
CreateTender --> Audit["writeAudit<br/>app/ssr/audit.ts"]
CreateTender --> Client
Export["Export CSV<br/>app/tenders/export/route.ts"] --> Client
Documents["Documents<br/>app/documents/page.tsx"] --> Client
Client --> RLS["RLS Policies<br/>supabase/migrations/002_day1_rls.sql"]
CreateTender --> RLS
Audit --> RLS
```

**Diagram sources**
- [app/tenders/page.tsx](file://app/tenders/page.tsx#L1-L65)
- [app/tenders/[id]/page.tsx](file://app/tenders/[id]/page.tsx#L1-L130)
- [app/tenders/new/page.tsx](file://app/tenders/new/page.tsx#L1-L71)
- [app/tenders/export/route.ts](file://app/tenders/export/route.ts#L1-L25)
- [app/ssr/tenders.ts](file://app/ssr/tenders.ts#L1-L43)
- [app/ssr/client.tsx](file://app/ssr/client.tsx#L1-L25)
- [app/ssr/profile.ts](file://app/ssr/profile.ts#L1-L31)
- [app/ssr/audit.ts](file://app/ssr/audit.ts#L1-L29)
- [app/documents/page.tsx](file://app/documents/page.tsx#L1-L90)
- [supabase/migrations/002_day1_rls.sql](file://supabase/migrations/002_day1_rls.sql#L1-L348)

**Section sources**
- [supabase/migrations/001_day1_schema.sql](file://supabase/migrations/001_day1_schema.sql#L1-L227)
- [supabase/migrations/002_day1_rls.sql](file://supabase/migrations/002_day1_rls.sql#L1-L348)

## Performance Considerations
- Queries: The listing and detail pages use targeted selects and single-row retrieval to minimize payload sizes.
- Parallelization: Detail page loads communications and documents concurrently to reduce latency.
- Indexes: Schema includes indexes on tenders deadline and owner for efficient sorting and filtering.
- Revalidation: Server action triggers path revalidation after creation to keep cached lists fresh.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
- Authentication errors: Profile upsert requires an authenticated Clerk user; ensure Clerk session is active.
- Permission denied: RLS policies restrict access; verify user role and ownership or membership.
- Audit failures: writeAudit requires a valid profile; confirm audit insertion succeeds.
- Export issues: Ensure the export route can query tenders and that the browser accepts downloads.

**Section sources**
- [app/ssr/profile.ts](file://app/ssr/profile.ts#L1-L31)
- [app/ssr/audit.ts](file://app/ssr/audit.ts#L1-L29)
- [supabase/migrations/002_day1_rls.sql](file://supabase/migrations/002_day1_rls.sql#L75-L113)

## Conclusion
The MCE Command Center implements a clear, secure tender lifecycle with robust access controls and audit logging. The listing and detail views provide essential information, while the creation flow ensures proper ownership and compliance. Future enhancements could include dedicated update and delete interfaces, expanded status transitions, and archive management, all aligned with existing RLS and audit mechanisms.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### Data Model Overview
The tender feature relies on several core tables and enumerations defined in the schema.

```mermaid
erDiagram
PROFILES {
uuid id PK
text clerk_user_id UK
text email
text display_name
enum role
timestamptz created_at
timestamptz updated_at
}
CLIENTS {
uuid id PK
text name
text classification
text notes
timestamptz created_at
timestamptz updated_at
}
PROJECTS {
uuid id PK
text code UK
text name
uuid client_id FK
uuid pm_profile_id FK
text stage
date start_date
date end_date
date dlp_date
integer progress_pct
enum status
text[] tags
timestamptz created_at
timestamptz updated_at
}
TENDERS {
uuid id PK
uuid client_id FK
uuid project_id FK
text reference
text title
timestamptz deadline_at
enum status
numeric value_amount
text value_currency
uuid owner_profile_id FK
timestamptz next_followup_at
timestamptz created_at
timestamptz updated_at
}
TENDER_MEMBERS {
uuid tender_id PK,FK
uuid profile_id PK,FK
timestamptz created_at
}
TENDER_COMMS_EVENTS {
uuid id PK
uuid tender_id FK
uuid actor_profile_id FK
timestamptz occurred_at
enum channel
text outcome
text notes
timestamptz created_at
}
DOCUMENTS {
uuid id PK
text doc_type
enum sensitivity
uuid project_id FK
uuid tender_id FK
text title
text storage_bucket
text storage_path
text mime_type
bigint size_bytes
uuid uploaded_by_profile_id FK
timestamptz created_at
uuid version_group_id
integer version_number
}
AUDIT_LOG {
uuid id PK
uuid actor_profile_id FK
enum action
enum entity_type
uuid entity_id
timestamptz occurred_at
jsonb metadata
}
PROFILES ||--o{ TENDERS : "owns"
CLIENTS ||--o{ TENDERS : "clients"
PROJECTS ||--o{ TENDERS : "projects"
PROFILES ||--o{ TENDER_MEMBERS : "members"
TENDERS ||--o{ TENDER_MEMBERS : "members"
PROFILES ||--o{ TENDER_COMMS_EVENTS : "actors"
TENDERS ||--o{ TENDER_COMMS_EVENTS : "events"
PROFILES ||--o{ DOCUMENTS : "uploaded"
PROJECTS ||--o{ DOCUMENTS : "projects"
TENDERS ||--o{ DOCUMENTS : "tenders"
PROFILES ||--o{ AUDIT_LOG : "actors"
```

**Diagram sources**
- [supabase/migrations/001_day1_schema.sql](file://supabase/migrations/001_day1_schema.sql#L76-L227)

### Access Control Matrix (Selected)
- Tender view/edit: Admin roles, project editors, or owners; members inherit permissions via project membership.
- Tender creation: Requires admin roles and sets current user as owner.
- Communication logging: Requires viewer-level access to tender and actor identity.
- Document operations: Require appropriate project or tender permissions plus uploader identity.

**Section sources**
- [supabase/migrations/002_day1_rls.sql](file://supabase/migrations/002_day1_rls.sql#L75-L113)
- [supabase/migrations/002_day1_rls.sql](file://supabase/migrations/002_day1_rls.sql#L203-L222)
- [supabase/migrations/002_day1_rls.sql](file://supabase/migrations/002_day1_rls.sql#L245-L257)