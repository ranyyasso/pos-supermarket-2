import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import pg from 'pg';

test('PostgreSQL migrations, access control, stock posting and recovery', async () => {
 let db;
 let admin;
 const databaseName = `mizan_test_${Date.now()}`;
 if(process.env.MIZAN_TEST_POSTGRES === '1') {
   const config={host:'127.0.0.1',port:55322,user:'postgres',password:'postgres'};
   admin=new pg.Client({...config,database:'postgres'}); await admin.connect();
   await admin.query(`create database ${databaseName}`);
   const client=new pg.Client({...config,database:databaseName}); await client.connect();
   db={exec:sql=>client.query(sql),query:(sql,args)=>client.query(sql,args),close:async()=>{await client.end();await admin.query(`drop database ${databaseName}`);await admin.end();}};
 } else db = new PGlite();
 try {
 await db.exec(`do $$ begin if not exists(select 1 from pg_roles where rolname='anon') then create role anon; end if; if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated; end if; end $$; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$; grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;`);
 for(const f of (await readdir('supabase/migrations')).filter(f=>f.endsWith('.sql')).sort()) await db.exec(await readFile(`supabase/migrations/${f}`,'utf8'));
 const store='00000000-0000-0000-0000-000000000001', other='00000000-0000-0000-0000-000000000002', manager='00000000-0000-0000-0000-000000000003', cashier='00000000-0000-0000-0000-000000000004', category='00000000-0000-0000-0000-000000000005', terminal='00000000-0000-0000-0000-000000000006', supplier='00000000-0000-0000-0000-000000000007';
 const key = n=>`10000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
 const scalar=async(sql,args=[])=>Object.values((await db.query(sql,args)).rows[0])[0];
 await db.exec(`insert into auth.users values('${manager}'),('${cashier}'); insert into public.stores(id,name) values('${store}','Test'),('${other}','Other'); insert into public.store_memberships values('${store}','${manager}','manager',true),('${store}','${cashier}','cashier',true); insert into public.categories(id,store_id,name,color_hex) values('${category}','${store}','Snacks','#D17F8B'); insert into public.terminals(id,store_id,name) values('${terminal}','${store}','Till'); insert into public.suppliers(id,store_id,name) values('${supplier}','${store}','Supplier'); set role authenticated; select set_config('request.jwt.claim.sub','${manager}',false);`);
 assert.equal(await scalar('select count(*)::int from stores'),1,'other store is hidden');
 await assert.rejects(db.exec(`insert into stores(name) values('Forged')`),/permission denied/);
 const product=await scalar('select register_product($1,$2,$3,$4,$5,$6)',[store,key(1),category,'Milk','001234',8000000]);
 assert.equal(await scalar('select register_product($1,$2,$3,$4,$5,$6)',[store,key(1),category,'Milk','001234',8000000]),product);
 await assert.rejects(db.query('select register_product($1,$2,$3,$4,$5,$6)',[store,key(2),category,'Duplicate','001234',8000000]),/unique/);
 const delivery=JSON.stringify([{product_id:product,quantity:5,unit_cost_minor:5000000}]);
 const receipt=await scalar('select post_receipt($1,$2,$3,$4,$5)',[store,key(3),supplier,'DEL-1',delivery]);
 assert.equal(await scalar('select post_receipt($1,$2,$3,$4,$5)',[store,key(3),supplier,'DEL-1',delivery]),receipt);
 assert.equal(Number(await scalar('select quantity from stock_balances')),5);
 await assert.rejects(db.query('select post_receipt($1,$2,$3,$4,$5)',[store,key(3),supplier,'ALTERED',delivery]),/different payload/);
 await db.exec(`select set_config('request.jwt.claim.sub','${cashier}',false)`);
 await assert.rejects(db.query('select post_receipt($1,$2,$3,$4,$5)',[store,key(4),supplier,'DEL-2',delivery]),/Manager/);
 const items=JSON.stringify([{product_id:product,quantity:2}]), payments=JSON.stringify([{method:'cash',amount_minor:16000000}]);
 await assert.rejects(db.query('select checkout($1,$2,$3,$4,$5)',[store,key(5),terminal,items,'[]']),/Payments/);
 assert.equal(await scalar('select count(*)::int from sales'),0,'failed checkout rolled back');
 const sale=await scalar('select checkout($1,$2,$3,$4,$5)',[store,key(6),terminal,items,payments]);
 assert.equal(await scalar('select checkout($1,$2,$3,$4,$5)',[store,key(6),terminal,items,payments]),sale);
 await assert.rejects(db.exec(`update sales set total_minor=0`),/permission denied/);
 await db.exec(`select set_config('request.jwt.claim.sub','${manager}',false)`);
 assert.equal(Number(await scalar('select quantity from stock_balances')),3);
 assert.equal(Number(await scalar('select unit_cost_minor from sale_items')),5000000);
 const line=await scalar('select id from sale_items');
 await scalar('select refund_sale($1,$2,$3,$4,$5)',[store,key(7),sale,'Return',JSON.stringify([{sale_item_id:line,quantity:1}])]);
 assert.equal(Number(await scalar('select quantity from stock_balances')),4);
 assert.equal(Number(await scalar('select sum(amount_minor) from refund_payments')),8000000);
 await assert.rejects(db.query('select refund_sale($1,$2,$3,$4,$5)',[store,key(8),sale,'Too many',JSON.stringify([{sale_item_id:line,quantity:2}])]),/quantity/);
 await assert.rejects(db.query('select void_sale($1,$2,$3,$4)',[store,key(9),sale,'Void']),/Cannot void/);
 const sale2=await scalar('select checkout($1,$2,$3,$4,$5)',[store,key(10),terminal,items,payments]);
 await scalar('select void_sale($1,$2,$3,$4)',[store,key(11),sale2,'Mistake']);
 await scalar('select void_sale($1,$2,$3,$4)',[store,key(11),sale2,'Mistake']);
 assert.equal(Number(await scalar('select quantity from stock_balances')),4);
 assert.equal(Number(await scalar('select sum(amount_minor) from payment_reversals')),16000000);
 await assert.rejects(db.query('select checkout($1,$2,$3,$4,$5)',[store,key(12),terminal,JSON.stringify([{product_id:product,quantity:99}]),payments]),/Insufficient/);
 // Cross-store foreign keys reject valid IDs belonging to a different store.
 await db.exec(`reset role; insert into public.categories(id,store_id,name,color_hex) values('${key(90)}','${other}','Other category','#D17F8B'); set role authenticated;`);
 await assert.rejects(db.query('select register_product($1,$2,$3,$4,$5,$6)',[store,key(91),key(90),'Wrong store','991234',1]),/foreign key/);
 if(admin) {
   const workers=await Promise.all([1,2].map(async()=>{const c=new pg.Client({host:'127.0.0.1',port:55322,user:'postgres',password:'postgres',database:databaseName});await c.connect();await c.query(`set role authenticated; select set_config('request.jwt.claim.sub','${cashier}',false)`);return c;}));
   try {
     const outcomes=await Promise.allSettled(workers.map((c,i)=>c.query('select checkout($1,$2,$3,$4,$5)',[store,key(100+i),terminal,JSON.stringify([{product_id:product,quantity:3}]),JSON.stringify([{method:'cash',amount_minor:24000000}])])));
     assert.equal(outcomes.filter(x=>x.status==='fulfilled').length,1,'one concurrent checkout succeeds');
     assert.equal(outcomes.filter(x=>x.status==='rejected').length,1,'overselling checkout rejected');
     assert.equal(Number(await scalar('select quantity from stock_balances')),1);
   } finally {await Promise.all(workers.map(c=>c.end()));}
 }
 await db.exec(`reset role; update public.store_memberships set active=false where user_id='${manager}'; set role authenticated;`);
 assert.equal(await scalar('select count(*)::int from stores'),0,'disabled membership denied');
 await db.exec('reset role; set role anon');
 await assert.rejects(db.exec('select * from sales'),/permission denied/);
 } finally { await db.close(); }
});
