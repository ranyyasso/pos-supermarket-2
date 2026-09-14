import {describe,it,expect} from 'vitest';
import {buildDailyReport,dailyReportCsv} from './reports';
import {price,seed,type Transaction} from './model';

describe('daily supermarket reports',()=>{
  it('excludes voids and subtracts refunds from sales, tenders, quantities and profit',()=>{
    const state=seed(), today='2026-09-14T10:00:00Z';
    const sale={...state.sale,id:'900',createdAt:today,lines:[{id:'line',productId:'p1',quantity:2}]};
    const pricing=price(sale);
    const tx:Transaction={sale,payments:[{id:'pay',method:'cash',amount:pricing.total,tendered:pricing.total,change:0}],total:pricing.total,status:'completed',refunded:{line:1},pricing};
    const voidSale={...sale,id:'901'};
    state.transactions=[tx,{...tx,sale:voidSale,status:'void'}];
    state.refunds=[{id:'refund',transactionId:'900',lines:{line:1},total:pricing.total/2,reason:'مرتجع',allocations:[{method:'cash',amount:pricing.total/2}]}];
    const report=buildDailyReport(state,new Date(today));
    expect(report).toMatchObject({completedCount:1,voidCount:1,refundCount:1,netSales:pricing.total/2});
    expect(report.paymentTotals.cash).toBe(pricing.total/2);
    expect(report.bestSellers[0]).toMatchObject({productId:'p1',quantity:1});
    expect(report.estimatedProfit).toBe(2400);
  });
  it('creates an Excel-friendly Arabic CSV export',()=>{
    const csv=dailyReportCsv(buildDailyReport(seed(),new Date('2026-09-14T10:00:00Z')));
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('"صافي المبيعات"');
    expect(csv).toContain('"المخزون المنخفض"');
  });
});
