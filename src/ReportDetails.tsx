import {dateTime,money,number,productById} from './model';
import type {DailyReport} from './reports';
export function ReportDetails({report:r,view}:{report:DailyReport;view:string}){
 let headings:string[]=[],rows:(string|number)[][]=[];
 if(view==='summary')return null;
 if(view==='sales'){headings=['الإيصال','التاريخ','الإجمالي'];rows=r.sales.map(t=>[t.id,dateTime(t.at),money(t.total)]);}
 if(view==='refunds'){headings=['الإيصال','تاريخ الاسترجاع','المبلغ','السبب'];rows=r.refundDetails.map(t=>[t.saleId,t.at?dateTime(t.at):'غير مسجل',money(t.total),t.reason]);}
 if(view==='products'){headings=['الصنف','صافي الكمية','صافي الإيراد','الربح التقديري'];rows=r.productDetails.map(p=>[p.name,number(p.quantity,{maximumFractionDigits:3}),money(p.revenue),p.missingCost?'تكلفة غير مكتملة':money(p.profit)]);}
 if(view==='movements'||view==='receiving'){headings=['الصنف','التاريخ','النوع','الكمية','الرصيد','المورّد','المرجع','تكلفة الوحدة'];rows=r.movements.filter(m=>view!=='receiving'||m.type==='receive').map(m=>[productById(m.productId)?.name||m.productId,dateTime(m.at),({sale:'بيع',refund:'استرجاع',void:'إلغاء',receive:'استلام',adjust:'تسوية'})[m.type],number(m.delta),number(m.balance),m.supplier||'—',m.reference,m.unitCost===undefined?'—':money(m.unitCost)]);}
 return <div className="detailed-report">{rows.length?<table><thead><tr>{headings.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row,i)=><tr key={i}>{row.map((cell,j)=><td key={j}>{cell}</td>)}</tr>)}</tbody></table>:<p role="status">لا توجد سجلات في الفترة المحددة</p>}</div>;
}
