create function public.register_product(p_store uuid,p_key uuid,p_category uuid,p_name text,p_barcode text,p_price bigint,p_unit text default 'piece',p_tax numeric default 0,p_stock numeric default 0,p_cost numeric default null) returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid; begin
 if not private.is_member(p_store,true) then raise exception 'Manager authentication required'; end if;
 result:=private.begin_operation(p_store,p_key,'register',jsonb_build_array(p_category,p_name,p_barcode,p_price,p_unit,p_tax,p_stock,p_cost)); if result is not null then return result; end if;
 if p_unit='piece' and p_stock<>trunc(p_stock) then raise exception 'Whole pieces required'; end if;
 insert into public.products(store_id,category_id,name,unit,selling_price_minor,tax_rate) values(p_store,p_category,p_name,p_unit,p_price,p_tax) returning id into result;
 insert into public.product_barcodes(store_id,product_id,barcode) values(p_store,result,p_barcode);
 insert into public.stock_balances(store_id,product_id,quantity,last_purchase_cost_minor) values(p_store,result,p_stock,p_cost);
 if p_stock>0 then insert into public.stock_movements(store_id,product_id,quantity_delta,balance_after,kind) values(p_store,result,p_stock,p_stock,'opening'); end if;
 insert into public.audit_events(store_id,actor_id,action,entity_id) values(p_store,auth.uid(),'product.registered',result);
 update private.operation_requests set result_id=result where store_id=p_store and request_key=p_key; return result;
end $$;

-- Basic checkout deliberately accepts product IDs and quantities, not browser totals.
-- Existing promotions/discount/loyalalty pricing needs a separate parity migration
-- before switching the current UI to database mode.
create function public.checkout(p_store uuid,p_key uuid,p_terminal uuid,p_items jsonb,p_payments jsonb,p_customer uuid default null) returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid; item jsonb; prod public.products; line_id uuid; qty numeric; balance numeric; cost numeric; line_total bigint; total bigint:=0; paid bigint:=0; begin
 if not private.is_member(p_store) then raise exception 'Staff authentication required'; end if;
 result:=private.begin_operation(p_store,p_key,'checkout',jsonb_build_array(p_terminal,p_items,p_payments,p_customer)); if result is not null then return result; end if;
 if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 or jsonb_typeof(p_payments)<>'array' then raise exception 'Invalid checkout'; end if;
 insert into public.sales(store_id,terminal_id,cashier_id,customer_id) values(p_store,p_terminal,auth.uid(),p_customer) returning id into result;
 for item in select value from jsonb_array_elements(p_items) order by value->>'product_id' loop
 if item - 'product_id' - 'quantity' <> '{}'::jsonb then raise exception 'Unsupported pricing fields'; end if;
 select * into strict prod from public.products where store_id=p_store and id=(item->>'product_id')::uuid and active for share;
 qty:=(item->>'quantity')::numeric;
 if qty is null or qty<=0 or qty<>round(qty,6) or (prod.unit='piece' and qty<>trunc(qty)) then raise exception 'Invalid quantity'; end if;
 select quantity,last_purchase_cost_minor into strict balance,cost from public.stock_balances where store_id=p_store and product_id=prod.id for update;
 if balance<qty then raise exception 'Insufficient stock'; end if;
 -- Whole-dinar rounding in the basic path; advanced group allocations are not enabled here.
 line_total:=round(prod.selling_price_minor*qty*(1+prod.tax_rate/100)/1000)*1000;
 insert into public.sale_items(store_id,sale_id,product_id,quantity,name_snapshot,unit_price_minor,unit_cost_minor,tax_rate,total_minor) values(p_store,result,prod.id,qty,prod.name,prod.selling_price_minor,cost,prod.tax_rate,line_total) returning id into line_id;
 update public.stock_balances set quantity=quantity-qty where store_id=p_store and product_id=prod.id returning quantity into balance;
 insert into public.stock_movements(store_id,product_id,quantity_delta,balance_after,kind,sale_item_id) values(p_store,prod.id,-qty,balance,'sale',line_id);
 total:=total+line_total;
 end loop;
 for item in select value from jsonb_array_elements(p_payments) loop
 insert into public.payments(store_id,sale_id,method,amount_minor) values(p_store,result,item->>'method',(item->>'amount_minor')::bigint);
 paid:=paid+(item->>'amount_minor')::bigint;
 end loop;
 if paid<>total then raise exception 'Payments must equal sale total'; end if;
 update public.sales set total_minor=total,status='completed',completed_at=now(),version=version+1 where id=result;
 insert into public.audit_events(store_id,actor_id,action,entity_id) values(p_store,auth.uid(),'sale.completed',result);
 update private.operation_requests set result_id=result where store_id=p_store and request_key=p_key; return result;
end $$;

create table public.refund_payments(id uuid primary key default gen_random_uuid(),store_id uuid not null,sale_id uuid not null,refund_id uuid not null,payment_id uuid not null,amount_minor bigint not null check(amount_minor>0),foreign key(store_id,sale_id,refund_id) references public.refunds(store_id,sale_id,id));
alter table public.payments add unique(store_id,sale_id,id);
alter table public.refund_payments add foreign key(store_id,sale_id,payment_id) references public.payments(store_id,sale_id,id);
alter table public.refund_payments enable row level security;
revoke all on public.refund_payments from anon,authenticated;
grant select on public.refund_payments to authenticated;
create policy member_read on public.refund_payments for select to authenticated using(private.is_member(store_id));

create function public.refund_sale(p_store uuid,p_key uuid,p_sale uuid,p_reason text,p_items jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid; s public.sales; item jsonb; line public.sale_items; ri uuid; qty numeric; returned numeric; previous_amount bigint; amount bigint; total bigint:=0; balance numeric; pay record; remaining bigint; allocated bigint; begin
 if not private.is_member(p_store,true) then raise exception 'Manager authentication required'; end if;
 result:=private.begin_operation(p_store,p_key,'refund',jsonb_build_array(p_sale,p_reason,p_items)); if result is not null then return result; end if;
 select * into strict s from public.sales where store_id=p_store and id=p_sale for update;
 if s.status<>'completed' then raise exception 'Only completed sales can be refunded'; end if;
 if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 then raise exception 'Items required'; end if;
 insert into public.refunds(store_id,sale_id,reason,posted_by,total_minor) values(p_store,p_sale,p_reason,auth.uid(),0) returning id into result;
 for item in select value from jsonb_array_elements(p_items) order by value->>'sale_item_id' loop
 select * into strict line from public.sale_items where store_id=p_store and sale_id=p_sale and id=(item->>'sale_item_id')::uuid;
 qty:=(item->>'quantity')::numeric;
 select coalesce(sum(quantity),0),coalesce(sum(amount_minor),0) into returned,previous_amount from public.refund_items where store_id=p_store and sale_item_id=line.id;
 if qty is null or qty<=0 or qty<>round(qty,6) or returned+qty>line.quantity then raise exception 'Invalid refund quantity'; end if;
 if exists(select 1 from public.products where id=line.product_id and unit='piece') and qty<>trunc(qty) then raise exception 'Whole pieces required'; end if;
 amount:=case when returned+qty=line.quantity then line.total_minor-previous_amount else floor(line.total_minor*qty/line.quantity) end;
 insert into public.refund_items(store_id,sale_id,refund_id,sale_item_id,quantity,amount_minor) values(p_store,p_sale,result,line.id,qty,amount) returning id into ri;
 update public.stock_balances set quantity=quantity+qty where store_id=p_store and product_id=line.product_id returning quantity into balance;
 insert into public.stock_movements(store_id,product_id,quantity_delta,balance_after,kind,refund_item_id) values(p_store,line.product_id,qty,balance,'refund',ri);
 total:=total+amount;
 end loop;
 remaining:=total;
 for pay in select * from public.payments where store_id=p_store and sale_id=p_sale order by id loop
 select coalesce(sum(amount_minor),0) into allocated from public.refund_payments where store_id=p_store and payment_id=pay.id;
 amount:=least(remaining,pay.amount_minor-allocated);
 if amount>0 then insert into public.refund_payments(store_id,sale_id,refund_id,payment_id,amount_minor) values(p_store,p_sale,result,pay.id,amount); remaining:=remaining-amount; end if;
 end loop;
 if remaining<>0 then raise exception 'Refund exceeds payments'; end if;
 update public.refunds set total_minor=total where id=result;
 insert into public.audit_events(store_id,actor_id,action,entity_id) values(p_store,auth.uid(),'sale.refunded',result);
 update private.operation_requests set result_id=result where store_id=p_store and request_key=p_key; return result;
end $$;

create table public.payment_reversals(id uuid primary key default gen_random_uuid(),store_id uuid not null,payment_id uuid not null,amount_minor bigint not null check(amount_minor>0),reason text not null,created_at timestamptz not null default now(),unique(payment_id),foreign key(store_id,payment_id) references public.payments(store_id,id));
alter table public.payment_reversals enable row level security;
revoke all on public.payment_reversals from anon,authenticated;
grant select on public.payment_reversals to authenticated;
create policy member_read on public.payment_reversals for select to authenticated using(private.is_member(store_id));
create function public.void_sale(p_store uuid,p_key uuid,p_sale uuid,p_reason text) returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid; s public.sales; line public.sale_items; balance numeric; begin
 if not private.is_member(p_store,true) then raise exception 'Manager authentication required'; end if;
 if p_reason is null or length(trim(p_reason))=0 then raise exception 'Reason required'; end if;
 result:=private.begin_operation(p_store,p_key,'void',jsonb_build_array(p_sale,p_reason)); if result is not null then return result; end if;
 select * into strict s from public.sales where store_id=p_store and id=p_sale for update;
 if s.status<>'completed' or exists(select 1 from public.refunds where store_id=p_store and sale_id=p_sale) then raise exception 'Cannot void this sale'; end if;
 for line in select * from public.sale_items where store_id=p_store and sale_id=p_sale order by product_id loop
 update public.stock_balances set quantity=quantity+line.quantity where store_id=p_store and product_id=line.product_id returning quantity into balance;
 insert into public.stock_movements(store_id,product_id,quantity_delta,balance_after,kind,sale_item_id) values(p_store,line.product_id,line.quantity,balance,'void',line.id);
 end loop;
 insert into public.payment_reversals(store_id,payment_id,amount_minor,reason) select p_store,id,amount_minor,p_reason from public.payments where store_id=p_store and sale_id=p_sale;
 update public.sales set status='voided',voided_at=now(),version=version+1 where id=p_sale;
 insert into public.audit_events(store_id,actor_id,action,entity_id,metadata) values(p_store,auth.uid(),'sale.voided',p_sale,jsonb_build_object('reason',p_reason));
 update private.operation_requests set result_id=p_sale where store_id=p_store and request_key=p_key; return p_sale;
end $$;
revoke all on function public.register_product(uuid,uuid,uuid,text,text,bigint,text,numeric,numeric,numeric),public.checkout(uuid,uuid,uuid,jsonb,jsonb,uuid),public.refund_sale(uuid,uuid,uuid,text,jsonb),public.void_sale(uuid,uuid,uuid,text) from public,anon;
grant execute on function public.register_product(uuid,uuid,uuid,text,text,bigint,text,numeric,numeric,numeric),public.checkout(uuid,uuid,uuid,jsonb,jsonb,uuid),public.refund_sale(uuid,uuid,uuid,text,jsonb),public.void_sale(uuid,uuid,uuid,text) to authenticated;
