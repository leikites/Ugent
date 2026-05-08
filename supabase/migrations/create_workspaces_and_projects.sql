create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists workspaces_owner_name_key
on public.workspaces (owner_id, lower(name));

alter table public.workspaces enable row level security;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  owner_id uuid not null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_workspace_id_idx on public.projects (workspace_id);
create unique index if not exists projects_workspace_name_key
on public.projects (workspace_id, lower(name));

alter table public.projects enable row level security;

drop trigger if exists workspaces_set_updated_at on public.workspaces;
create trigger workspaces_set_updated_at
before update on public.workspaces
for each row
execute procedure public.set_updated_at();

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
before update on public.projects
for each row
execute procedure public.set_updated_at();

drop policy if exists workspaces_select_own on public.workspaces;
create policy workspaces_select_own
on public.workspaces
for select
using (auth.uid() = owner_id);

drop policy if exists workspaces_insert_own on public.workspaces;
create policy workspaces_insert_own
on public.workspaces
for insert
with check (auth.uid() = owner_id);

drop policy if exists workspaces_update_own on public.workspaces;
create policy workspaces_update_own
on public.workspaces
for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists workspaces_delete_own on public.workspaces;
create policy workspaces_delete_own
on public.workspaces
for delete
using (auth.uid() = owner_id);

drop policy if exists projects_select_own on public.projects;
create policy projects_select_own
on public.projects
for select
using (
  auth.uid() = owner_id
  and exists (
    select 1 from public.workspaces w
    where w.id = projects.workspace_id
      and w.owner_id = auth.uid()
  )
);

drop policy if exists projects_insert_own on public.projects;
create policy projects_insert_own
on public.projects
for insert
with check (
  auth.uid() = owner_id
  and exists (
    select 1 from public.workspaces w
    where w.id = projects.workspace_id
      and w.owner_id = auth.uid()
  )
);

drop policy if exists projects_update_own on public.projects;
create policy projects_update_own
on public.projects
for update
using (
  auth.uid() = owner_id
  and exists (
    select 1 from public.workspaces w
    where w.id = projects.workspace_id
      and w.owner_id = auth.uid()
  )
)
with check (
  auth.uid() = owner_id
  and exists (
    select 1 from public.workspaces w
    where w.id = projects.workspace_id
      and w.owner_id = auth.uid()
  )
);

drop policy if exists projects_delete_own on public.projects;
create policy projects_delete_own
on public.projects
for delete
using (
  auth.uid() = owner_id
  and exists (
    select 1 from public.workspaces w
    where w.id = projects.workspace_id
      and w.owner_id = auth.uid()
  )
);

grant select on public.workspaces to anon;
grant all privileges on public.workspaces to authenticated;

grant select on public.projects to anon;
grant all privileges on public.projects to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, username)
  values (new.id, new.email, new.raw_user_meta_data->>'username')
  on conflict (id) do update
  set
    email = excluded.email,
    username = coalesce(excluded.username, public.profiles.username);

  insert into public.workspaces (owner_id, name)
  values (new.id, 'Default')
  on conflict do nothing;

  return new;
end;
$$;

insert into public.workspaces (owner_id, name)
select p.id, 'Default'
from public.profiles p
where not exists (
  select 1 from public.workspaces w where w.owner_id = p.id
);

