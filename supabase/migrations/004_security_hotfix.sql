-- ============================================================
-- SECURITY HOTFIX - Apply to existing production database
-- This script is SAFE to run multiple times (idempotent)
-- ============================================================

-- ============================================================
-- PART 1: Fix function search_path vulnerabilities
-- CREATE OR REPLACE is inherently idempotent
-- ============================================================

create or replace function public.current_clerk_user_id()
returns text
language sql
stable
set search_path = public
as $$
  select nullif(auth.jwt() ->> 'sub', '');
$$;

create or replace function public.current_profile_id()
returns uuid
language sql
stable
set search_path = public
as $$
  select p.id
  from public.profiles p
  where p.clerk_user_id = public.current_clerk_user_id();
$$;

create or replace function public.current_profile_role()
returns public.profile_role
language sql
stable
set search_path = public
as $$
  select p.role
  from public.profiles p
  where p.clerk_user_id = public.current_clerk_user_id();
$$;

create or replace function public.is_admin_role()
returns boolean
language sql
stable
set search_path = public
as $$
  select public.current_profile_role() in ('super_admin', 'chairman_vp', 'dept_head', 'finance');
$$;

create or replace function public.can_view_project(project_id uuid)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.projects p
    where p.id = project_id
      and (
        public.is_admin_role()
        or p.pm_profile_id = public.current_profile_id()
        or exists (
          select 1
          from public.project_members pm
          where pm.project_id = p.id
            and pm.profile_id = public.current_profile_id()
        )
      )
  );
$$;

create or replace function public.can_edit_project(project_id uuid)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.projects p
    where p.id = project_id
      and (
        public.current_profile_role() in ('super_admin', 'chairman_vp', 'dept_head', 'pm')
        or p.pm_profile_id = public.current_profile_id()
      )
  );
$$;

create or replace function public.can_view_tender(tender_id uuid)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.tenders t
    where t.id = tender_id
      and (
        public.is_admin_role()
        or t.owner_profile_id = public.current_profile_id()
        or (t.project_id is not null and public.can_view_project(t.project_id))
        or exists (
          select 1
          from public.tender_members tm
          where tm.tender_id = t.id
            and tm.profile_id = public.current_profile_id()
        )
      )
  );
$$;

create or replace function public.can_edit_tender(tender_id uuid)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.tenders t
    where t.id = tender_id
      and (
        public.current_profile_role() in ('super_admin', 'chairman_vp', 'dept_head', 'pm')
        or t.owner_profile_id = public.current_profile_id()
        or (t.project_id is not null and public.can_edit_project(t.project_id))
      )
  );
$$;

create or replace function public.prevent_updates()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'append-only';
end;
$$;

-- ============================================================
-- PART 2: Fix extraction_jobs RLS (THE UPLOAD FIX)
-- This is likely why uploads are failing!
-- ============================================================

-- Enable RLS (safe to run even if already enabled)
alter table public.extraction_jobs enable row level security;

-- Drop existing policies if they exist, then recreate
drop policy if exists extraction_jobs_select on public.extraction_jobs;
drop policy if exists extraction_jobs_insert on public.extraction_jobs;
drop policy if exists extraction_jobs_update on public.extraction_jobs;
drop policy if exists extraction_jobs_delete on public.extraction_jobs;

-- Users can view extraction jobs for documents they can access
create policy extraction_jobs_select
  on public.extraction_jobs
  for select
  using (
    exists (
      select 1
      from public.documents d
      where d.id = extraction_jobs.document_id
        and (
          public.is_admin_role()
          or (d.project_id is not null and public.can_view_project(d.project_id))
          or (d.tender_id is not null and public.can_view_tender(d.tender_id))
        )
    )
  );

-- Users with document edit access can create extraction jobs
-- This is what allows the upload to work!
create policy extraction_jobs_insert
  on public.extraction_jobs
  for insert
  with check (
    exists (
      select 1
      from public.documents d
      where d.id = document_id
        and (
          public.is_admin_role()
          or (d.project_id is not null and public.can_edit_project(d.project_id))
          or (d.tender_id is not null and public.can_edit_tender(d.tender_id))
        )
    )
  );

-- Only admins/system can update job status/results
create policy extraction_jobs_update
  on public.extraction_jobs
  for update
  using (public.is_admin_role())
  with check (public.is_admin_role());

-- Only admins can delete extraction jobs
create policy extraction_jobs_delete
  on public.extraction_jobs
  for delete
  using (public.is_admin_role());

-- ============================================================
-- PART 3: Verification query - run this to confirm success
-- ============================================================

-- Uncomment and run separately to verify:
-- SELECT 'Functions updated' as status, count(*) as count
-- FROM pg_proc 
-- WHERE proname IN ('current_clerk_user_id', 'current_profile_id', 'is_admin_role')
-- AND proconfig::text LIKE '%search_path%';

-- SELECT 'extraction_jobs policies' as status, policyname 
-- FROM pg_policies 
-- WHERE tablename = 'extraction_jobs';
