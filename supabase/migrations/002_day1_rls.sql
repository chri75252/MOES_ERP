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

alter table public.profiles enable row level security;

drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self
  on public.profiles
  for select
  using (
    public.is_admin_role()
    or clerk_user_id = public.current_clerk_user_id()
  );

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self
  on public.profiles
  for update
  using (clerk_user_id = public.current_clerk_user_id())
  with check (clerk_user_id = public.current_clerk_user_id());

alter table public.clients enable row level security;

drop policy if exists clients_select on public.clients;
create policy clients_select
  on public.clients
  for select
  using (public.is_admin_role() or public.current_profile_role() in ('pm', 'engineer', 'viewer'));

drop policy if exists clients_insert on public.clients;
create policy clients_insert
  on public.clients
  for insert
  with check (public.current_profile_role() in ('super_admin', 'chairman_vp', 'dept_head', 'pm'));

drop policy if exists clients_update on public.clients;
create policy clients_update
  on public.clients
  for update
  using (public.current_profile_role() in ('super_admin', 'chairman_vp', 'dept_head', 'pm'))
  with check (public.current_profile_role() in ('super_admin', 'chairman_vp', 'dept_head', 'pm'));

alter table public.projects enable row level security;

drop policy if exists projects_select on public.projects;
create policy projects_select
  on public.projects
  for select
  using (public.can_view_project(id));

drop policy if exists projects_insert on public.projects;
create policy projects_insert
  on public.projects
  for insert
  with check (public.current_profile_role() in ('super_admin', 'chairman_vp', 'dept_head', 'pm'));

drop policy if exists projects_update on public.projects;
create policy projects_update
  on public.projects
  for update
  using (public.can_edit_project(id))
  with check (public.can_edit_project(id));

alter table public.project_members enable row level security;

drop policy if exists project_members_select on public.project_members;
create policy project_members_select
  on public.project_members
  for select
  using (public.can_view_project(project_id));

drop policy if exists project_members_manage on public.project_members;
create policy project_members_manage
  on public.project_members
  for insert
  with check (public.can_edit_project(project_id));

drop policy if exists project_members_update on public.project_members;
create policy project_members_update
  on public.project_members
  for update
  using (public.can_edit_project(project_id))
  with check (public.can_edit_project(project_id));

drop policy if exists project_members_delete on public.project_members;
create policy project_members_delete
  on public.project_members
  for delete
  using (public.can_edit_project(project_id));

alter table public.project_milestones enable row level security;

drop policy if exists milestones_select on public.project_milestones;
create policy milestones_select
  on public.project_milestones
  for select
  using (public.can_view_project(project_id));

drop policy if exists milestones_insert on public.project_milestones;
create policy milestones_insert
  on public.project_milestones
  for insert
  with check (public.can_edit_project(project_id));

drop policy if exists milestones_update on public.project_milestones;
create policy milestones_update
  on public.project_milestones
  for update
  using (public.can_edit_project(project_id))
  with check (public.can_edit_project(project_id));

alter table public.tenders enable row level security;

drop policy if exists tenders_select on public.tenders;
create policy tenders_select
  on public.tenders
  for select
  using (public.can_view_tender(id));

drop policy if exists tenders_insert on public.tenders;
create policy tenders_insert
  on public.tenders
  for insert
  with check (
    public.current_profile_role() in ('super_admin', 'chairman_vp', 'dept_head', 'pm')
    and owner_profile_id = public.current_profile_id()
  );

drop policy if exists tenders_update on public.tenders;
create policy tenders_update
  on public.tenders
  for update
  using (public.can_edit_tender(id))
  with check (public.can_edit_tender(id));

alter table public.tender_members enable row level security;

drop policy if exists tender_members_select on public.tender_members;
create policy tender_members_select
  on public.tender_members
  for select
  using (public.can_view_tender(tender_id));

drop policy if exists tender_members_manage on public.tender_members;
create policy tender_members_manage
  on public.tender_members
  for insert
  with check (public.can_edit_tender(tender_id));

drop policy if exists tender_members_update on public.tender_members;
create policy tender_members_update
  on public.tender_members
  for update
  using (public.can_edit_tender(tender_id))
  with check (public.can_edit_tender(tender_id));

drop policy if exists tender_members_delete on public.tender_members;
create policy tender_members_delete
  on public.tender_members
  for delete
  using (public.can_edit_tender(tender_id));

alter table public.tender_comms_events enable row level security;

drop policy if exists tender_comms_select on public.tender_comms_events;
create policy tender_comms_select
  on public.tender_comms_events
  for select
  using (public.can_view_tender(tender_id));

drop policy if exists tender_comms_insert on public.tender_comms_events;
create policy tender_comms_insert
  on public.tender_comms_events
  for insert
  with check (
    public.can_view_tender(tender_id)
    and actor_profile_id = public.current_profile_id()
  );

alter table public.documents enable row level security;

drop policy if exists documents_select on public.documents;
create policy documents_select
  on public.documents
  for select
  using (
    public.is_admin_role()
    or (project_id is not null and public.can_view_project(project_id))
    or (tender_id is not null and public.can_view_tender(tender_id))
  );

drop policy if exists documents_insert on public.documents;
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

drop policy if exists documents_update on public.documents;
create policy documents_update
  on public.documents
  for update
  using (
    public.is_admin_role()
    or (project_id is not null and public.can_edit_project(project_id))
    or (tender_id is not null and public.can_edit_tender(tender_id))
  )
  with check (
    public.is_admin_role()
    or (project_id is not null and public.can_edit_project(project_id))
    or (tender_id is not null and public.can_edit_tender(tender_id))
  );

drop policy if exists documents_delete on public.documents;
create policy documents_delete
  on public.documents
  for delete
  using (
    public.is_admin_role()
    or (project_id is not null and public.can_edit_project(project_id))
    or (tender_id is not null and public.can_edit_tender(tender_id))
  );

alter table public.notifications enable row level security;

drop policy if exists notifications_select on public.notifications;
create policy notifications_select
  on public.notifications
  for select
  using (
    public.is_admin_role()
    or recipient_profile_id = public.current_profile_id()
  );

drop policy if exists notifications_update on public.notifications;
create policy notifications_update
  on public.notifications
  for update
  using (recipient_profile_id = public.current_profile_id())
  with check (recipient_profile_id = public.current_profile_id());

alter table public.audit_log enable row level security;

drop policy if exists audit_select on public.audit_log;
create policy audit_select
  on public.audit_log
  for select
  using (
    public.is_admin_role()
    or actor_profile_id = public.current_profile_id()
  );

drop policy if exists audit_insert on public.audit_log;
create policy audit_insert
  on public.audit_log
  for insert
  with check (actor_profile_id = public.current_profile_id());

create or replace function public.prevent_updates()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'append-only';
end;
$$;

drop trigger if exists tender_comms_no_update on public.tender_comms_events;
create trigger tender_comms_no_update
before update or delete on public.tender_comms_events
for each row execute function public.prevent_updates();

drop trigger if exists audit_no_update on public.audit_log;
create trigger audit_no_update
before update or delete on public.audit_log
for each row execute function public.prevent_updates();

-- ============================================================
-- EXTRACTION JOBS RLS
-- ============================================================

alter table public.extraction_jobs enable row level security;

-- Users can view extraction jobs for documents they can access
drop policy if exists extraction_jobs_select on public.extraction_jobs;
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
-- (Modified from admin-only to support document upload workflow)
drop policy if exists extraction_jobs_insert on public.extraction_jobs;
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
drop policy if exists extraction_jobs_update on public.extraction_jobs;
create policy extraction_jobs_update
  on public.extraction_jobs
  for update
  using (public.is_admin_role())
  with check (public.is_admin_role());

-- Only admins can delete extraction jobs
drop policy if exists extraction_jobs_delete on public.extraction_jobs;
create policy extraction_jobs_delete
  on public.extraction_jobs
  for delete
  using (public.is_admin_role());
