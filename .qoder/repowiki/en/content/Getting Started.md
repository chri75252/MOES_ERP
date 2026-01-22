# Getting Started

<cite>
**Referenced Files in This Document**
- [README.md](file://README.md)
- [package.json](file://package.json)
- [.env.local.example](file://.env.local.example)
- [scripts/setup-supabase.js](file://scripts/setup-supabase.js)
- [supabase/migrations/001_day1_schema.sql](file://supabase/migrations/001_day1_schema.sql)
- [supabase/migrations/002_day1_rls.sql](file://supabase/migrations/002_day1_rls.sql)
- [supabase/migrations/003_storage_policies.sql](file://supabase/migrations/003_storage_policies.sql)
- [middleware.ts](file://middleware.ts)
- [next.config.js](file://next.config.js)
- [app/layout.tsx](file://app/layout.tsx)
- [app/page.tsx](file://app/page.tsx)
- [app/dashboard/page.tsx](file://app/dashboard/page.tsx)
- [app/projects/page.tsx](file://app/projects/page.tsx)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Quick Start](#quick-start)
5. [Supabase Setup](#supabase-setup)
6. [Clerk Setup](#clerk-setup)
7. [Environment Variables](#environment-variables)
8. [Application Architecture Overview](#application-architecture-overview)
9. [Troubleshooting Guide](#troubleshooting-guide)
10. [Conclusion](#conclusion)

## Introduction
MCE Command Center is a production-credible internal tracker built with Next.js App Router, Clerk (authentication), and Supabase (PostgreSQL, Row Level Security, and Storage). It provides secure access control, CRUD operations for Projects and Tenders, document upload with signed URLs, milestone tracking, notifications with acknowledgments, and audit logging.

## Prerequisites
Before installing MCE Command Center, ensure you have:
- Node.js 18 or later installed on your development machine
- A Supabase project with PostgreSQL and Storage enabled
- A Clerk application configured for authentication

These requirements are essential for the application to build and run correctly.

**Section sources**
- [README.md](file://README.md#L18-L23)

## Installation
Follow these steps to install and prepare the application locally:

1. Install dependencies
   - Run the package manager install command to fetch all required packages.
   - This installs Next.js, Clerk SDK, Supabase client, and development tools.

2. Prepare environment configuration
   - Copy the example environment file to create your local configuration.
   - Fill in the required environment variables as described in the Environment Variables section.

3. Apply Supabase migrations
   - Run the Supabase migration script to create tables, enable RLS, and configure storage policies.
   - Alternatively, apply the migrations manually in the Supabase SQL editor in the specified order.

4. Start the development server
   - Launch the Next.js development server.
   - Access the application at http://localhost:3000.

These steps align with the Quick Start instructions and ensure your environment is ready for development.

**Section sources**
- [README.md](file://README.md#L24-L40)
- [package.json](file://package.json#L5-L10)
- [scripts/setup-supabase.js](file://scripts/setup-supabase.js#L79-L91)

## Quick Start
To quickly get the application running:

1. Install dependencies
   - Use your package manager to install all dependencies.

2. Configure environment variables
   - Copy the example environment file and add your Clerk and Supabase credentials.

3. Apply migrations
   - Run the migration script to set up database tables, RLS policies, and storage policies.

4. Start the development server
   - Run the development command to launch the app.
   - Open http://localhost:3000 in your browser.

This workflow follows the documented Quick Start process and ensures a smooth developer experience.

**Section sources**
- [README.md](file://README.md#L24-L40)

## Supabase Setup
MCE Command Center requires a Supabase project with Postgres and Storage. Complete the following setup steps:

1. Create a Supabase project
   - Provision a new project in the Supabase dashboard.

2. Apply migrations in order
   - Use the Supabase SQL editor to run the following migrations in sequence:
     - Schema migration: creates all Day-1 tables and indexes
     - RLS migration: enables Row Level Security and role-based policies
     - Storage policies: configures storage RLS and document access controls

3. Configure Storage bucket
   - Create a private bucket named mce-documents.
   - Ensure storage policies are applied so documents can be accessed securely.

These steps establish the database schema, enforce access control, and enable document management with signed URLs.

**Section sources**
- [README.md](file://README.md#L42-L63)
- [supabase/migrations/001_day1_schema.sql](file://supabase/migrations/001_day1_schema.sql#L1-L227)
- [supabase/migrations/002_day1_rls.sql](file://supabase/migrations/002_day1_rls.sql#L1-L348)
- [supabase/migrations/003_storage_policies.sql](file://supabase/migrations/003_storage_policies.sql#L1-L55)

## Clerk Setup
Configure Clerk to handle authentication for MCE Command Center:

1. Create a Clerk application
   - Set up a new application in the Clerk dashboard.

2. Enable Supabase integration
   - Connect Clerk to your Supabase project for unified authentication.

3. Configure redirect URLs
   - Add the following URLs to Clerk’s allowed redirect domains:
     - http://localhost:3000
     - http://localhost:3000/sign-in
     - http://localhost:3000/sign-up

4. Copy keys into environment variables
   - Retrieve the publishable and secret keys from Clerk.
   - Paste them into your .env.local file as described in Environment Variables.

These steps ensure seamless authentication and redirect behavior during development and deployment.

**Section sources**
- [README.md](file://README.md#L64-L73)

## Environment Variables
Configure your local environment by copying the example file and adding your credentials:

1. Copy the example file
   - Duplicate the example environment file to create your local configuration.

2. Add Clerk keys
   - Provide the Clerk publishable and secret keys.

3. Add Supabase keys
   - Provide the Supabase URL, anonymous/public key, and service role key.

4. Set application URL
   - Define the public application URL for redirects and links.

5. Optional Clerk URLs
   - Configure sign-in and sign-up URLs if you customized them.

Ensure all variables are present and valid to avoid build-time errors.

**Section sources**
- [README.md](file://README.md#L74-L91)
- [.env.local.example](file://.env.local.example#L1-L11)

## Application Architecture Overview
MCE Command Center integrates Clerk for authentication and Supabase for data and storage. The application uses Next.js App Router with server-side rendering and middleware-based protection.

```mermaid
graph TB
subgraph "Client"
Browser["Browser"]
end
subgraph "Next.js App"
Layout["App Layout<br/>ClerkProvider"]
Middleware["Middleware<br/>Clerk Auth Guard"]
Pages["Pages<br/>Dashboard, Projects, etc."]
end
subgraph "Authentication"
Clerk["Clerk"]
end
subgraph "Data & Storage"
Supabase["Supabase"
subgraph "PostgreSQL"
Tables["Tables<br/>profiles, projects,<br/>tenders, documents"]
Policies["RLS Policies"]
end
subgraph "Storage"
Bucket["Bucket: mce-documents"]
Policies2["Storage Policies"]
end
end
end
Browser --> Layout
Layout --> Middleware
Middleware --> Clerk
Middleware --> Pages
Pages --> Supabase
Supabase --> Tables
Supabase --> Policies
Supabase --> Bucket
Supabase --> Policies2
```

**Diagram sources**
- [app/layout.tsx](file://app/layout.tsx#L1-L46)
- [middleware.ts](file://middleware.ts#L1-L20)
- [supabase/migrations/001_day1_schema.sql](file://supabase/migrations/001_day1_schema.sql#L76-L227)
- [supabase/migrations/002_day1_rls.sql](file://supabase/migrations/002_day1_rls.sql#L115-L348)
- [supabase/migrations/003_storage_policies.sql](file://supabase/migrations/003_storage_policies.sql#L1-L55)

## Troubleshooting Guide
Common issues and their solutions:

- Build fails due to invalid Clerk key
  - Ensure the Clerk publishable and secret keys are valid and present in your environment configuration.

- RLS denied or empty data
  - Verify that the signed-in user has a corresponding profile record.
  - Confirm that the user’s role is assigned correctly in the profiles table.

- Document upload fails
  - Ensure the mce-documents bucket exists and is private.
  - Confirm that migrations were applied in the correct order.
  - Ensure the document metadata row exists before attempting uploads.

- Signed URL fails
  - Verify that storage policies are applied.
  - Ensure the requesting user has access to the associated project or tender.

- Redirect URL mismatch
  - Confirm that Clerk’s allowed redirect URLs include http://localhost:3000 and the sign-in/sign-up paths.

These checks help resolve typical setup and runtime issues quickly.

**Section sources**
- [README.md](file://README.md#L141-L158)

## Conclusion
You are now ready to develop and run MCE Command Center locally. By following the prerequisites, installation steps, Supabase and Clerk setup, and environment configuration, you can start building and testing features like Projects, Tenders, Documents, Notifications, and Milestones. Use the troubleshooting guide to resolve common issues and refer back to the Supabase and Clerk sections for detailed setup instructions.