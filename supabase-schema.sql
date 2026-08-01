-- Execute este arquivo uma única vez em Supabase > SQL Editor.
-- Ele cria dados individuais e políticas que impedem um usuário de ler os dados de outro.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  birth_date date,
  profession text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.favorite_locations (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  latitude double precision not null,
  longitude double precision not null,
  created_at timestamptz not null default now(),
  unique (user_id, latitude, longitude)
);

alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.favorite_locations enable row level security;

create policy "Usuário lê o próprio perfil" on public.profiles for select using (auth.uid() = id);
create policy "Usuário atualiza o próprio perfil" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "Usuário lê as próprias preferências" on public.user_settings for select using (auth.uid() = user_id);
create policy "Usuário grava as próprias preferências" on public.user_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Usuário lê os próprios favoritos" on public.favorite_locations for select using (auth.uid() = user_id);
create policy "Usuário grava os próprios favoritos" on public.favorite_locations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, birth_date, profession)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'birth_date', '')::date,
    nullif(new.raw_user_meta_data ->> 'profession', '')
  )
  on conflict (id) do update set
    email = excluded.email,
    birth_date = excluded.birth_date,
    profession = excluded.profession,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
