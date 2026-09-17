import { productById, products, legacyPrice, inventoryMovements, type State } from './model';
export const localDay=(value:string|Date)=>{const d=new Date(value);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
export function buildDailyReport(state:State,now=new Date(),from=localDay(now),to=from){
 const within=(at:string)=>localDay(at)>=from&&localDay(at)<=to;
 const completed=state.transactions.filter(t=>t.status==='completed'&&within(t.completedAt||t.sale.createdAt));
 const refunds=state.refunds.filter(r=>!r.reason.startsWith('إلغاء:')&&state.transactions.some(t=>t.sale.id===r.transactionId&&t.status==='completed')&&within(r.at||state.transactions.find(t=>t.sale.id===r.transactionId)!.sale.createdAt));
 const paymentTotals={cash:0,card:0,contactless:0};
 completed.forEach(t=>t.payments.forEach(p=>paymentTotals[p.method]+=p.amount));
 refunds.forEach(r=>r.allocations.forEach(a=>{if(a.method in paymentTotals)paymentTotals[a.method as keyof typeof paymentTotals]-=a.amount;}));
 const sold=new Map<string,{productId:string;name:string;quantity:number;revenue:number;profit:number;missingCost:boolean}>();
 let estimatedProfit=0,missingCostLines=0;
 const addLines=(tx:typeof completed[number],quantities?:Record<string,number>)=>{
  const pricing=tx.pricing||legacyPrice(tx.sale);
  for(const line of tx.sale.lines){
   const count=quantities?quantities[line.id]||0:line.quantity;if(!count)continue;
   const direction=quantities?-1:1,ratio=count/line.quantity,quantity=(line.scaleWeight||line.quantity)*ratio*direction;
   const row=pricing.rows.find(r=>r.id===line.id);if(!row)continue;
   const revenue=Math.round(row.net*ratio)*direction,cost=tx.unitCosts?.[line.id];
   const known=typeof cost==='number'&&Number.isFinite(cost)&&cost>=0;
   const profit=known?revenue-Math.round(cost*quantity):0;
   if(!known)missingCostLines++;
   estimatedProfit+=profit;
   const prior=sold.get(line.productId)||{productId:line.productId,name:productById(line.productId)?.name||line.productId,quantity:0,revenue:0,profit:0,missingCost:false};
   sold.set(line.productId,{...prior,quantity:prior.quantity+quantity,revenue:prior.revenue+revenue,profit:prior.profit+profit,missingCost:prior.missingCost||!known});
  }
 };
 completed.forEach(t=>addLines(t));refunds.forEach(r=>addLines(state.transactions.find(t=>t.sale.id===r.transactionId)!,r.lines));
 const grossSales=completed.reduce((v,t)=>v+t.total,0),refundTotal=refunds.reduce((v,r)=>v+r.total,0);
 const productDetails=[...sold.values()].sort((a,b)=>b.quantity-a.quantity);
 return {date:from===to?from:`${from} — ${to}`,completedCount:completed.length,voidCount:state.transactions.filter(t=>t.status==='void'&&within(t.completedAt||t.sale.createdAt)).length,grossSales,refundTotal,refundCount:refunds.length,netSales:grossSales-refundTotal,estimatedProfit,missingCostLines,paymentTotals,productDetails,bestSellers:productDetails.filter(p=>p.quantity>0).slice(0,8),
 sales:completed.map(t=>({id:t.sale.id,at:t.completedAt||t.sale.createdAt,total:t.total})),refundDetails:refunds.map(r=>({id:r.id,saleId:r.transactionId,at:r.at||'',total:r.total,reason:r.reason})),
 movements:inventoryMovements().filter(m=>within(m.at)),legacyDates:refunds.some(r=>!r.at)||completed.some(t=>!t.completedAt),
 lowStock:products.filter(p=>p.available!==false&&p.stock<=(p.minStock??5)).map(p=>({productId:p.id,name:p.name,stock:p.stock,minimum:p.minStock??5}))};
}
export type DailyReport=ReturnType<typeof buildDailyReport>;
const csvCell=(v:string|number)=>`"${String(v).replace(/^[=+@-]/,"'$&").replace(/"/g,'""')}"`;
export function dailyReportCsv(r:DailyReport){
 const rows:(string|number)[][]=[['تقرير المبيعات اليومي',r.date],['المبيعات المكتملة',r.completedCount],['المبيعات الإجمالية',r.grossSales],['الاسترجاعات',r.refundTotal],['صافي المبيعات',r.netSales],['الربح التقديري للتكلفة المعروفة',r.estimatedProfit],['سطور بلا تكلفة تاريخية',r.missingCostLines],[],['طريقة الدفع','الصافي'],...Object.entries(r.paymentTotals),[],['المبيعات','التاريخ','الإجمالي'],...r.sales.map(t=>[t.id,t.at,t.total]),[],['الاسترجاعات','الإيصال','التاريخ','الإجمالي','السبب'],...r.refundDetails.map(x=>[x.id,x.saleId,x.at||'تاريخ غير مسجل',x.total,x.reason]),[],['الأصناف','الكمية','صافي الإيراد','الربح التقديري'],...r.productDetails.map(p=>[p.name,p.quantity,p.revenue,p.missingCost?'تكلفة غير مكتملة':p.profit]),[],['حركات المخزون','التاريخ','الصنف','الكمية','الرصيد','المورّد','المرجع','تكلفة الوحدة'],...r.movements.map(m=>[m.type,m.at,productById(m.productId)?.name||m.productId,m.delta,m.balance,m.supplier||'',m.reference,m.unitCost??'']),[],['المخزون المنخفض','المتوفر','الحد الأدنى'],...r.lowStock.map(p=>[p.name,p.stock,p.minimum])];
 return '\uFEFF'+rows.map(row=>row.map(csvCell).join(',')).join('\r\n');
}
