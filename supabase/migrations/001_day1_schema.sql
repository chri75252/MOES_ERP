create extension if not exists pgcrypto;

do $$ begin
  create type public.profile_role as enum (
    'super_admin',
    'chairman_vp',
    'dept_head',
    'pm',
    'engineer',
    'finance',
    'viewer'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.project_status as enum (
    'active',
    'on_hold',
    'completed'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.milestone_status as enum (
    'not_started',
    'in_progress',
    'done',
    'blocked'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.tender_status as enum (
    'new',
    'in_review',
    'submitted',
    'awarded',
    'lost'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.tender_channel as enum (
    'email',
    'call',
    'meeting',
    'other'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.document_sensitivity as enum (
    'confidential',
    'restricted'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.notification_severity as enum (
    'info',
    'warn',
    'critical'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.notification_type as enum (
    'tender_deadline',
    'milestone_due',
    'followup_due',
    'system'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.audit_action as enum (
    'create',
    'update',
    'delete',
    'upload',
    'ack'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.audit_entity as enum (
    'project',
    'milestone',
    'tender',
    'tender_comms',
    'document',
    'notification'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null unique,
  email text,
  display_name text,
  role public.profile_role not null default 'viewer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  classification text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  client_id uuid references public.clients(id) on delete set null,
  pm_profile_id uuid not null references public.profiles(id) on delete restrict,
  stage text,
  start_date date,
  end_date date,
  dlp_date date,
  progress_pct integer default 0,
  status public.project_status not null default 'active',
  tags text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  member_role public.profile_role not null default 'viewer',
  created_at timestamptz not null default now(),
  primary key (project_id, profile_id)
);

create table if not exists public.project_milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  due_date date,
  owner_profile_id uuid references public.profiles(id) on delete set null,
  status public.milestone_status not null default 'not_started',
  created_at timestamptz not null default now()
);

create table if not exists public.tenders (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  reference text not null,
  title text,
  deadline_at timestamptz not null,
  status public.tender_status not null default 'new',
  value_amount numeric(12,2),
  value_currency text default 'GBP',
  owner_profile_id uuid not null references public.profiles(id) on delete restrict,
  next_followup_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tender_members (
  tender_id uuid not null references public.tenders(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (tender_id, profile_id)
);

create table if not exists public.tender_comms_events (
  id uuid primary key default gen_random_uuid(),
  tender_id uuid not null references public.tenders(id) on delete cascade,
  actor_profile_id uuid not null references public.profiles(id) on delete restrict,
  occurred_at timestamptz not null default now(),
  channel public.tender_channel not null default 'email',
  outcome text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  doc_type text,
  sensitivity public.document_sensitivity not null default 'confidential',
  project_id uuid references public.projects(id) on delete set null,
  tender_id uuid references public.tenders(id) on delete set null,
  title text,
  storage_bucket text not null default 'mce-documents',
  storage_path text not null,
  mime_type text,
  size_bytes bigint,
  uploaded_by_profile_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  version_group_id uuid,
  version_number integer default 1,
  constraint documents_entity_chk check (project_id is not null or tender_id is not null)
);

create table if not exists public.extraction_jobs (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  job_type text not null,
  status text not null default 'pending',
  started_at timestamptz,
  finished_at timestamptz,
  result_json jsonb,
  error_message text
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_profile_id uuid not null references public.profiles(id) on delete cascade,
  severity public.notification_severity not null default 'info',
  type public.notification_type not null default 'system',
  message text not null,
  entity_type public.audit_entity,
  entity_id uuid,
  ack_required boolean not null default false,
  acked_at timestamptz,
  acked_by_profile_id uuid references public.profiles(id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.profiles(id) on delete set null,
  action public.audit_action not null,
  entity_type public.audit_entity not null,
  entity_id uuid,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists projects_client_idx on public.projects (client_id);
create index if not exists projects_pm_idx on public.projects (pm_profile_id);
create index if not exists milestones_due_idx on public.project_milestones (due_date);
create index if not exists tenders_deadline_idx on public.tenders (deadline_at);
create index if not exists tenders_owner_idx on public.tenders (owner_profile_id);
create index if not exists documents_project_idx on public.documents (project_id);
create index if not exists documents_tender_idx on public.documents (tender_id);
create index if not exists notifications_recipient_idx on public.notifications (recipient_profile_id);
create index if not exists audit_entity_idx on public.audit_log (entity_type, entity_id);
