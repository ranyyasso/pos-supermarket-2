import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import pg from 'pg';

test('local Supabase Auth and REST respect store membership',async()=>{
 const output=execFileSync(process.execPath,['node_modules/supabase/dist/supabase.js','status','-o','json'],{encoding:'utf8'});
 const status=JSON.parse(output.slice(output.indexOf('{')));
 assert.equal(status.API_URL,'http://127.0.0.1:55321','Never test against a remote or another local project');
 const options={auth:{persistSession:false,autoRefreshToken:false}};
 const admin=createClient(status.API_URL,status.SECRET_KEY||status.SERVICE_ROLE_KEY,options);
 const client=createClient(status.API_URL,status.PUBLISHABLE_KEY||status.ANON_KEY,options);
 const anonymous=createClient(status.API_URL,status.PUBLISHABLE_KEY||status.ANON_KEY,options);
 const email=`test-${randomUUID()}@example.test`,password=randomUUID()+'aA1!';
 const created=await admin.auth.admin.createUser({email,password,email_confirm:true});
 assert.ifError(created.error); const user=created.data.user.id;
 const db=new pg.Client({host:'127.0.0.1',port:55322,user:'postgres',password:'postgres',database:'postgres'});await db.connect();
 try {
  await db.query('insert into public.store_memberships(store_id,user_id,role) values($1,$2,$3)',['20000000-0000-0000-0000-000000000001',user,'cashier']);
  const signed=await client.auth.signInWithPassword({email,password});assert.ifError(signed.error);
  const catalog=await client.from('products').select('id,name,product_barcodes(barcode),categories(color_hex)');assert.ifError(catalog.error);assert.equal(catalog.data.length,21);
  const blocked=await anonymous.from('products').select('id');assert.ok(blocked.error,'anonymous catalog read denied');
  const mutation=await client.from('stock_balances').update({quantity:999}).eq('store_id','20000000-0000-0000-0000-000000000001');assert.ok(mutation.error,'browser stock write denied');
 } finally {
  await client.auth.signOut();
  await db.query('delete from public.store_memberships where user_id=$1',[user]);await db.end();
  const removed=await admin.auth.admin.deleteUser(user);assert.ifError(removed.error);
 }
});
