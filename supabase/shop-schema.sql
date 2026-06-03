create extension if not exists pgcrypto;

create table if not exists public.shop_products (
  id text primary key,
  sku text not null unique,
  name text not null,
  brand text,
  category text not null default 'Accessories',
  tags text[] not null default '{}',
  price numeric(10, 2),
  display_price text,
  purchasable boolean not null default true,
  available integer not null default 0,
  in_stock boolean not null default false,
  description text not null default '',
  details text not null default '',
  image_url text,
  images text[] not null default '{}',
  has_image boolean not null default false,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shop_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists shop_products_touch_updated_at on public.shop_products;
create trigger shop_products_touch_updated_at
before update on public.shop_products
for each row
execute function public.touch_updated_at();

create or replace function public.is_shop_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.shop_admins
    where user_id = auth.uid()
  );
$$;

grant execute on function public.is_shop_admin() to anon, authenticated;
grant select on public.shop_admins to authenticated;
grant select, insert, update, delete on public.shop_products to authenticated;

alter table public.shop_products enable row level security;
alter table public.shop_admins enable row level security;

drop policy if exists "Public can read active shop products" on public.shop_products;
create policy "Public can read active shop products"
on public.shop_products
for select
using (active = true);

drop policy if exists "Shop admins can manage products" on public.shop_products;
create policy "Shop admins can manage products"
on public.shop_products
for all
using (public.is_shop_admin())
with check (public.is_shop_admin());

drop policy if exists "Admins can read admin list" on public.shop_admins;
create policy "Admins can read admin list"
on public.shop_admins
for select
using (public.is_shop_admin());

drop policy if exists "Admins can insert own admin row" on public.shop_admins;
create policy "Admins can insert own admin row"
on public.shop_admins
for insert
with check (user_id = auth.uid());

create index if not exists shop_products_active_category_idx on public.shop_products(active, category);
create index if not exists shop_products_name_idx on public.shop_products using gin(to_tsvector('english', name || ' ' || coalesce(description, '')));
