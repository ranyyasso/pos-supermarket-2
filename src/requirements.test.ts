import {it,expect,vi,afterEach} from 'vitest';
import {seed,reducer,price,cashPayment,products,receiveInventory,hydrateInventory,generateInternalBarcode} from './model';
import {buildDailyReport} from './reports';
const original=products.map(p=>({...p}));
afterEach(()=>{vi.unstubAllGlobals();products.forEach((p,i)=>Object.assign(p,original[i]));});
it('snapshots costs and recognizes a later refund on its execution date',()=>{
 const state=seed();state.sale.lines=[{id:'line',productId:'p1',quantity:2}];
 const complete=reducer(state,{type:'complete',payments:[cashPayment(price(state.sale).total,price(state.sale).total)]});
 const tx=complete.transactions[0];tx.completedAt='2026-09-14T12:00:00';
 products[0].cost=1;
 complete.refunds=[{id:'refund',transactionId:tx.sale.id,at:'2026-09-15T12:00:00',lines:{line:1},total:8800,reason:'عودة',allocations:[{method:'cash',amount:8800}]}];
 expect(buildDailyReport(complete,new Date('2026-09-14T12:00:00')).estimatedProfit).toBe(4800);
 const next=buildDailyReport(complete,new Date('2026-09-15T12:00:00'));
 expect(next.netSales).toBe(-8800);expect(next.estimatedProfit).toBe(-2400);expect(next.paymentTotals.cash).toBe(-8800);
});
it('marks unknown historical cost instead of counting it as zero',()=>{
 const state=seed();const completed=reducer(state,{type:'complete',payments:[cashPayment(price(state.sale).total,price(state.sale).total)]});
 delete completed.transactions[0].unitCosts;
 const report=buildDailyReport(completed);
 expect(report.missingCostLines).toBeGreaterThan(0);expect(report.estimatedProfit).toBe(0);
});
it('receiving persists quantity and delivery cost together and refuses failed storage',()=>{
 const data=new Map<string,string>();vi.stubGlobal('localStorage',{getItem:(k:string)=>data.get(k)||null,setItem:(k:string,v:string)=>data.set(k,v)});
 const oldStock=products[0].stock;
 receiveInventory('p1',3,6000,'Supplier','DEL-1');products[0].cost=1;products[0].stock=1;hydrateInventory();
 expect(products[0].stock).toBe(oldStock+3);expect(products[0].cost).toBe(6000);
 vi.stubGlobal('localStorage',{getItem:(k:string)=>data.get(k)||null,setItem:()=>{throw new Error('full');}});
 expect(()=>receiveInventory('p1',3,7000,'Supplier','DEL-2')).toThrow('full');
 expect(products[0].stock).toBe(oldStock+3);expect(products[0].cost).toBe(6000);
});
it('generates an internal barcode outside the existing catalog',()=>{
 const code=generateInternalBarcode();expect(code).toMatch(/^99\d{10}$/);expect(products.some(p=>p.barcode===code)).toBe(false);
});
