alter table public.profiles add column if not exists username text;

create unique index if not exists profiles_username_key on public.profiles (username);

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
  return new;
end;
$$;

