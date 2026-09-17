import ts from 'typescript';
import {readFile,writeFile} from 'node:fs/promises';
const source=await readFile('src/model.ts','utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {products,categories}=await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
const quote=s=>`'${String(s).replaceAll("'","''")}'`;
const uuid=n=>`20000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
const store=uuid(1);
const palette=['#DDC76F','#D17F8B','#C6C4C6','#86B7D5','#DFA07E','#D5BFA2','#A7CE7E','#D9AFC0','#72B9B0'];
let sql=`-- Synthetic catalog only: no saved browser transactions or real users.\ninsert into public.stores(id,name) values('${store}','ميزان — تجربة محلية');\ninsert into public.terminals(id,store_id,name) values('${uuid(2)}','${store}','جهاز تجريبي');\n`;
categories.forEach((c,i)=>{if(c.id==='all')return;sql+=`insert into public.categories(id,store_id,name,color_hex,sort_order,legacy_id) values('${uuid(100+i)}','${store}',${quote(c.name)},'${palette[i]}',${i},${quote(c.id)});\n`;});
products.forEach((p,i)=>{
 const id=uuid(1000+i),category=uuid(100+categories.findIndex(c=>c.id===p.category));
 sql+=`insert into public.products(id,store_id,category_id,name,selling_price_minor,tax_rate,legacy_id) values('${id}','${store}','${category}',${quote(p.name)},${p.price*1000},${p.tax},${quote(p.id)});\ninsert into public.product_barcodes(store_id,product_id,barcode) values('${store}','${id}',${quote(p.barcode)});\ninsert into public.stock_balances(store_id,product_id,quantity,last_purchase_cost_minor) values('${store}','${id}',${p.stock},${p.cost*1000});\ninsert into public.stock_movements(store_id,product_id,quantity_delta,balance_after,kind) values('${store}','${id}',${p.stock},${p.stock},'opening');\n`;
});
await writeFile('supabase/seed.sql',sql);
console.log(`Seed generated: ${products.length} products, original legacy IDs and prices preserved.`);
