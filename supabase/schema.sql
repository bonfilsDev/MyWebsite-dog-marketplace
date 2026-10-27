create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  email text,
  avatar_url text,
  role text not null default 'buyer' check (role in ('buyer', 'seller', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dogs (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  breed text not null default '',
  age_years numeric(4, 1) check (age_years >= 0 and age_years <= 30),
  gender text check (gender in ('male', 'female')),
  price_rwf bigint check (price_rwf >= 0),
  weight_kg numeric(5, 1) check (weight_kg > 0 and weight_kg <= 200),
  height_cm numeric(5, 1) check (height_cm > 0 and height_cm <= 250),
  description text not null default '',
  location text not null default '',
  image_urls text[] not null default '{}',
  video_url text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists dogs_status_created_idx on public.dogs (status, created_at desc);
create index if not exists dogs_seller_idx on public.dogs (seller_id, created_at desc);
create index if not exists dogs_price_idx on public.dogs (price_rwf);
create index if not exists dogs_featured_idx on public.dogs (is_featured, created_at desc)
  where status = 'approved';

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.is_seller()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('seller', 'admin')
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    new.email,
    case
      when new.raw_user_meta_data ->> 'role' = 'seller' then 'seller'
      else 'buyer'
    end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists dogs_set_updated_at on public.dogs;
create trigger dogs_set_updated_at
  before update on public.dogs
  for each row execute function public.set_updated_at();

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if auth.uid() = old.id then
    new.role = old.role;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_role_trigger on public.profiles;
create trigger protect_profile_role_trigger
  before update on public.profiles
  for each row execute function public.protect_profile_role();

create or replace function public.guard_dog_record()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.status = 'pending';
    new.rejection_reason = null;
    new.is_featured = false;
  else
    new.seller_id = old.seller_id;
    new.status = 'pending';
    new.rejection_reason = null;
    new.is_featured = old.is_featured;
    new.created_at = old.created_at;
  end if;

  return new;
end;
$$;

drop trigger if exists guard_dog_record_trigger on public.dogs;
create trigger guard_dog_record_trigger
  before insert or update on public.dogs
  for each row execute function public.guard_dog_record();

create or replace function public.get_seller_contact(target_id uuid)
returns table (
  id uuid,
  full_name text,
  phone text,
  email text,
  avatar_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.full_name, p.phone, p.email, p.avatar_url
  from public.profiles p
  where p.id = target_id
    and exists (
      select 1
      from public.dogs d
      where d.seller_id = p.id
        and d.status = 'approved'
    );
$$;

revoke all on function public.get_seller_contact(uuid) from public;
grant execute on function public.get_seller_contact(uuid) to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.dogs enable row level security;

drop policy if exists "Profiles are viewable by their owner or admins" on public.profiles;
create policy "Profiles are viewable by their owner or admins"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id or public.is_admin());

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

drop policy if exists "Approved dogs are public" on public.dogs;
create policy "Approved dogs are public"
  on public.dogs for select
  to anon, authenticated
  using (
    status = 'approved'
    or seller_id = auth.uid()
    or public.is_admin()
  );

drop policy if exists "Sellers can create pending dogs" on public.dogs;
create policy "Sellers can create pending dogs"
  on public.dogs for insert
  to authenticated
  with check (
    (seller_id = auth.uid() and status = 'pending' and public.is_seller())
    or public.is_admin()
  );

drop policy if exists "Sellers can update their own dogs" on public.dogs;
create policy "Sellers can update their own dogs"
  on public.dogs for update
  to authenticated
  using (
    (seller_id = auth.uid() and public.is_seller())
    or public.is_admin()
  )
  with check (
    (seller_id = auth.uid() and public.is_seller())
    or public.is_admin()
  );

drop policy if exists "Sellers can delete their own dogs" on public.dogs;
create policy "Sellers can delete their own dogs"
  on public.dogs for delete
  to authenticated
  using (
    (seller_id = auth.uid() and public.is_seller())
    or public.is_admin()
  );
