create table public.scale_items(store_id uuid not null,product_id uuid not null,scale_code text not null check(scale_code ~ '^[0-9]{5}$'),primary key(store_id,product_id),unique(store_id,scale_code),foreign key(store_id,product_id) references public.products(store_id,id));
create table public.product_favorites(store_id uuid not null,product_id uuid not null,user_id uuid not null references auth.users,primary key(user_id,product_id),foreign key(store_id,product_id) references public.products(store_id,id));
create table public.product_suppliers(store_id uuid not null,product_id uuid not null,supplier_id uuid not null,preferred boolean not null default false,primary key(product_id,supplier_id),foreign key(store_id,product_id) references public.products(store_id,id),foreign key(store_id,supplier_id) references public.suppliers(store_id,id));
create table public.loyalty_entries(id uuid primary key default gen_random_uuid(),store_id uuid not null,customer_id uuid not null,sale_id uuid,refund_id uuid,points_delta integer not null check(points_delta<>0),reason text not null,occurred_at timestamptz not null default now(),foreign key(store_id,customer_id) references public.customers(store_id,id),foreign key(store_id,sale_id) references public.sales(store_id,id),foreign key(store_id,refund_id) references public.refunds(store_id,id));
create table public.coupons(id uuid primary key default gen_random_uuid(),store_id uuid not null references public.stores,code text not null,rule_type text not null check(rule_type in ('percent','fixed')),value numeric not null check(value>0),valid_from timestamptz,valid_until timestamptz,usage_limit integer check(usage_limit>0),active boolean not null default true,unique(store_id,id),unique(store_id,code),check(valid_until is null or valid_from is null or valid_until>valid_from),check(rule_type<>'percent' or value<=100));
create table public.coupon_redemptions(id uuid primary key default gen_random_uuid(),store_id uuid not null,coupon_id uuid not null,sale_id uuid not null,discount_minor bigint not null check(discount_minor>=0),unique(coupon_id,sale_id),foreign key(store_id,coupon_id) references public.coupons(store_id,id),foreign key(store_id,sale_id) references public.sales(store_id,id));
create table private.import_batches(id uuid primary key default gen_random_uuid(),store_id uuid not null references public.stores,source_hash text not null,source_data jsonb not null,created_at timestamptz not null default now(),unique(store_id,source_hash));
do $$ declare t text; begin foreach t in array array['scale_items','product_favorites','product_suppliers','loyalty_entries','coupons','coupon_redemptions'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon,authenticated',t);
 execute format('grant select on public.%I to authenticated',t);
 execute format('create policy member_read on public.%I for select to authenticated using(private.is_member(store_id))',t);
 end loop; end $$;
-- Current gross/net financial history, security checked through the underlying RLS.
create view public.sales_summary with(security_invoker=true) as
 select s.store_id,s.id,s.completed_at,s.status,s.total_minor,
 coalesce(r.refunded_minor,0) as refunded_minor,
 case when s.status='voided' then 0 else s.total_minor-coalesce(r.refunded_minor,0) end as net_minor
 from public.sales s left join(select store_id,sale_id,sum(total_minor) refunded_minor from public.refunds group by store_id,sale_id) r on r.store_id=s.store_id and r.sale_id=s.id
 where s.status in ('completed','voided');
revoke all on public.sales_summary from anon,authenticated;
grant select on public.sales_summary to authenticated;
-- Prevent access to tables added later by accident.
alter default privileges in schema public revoke all on tables from anon,authenticated;
alter default privileges in schema public revoke execute on functions from public,anon,authenticated;
