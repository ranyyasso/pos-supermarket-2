-- Temporary prototype access for an app that does not have Supabase Auth yet.
-- Copy and paste this file into the Supabase SQL Editor after migration 0001.
-- Replace these policies with authenticated role policies when Auth is added.

create policy "anonymous users can read manual products"
on public.manual_products for select to anon using (true);

create policy "anonymous users can create manual products"
on public.manual_products for insert to anon with check (true);

create policy "anonymous users can update manual products"
on public.manual_products for update to anon using (true) with check (true);

create policy "anonymous users can delete manual products"
on public.manual_products for delete to anon using (true);

create policy "anonymous users can read barcode products"
on public.barcode_products for select to anon using (true);

create policy "anonymous users can create barcode products"
on public.barcode_products for insert to anon with check (true);

create policy "anonymous users can update barcode products"
on public.barcode_products for update to anon using (true) with check (true);

create policy "anonymous users can delete barcode products"
on public.barcode_products for delete to anon using (true);
