-- Mizan: store-scoped ledger. Financial writes are only through authorized RPCs.
create schema if not exists private;
revoke all on schema private from public;
create table public.stores(id uuid primary key default gen_random_uuid(), name text not null, currency text not null default 'IQD', currency_scale integer not null default 3 check(currency_scale=3), timezone text not null default 'Asia/Baghdad', receipt_settings jsonb not null default '{}');
create table public.store_memberships(store_id uuid references public.stores on delete restrict, user_id uuid references auth.users on delete restrict, role text not null check(role in ('cashier','manager','admin')), active boolean not null default true, primary key(store_id,user_id));
create table public.terminals(id uuid primary key default gen_random_uuid(),store_id uuid not null references public.stores,name text not null,printer_settings jsonb not null default '{}',unique(store_id,id));
create table public.categories(id uuid primary key default gen_random_uuid(),store_id uuid not null references public.stores,name text not null,color_hex text not null check(color_hex ~ '^#[0-9A-Fa-f]{6}$'),sort_order integer not null default 0,legacy_id text,unique(store_id,id),unique(store_id,legacy_id));
create table public.products(id uuid primary key default gen_random_uuid(),store_id uuid not null references public.stores,category_id uuid not null,name text not null check(length(trim(name))>0),unit text not null default 'piece' check(unit in ('piece','kg','g','l','ml')),selling_price_minor bigint not null check(selling_price_minor>=0),tax_rate numeric(6,3) not null default 0 check(tax_rate between 0 and 100),low_stock_threshold numeric(18,6) not null default 0 check(low_stock_threshold>=0),active boolean not null default true,legacy_id text,unique(store_id,id),unique(store_id,legacy_id),foreign key(store_id,category_id) references public.categories(store_id,id));
create table public.product_barcodes(id uuid primary key default gen_random_uuid(),store_id uuid not null,product_id uuid not null,barcode text not null check(barcode ~ '^[0-9]{4,32}$'),kind text not null default 'manufacturer' check(kind in ('manufacturer','internal')),foreign key(store_id,product_id) references public.products(store_id,id),unique(store_id,barcode));
create table public.suppliers(id uuid primary key default gen_random_uuid(),store_id uuid not null references public.stores,name text not null check(length(trim(name))>0),unique(store_id,id));
create table public.customers(id uuid primary key default gen_random_uuid(),store_id uuid not null references public.stores,name text not null,phone text,loyalty_card text,unique(store_id,id),unique(store_id,phone),unique(store_id,loyalty_card));
create table public.stock_balances(store_id uuid not null,product_id uuid not null,quantity numeric(18,6) not null default 0 check(quantity>=0),last_purchase_cost_minor numeric(20,6) check(last_purchase_cost_minor>=0),primary key(store_id,product_id),foreign key(store_id,product_id) references public.products(store_id,id));
create table public.sales(id uuid primary key default gen_random_uuid(),store_id uuid not null,terminal_id uuid not null,cashier_id uuid not null references auth.users,customer_id uuid,status text not null default 'draft' check(status in ('draft','held','partially_paid','completed','voided','cancelled')),sale_mode text not null default 'retail' check(sale_mode in ('retail','wholesale')),total_minor bigint not null default 0 check(total_minor>=0),created_at timestamptz not null default now(),completed_at timestamptz,voided_at timestamptz,version integer not null default 0,unique(store_id,id),foreign key(store_id,terminal_id) references public.terminals(store_id,id),foreign key(store_id,customer_id) references public.customers(store_id,id));
create table public.sale_items(id uuid primary key default gen_random_uuid(),store_id uuid not null,sale_id uuid not null,product_id uuid not null,quantity numeric(18,6) not null check(quantity>0),name_snapshot text not null,unit_price_minor bigint not null check(unit_price_minor>=0),unit_cost_minor numeric(20,6),tax_rate numeric(6,3) not null default 0,total_minor bigint not null check(total_minor>=0),unique(store_id,id),unique(store_id,sale_id,id),foreign key(store_id,sale_id) references public.sales(store_id,id),foreign key(store_id,product_id) references public.products(store_id,id));
create table public.payments(id uuid primary key default gen_random_uuid(),store_id uuid not null,sale_id uuid not null,method text not null check(method in ('cash','card','contactless')),amount_minor bigint not null check(amount_minor>0),is_simulated boolean not null default true check(is_simulated),unique(store_id,id),foreign key(store_id,sale_id) references public.sales(store_id,id));
create table public.goods_receipts(id uuid primary key default gen_random_uuid(),store_id uuid not null,supplier_id uuid not null,delivery_reference text not null check(length(trim(delivery_reference))>0),posted_by uuid not null references auth.users,posted_at timestamptz not null default now(),unique(store_id,id),foreign key(store_id,supplier_id) references public.suppliers(store_id,id));
create table public.goods_receipt_items(id uuid primary key default gen_random_uuid(),store_id uuid not null,goods_receipt_id uuid not null,product_id uuid not null,quantity numeric(18,6) not null check(quantity>0),unit_cost_minor numeric(20,6) not null check(unit_cost_minor>=0),expiry_date date,unique(store_id,id),foreign key(store_id,goods_receipt_id) references public.goods_receipts(store_id,id),foreign key(store_id,product_id) references public.products(store_id,id));
create table public.refunds(id uuid primary key default gen_random_uuid(),store_id uuid not null,sale_id uuid not null,reason text not null check(length(trim(reason))>0),posted_by uuid not null references auth.users,posted_at timestamptz not null default now(),total_minor bigint not null check(total_minor>=0),unique(store_id,id),unique(store_id,sale_id,id),foreign key(store_id,sale_id) references public.sales(store_id,id));
create table public.refund_items(id uuid primary key default gen_random_uuid(),store_id uuid not null,sale_id uuid not null,refund_id uuid not null,sale_item_id uuid not null,quantity numeric(18,6) not null check(quantity>0),amount_minor bigint not null check(amount_minor>=0),unique(store_id,id),foreign key(store_id,sale_id,refund_id) references public.refunds(store_id,sale_id,id),foreign key(store_id,sale_id,sale_item_id) references public.sale_items(store_id,sale_id,id));
create table public.stock_movements(id uuid primary key default gen_random_uuid(),store_id uuid not null,product_id uuid not null,quantity_delta numeric(18,6) not null check(quantity_delta<>0),balance_after numeric(18,6) not null check(balance_after>=0),kind text not null check(kind in ('opening','receive','sale','refund','void')),sale_item_id uuid,receipt_item_id uuid,refund_item_id uuid,occurred_at timestamptz not null default now(),foreign key(store_id,product_id) references public.products(store_id,id),foreign key(store_id,sale_item_id) references public.sale_items(store_id,id),foreign key(store_id,receipt_item_id) references public.goods_receipt_items(store_id,id),foreign key(store_id,refund_item_id) references public.refund_items(store_id,id),check((kind='opening' and num_nonnulls(sale_item_id,receipt_item_id,refund_item_id)=0) or (kind in ('sale','void') and sale_item_id is not null and num_nonnulls(sale_item_id,receipt_item_id,refund_item_id)=1) or(kind='receive' and receipt_item_id is not null and num_nonnulls(sale_item_id,receipt_item_id,refund_item_id)=1) or(kind='refund' and refund_item_id is not null and num_nonnulls(sale_item_id,receipt_item_id,refund_item_id)=1)));
create unique index movement_sale_once on public.stock_movements(sale_item_id,kind) where sale_item_id is not null;
create unique index movement_receipt_once on public.stock_movements(receipt_item_id) where receipt_item_id is not null;
create unique index movement_refund_once on public.stock_movements(refund_item_id) where refund_item_id is not null;
create table public.audit_events(id uuid primary key default gen_random_uuid(),store_id uuid not null references public.stores,actor_id uuid not null references auth.users,action text not null,entity_id uuid,metadata jsonb not null default '{}',occurred_at timestamptz not null default now());
create table private.operation_requests(store_id uuid not null references public.stores,request_key uuid not null,operation text not null,payload jsonb not null,result_id uuid,primary key(store_id,request_key));
create index sales_period on public.sales(store_id,completed_at);
create index movements_product on public.stock_movements(store_id,product_id,occurred_at);
create index memberships_user on public.store_memberships(user_id,store_id);
create index sale_items_sale on public.sale_items(store_id,sale_id);
create index payments_sale on public.payments(store_id,sale_id);
create index refund_items_original on public.refund_items(store_id,sale_item_id);

create function private.is_member(s uuid, manager_only boolean default false) returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.store_memberships where store_id=s and user_id=auth.uid() and active and (not manager_only or role in ('manager','admin'))) $$;
revoke all on function private.is_member(uuid,boolean) from public;
grant usage on schema private to authenticated;
grant execute on function private.is_member(uuid,boolean) to authenticated;
do $$ declare t text; begin
 foreach t in array array['stores','store_memberships','terminals','categories','products','product_barcodes','suppliers','customers','stock_balances','sales','sale_items','payments','goods_receipts','goods_receipt_items','refunds','refund_items','stock_movements','audit_events'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon, authenticated',t);
 execute format('grant select on public.%I to authenticated',t);
 execute format('create policy member_read on public.%I for select to authenticated using (private.is_member(%I,%L))',t,case when t='stores' then 'id' else 'store_id' end,t in ('stock_balances','sale_items','goods_receipts','goods_receipt_items','audit_events'));
 end loop;
end $$;

-- Claims are taken only from the authenticated session. No browser writes granted.
create function private.begin_operation(s uuid,k uuid,op text,p jsonb) returns uuid language plpgsql set search_path='' as $$
declare r private.operation_requests; begin
 insert into private.operation_requests values(s,k,op,p,null) on conflict do nothing;
 select * into r from private.operation_requests where store_id=s and request_key=k for update;
 if r.operation<>op or r.payload<>p then raise exception 'Request key reused with different payload'; end if;
 return r.result_id;
end $$;
revoke all on function private.begin_operation(uuid,uuid,text,jsonb) from public;

create function public.post_receipt(p_store uuid,p_key uuid,p_supplier uuid,p_reference text,p_items jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid; item jsonb; line_id uuid; balance numeric; qty numeric; cost numeric; prod public.products; begin
 if not private.is_member(p_store,true) then raise exception 'Manager authentication required'; end if;
 result:=private.begin_operation(p_store,p_key,'receive',jsonb_build_array(p_supplier,p_reference,p_items)); if result is not null then return result; end if;
 if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 then raise exception 'Items required'; end if;
 insert into public.goods_receipts(store_id,supplier_id,delivery_reference,posted_by) values(p_store,p_supplier,p_reference,auth.uid()) returning id into result;
 for item in select value from jsonb_array_elements(p_items) order by value->>'product_id' loop
 select * into strict prod from public.products where store_id=p_store and id=(item->>'product_id')::uuid and active;
 qty:=(item->>'quantity')::numeric; cost:=(item->>'unit_cost_minor')::numeric;
 if prod.unit='piece' and qty<>trunc(qty) then raise exception 'Whole pieces required'; end if;
 insert into public.goods_receipt_items(store_id,goods_receipt_id,product_id,quantity,unit_cost_minor,expiry_date) values(p_store,result,prod.id,qty,cost,(item->>'expiry_date')::date) returning id into line_id;
 insert into public.stock_balances(store_id,product_id,quantity,last_purchase_cost_minor) values(p_store,prod.id,qty,cost) on conflict(store_id,product_id) do update set quantity=public.stock_balances.quantity+excluded.quantity,last_purchase_cost_minor=excluded.last_purchase_cost_minor returning quantity into balance;
 insert into public.stock_movements(store_id,product_id,quantity_delta,balance_after,kind,receipt_item_id) values(p_store,prod.id,qty,balance,'receive',line_id);
 end loop;
 insert into public.audit_events(store_id,actor_id,action,entity_id) values(p_store,auth.uid(),'receipt.posted',result);
 update private.operation_requests set result_id=result where store_id=p_store and request_key=p_key; return result;
end $$;
revoke all on function public.post_receipt(uuid,uuid,uuid,text,jsonb) from public,anon;
grant execute on function public.post_receipt(uuid,uuid,uuid,text,jsonb) to authenticated;
