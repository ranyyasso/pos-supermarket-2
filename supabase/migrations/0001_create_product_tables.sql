-- Copy and paste this migration into the Supabase SQL Editor.
-- This file defines schema only and inserts no mock or seed data.

create table if not exists public.manual_products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 120),
  category text not null check (length(trim(category)) between 1 and 80),
  selling_price bigint not null check (selling_price >= 0),
  purchase_cost bigint not null check (purchase_cost >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  minimum_stock integer not null default 1 check (minimum_stock >= 0),
  is_favorite boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.barcode_products (
  id uuid primary key default gen_random_uuid(),
  barcode text not null unique check (barcode ~ '^[0-9]{4,32}$'),
  name text not null check (length(trim(name)) between 1 and 120),
  category text not null check (length(trim(category)) between 1 and 80),
  selling_price bigint not null check (selling_price >= 0),
  purchase_cost bigint not null check (purchase_cost >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  minimum_stock integer not null default 1 check (minimum_stock >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists manual_products_name_idx on public.manual_products using btree (name);
create index if not exists manual_products_category_idx on public.manual_products using btree (category);
create index if not exists barcode_products_name_idx on public.barcode_products using btree (name);
create index if not exists barcode_products_category_idx on public.barcode_products using btree (category);

alter table public.manual_products enable row level security;
alter table public.barcode_products enable row level security;

-- No browser access policies are created here. Add authenticated cashier/admin
-- policies in the next numbered migration before connecting the frontend.
