import { productById, products, price, type Refund, type State, type Transaction } from './model';

export type DailyReport = {
  date: string;
  completedCount: number;
  voidCount: number;
  grossSales: number;
  refundTotal: number;
  refundCount: number;
  netSales: number;
  estimatedProfit: number;
  paymentTotals: Record<'cash'|'card'|'contactless',number>;
  bestSellers: {productId:string;name:string;quantity:number;revenue:number}[];
  lowStock: {productId:string;name:string;stock:number;minimum:number}[];
};

const localDay = (value: string | Date) => {
  const d = value instanceof Date ? value : new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};
const refundsFor = (refunds: Refund[], tx: Transaction) => refunds.filter(r => r.transactionId === tx.sale.id && !r.reason.startsWith('إلغاء:'));

export function buildDailyReport(state: State, now = new Date()): DailyReport {
  const date=localDay(now), todays=state.transactions.filter(tx=>localDay(tx.sale.createdAt)===date);
  const completed=todays.filter(tx=>tx.status==='completed'), voids=todays.filter(tx=>tx.status==='void');
  const refunds=completed.flatMap(tx=>refundsFor(state.refunds,tx));
  const paymentTotals={cash:0,card:0,contactless:0};
  completed.forEach(tx=>tx.payments.forEach(p=>paymentTotals[p.method]+=p.amount));
  refunds.forEach(r=>r.allocations.forEach(a=>{if(a.method in paymentTotals)paymentTotals[a.method as keyof typeof paymentTotals]-=a.amount;}));
  const sold=new Map<string,{quantity:number;revenue:number}>();
  let profit=0;
  for(const tx of completed){
    const pricing=tx.pricing||price(tx.sale);
    const txRefunds=refundsFor(state.refunds,tx);
    for(const line of tx.sale.lines){
      const product=productById(line.productId), row=pricing.rows.find(r=>r.id===line.id)!;
      const refunded=txRefunds.reduce((sum,r)=>sum+(r.lines[line.id]||0),0);
      const ratio=Math.max(0,(line.quantity-refunded)/line.quantity);
      const quantity=(line.scaleWeight||line.quantity)*ratio;
      const revenue=Math.round(row.net*ratio);
      const prior=sold.get(product.id)||{quantity:0,revenue:0};
      sold.set(product.id,{quantity:prior.quantity+quantity,revenue:prior.revenue+revenue});
      profit+=revenue-Math.round((product.cost||0)*quantity);
    }
  }
  const grossSales=completed.reduce((sum,tx)=>sum+tx.total,0), refundTotal=refunds.reduce((sum,r)=>sum+r.total,0);
  return {date,completedCount:completed.length,voidCount:voids.length,grossSales,refundTotal,refundCount:refunds.length,
    netSales:grossSales-refundTotal,estimatedProfit:profit,paymentTotals,
    bestSellers:[...sold].filter(([,v])=>v.quantity>0).map(([productId,v])=>({productId,name:productById(productId).name,...v})).sort((a,b)=>b.quantity-a.quantity||b.revenue-a.revenue).slice(0,8),
    lowStock:[...new Map(products.map(p=>[p.id,p])).values()].filter(p=>p.available!==false&&p.stock<=(p.minStock??5)).map(p=>({productId:p.id,name:p.name,stock:p.stock,minimum:p.minStock??5})).sort((a,b)=>a.stock-b.stock),
  };
}

const csvCell=(value:string|number)=>`"${String(value).replace(/"/g,'""')}"`;
export function dailyReportCsv(report: DailyReport) {
  const rows:(string|number)[][]=[
    ['تقرير المبيعات اليومي',report.date],['المبيعات المكتملة',report.completedCount],['المبيعات الإجمالية',report.grossSales],['الاسترجاعات',report.refundTotal],['صافي المبيعات',report.netSales],['الربح التقديري',report.estimatedProfit],['المعاملات الملغاة',report.voidCount],[],
    ['طريقة الدفع','الصافي'],['نقداً',report.paymentTotals.cash],['بطاقة مصرفية',report.paymentTotals.card],['دفع لاتلامسي',report.paymentTotals.contactless],[],
    ['الأصناف الأكثر مبيعاً','الكمية','الإيراد'],...report.bestSellers.map(p=>[p.name,Number(p.quantity.toFixed(3)),p.revenue]),[],
    ['المخزون المنخفض','المتوفر','الحد الأدنى'],...report.lowStock.map(p=>[p.name,p.stock,p.minimum]),
  ];
  return '\uFEFF'+rows.map(row=>row.map(csvCell).join(',')).join('\r\n');
}
