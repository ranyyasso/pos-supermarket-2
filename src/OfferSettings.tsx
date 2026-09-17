import { useEffect, useState } from 'react';
import { categories, normalizeDigits, uid } from './model';
import { saveSalesSettings, validOffer, type SalesSettings, type StoreOffer } from './salesSettings';
const emptyOffer = (): StoreOffer => ({id:uid(),name:'',code:'',kind:'percent',value:10,minimumSpend:0,category:'',active:false});
export function OfferSettings({value,onSave,approve,onDirtyChange}:{onDirtyChange:(dirty:boolean)=>void;value:SalesSettings;onSave:(value:SalesSettings)=>void;approve:(title:string,run:()=>void)=>void}) {
  const [draft,setDraft] = useState(emptyOffer);
  const [message,setMessage] = useState('');
  useEffect(()=>{const baseline=(value.offers||[]).find(o=>o.id===draft.id)||{id:draft.id,name:'',code:'',kind:'percent',value:10,minimumSpend:0,category:'',active:false};onDirtyChange(JSON.stringify(baseline)!==JSON.stringify(draft));},[draft,value,onDirtyChange]);
  function persist(next:SalesSettings) {
    try {saveSalesSettings(next);onSave(next);setMessage('تم الحفظ');} catch(error) {setMessage(error instanceof Error?error.message:'تعذر الحفظ');}
  }
  function save() {
    if(!validOffer(draft)){setMessage('أدخل اسم العرض وقيمة صحيحة ورمزاً من 2 إلى 32 حرفاً لاتينياً أو رقماً، أو اترك الرمز فارغاً');return;}
    const offers=[...(value.offers||[]).filter(o=>o.id!==draft.id),draft];
    if(draft.code && (['WELCOME10','DESSERT5','JUICE2'].includes(draft.code)||offers.some(o=>o.id!==draft.id&&o.code===draft.code))){setMessage('رمز الكوبون مكرر أو محجوز للتجربة');return;}
    approve('حفظ إعدادات العرض',()=>persist({...value,offers}));
  }
  return <section className="printer-settings">
    <label className="printer-enabled"><input type="checkbox" checked={value.demoMode!==false} onChange={e=>{const enabled=e.target.checked;approve('تغيير وضع التجربة',()=>persist({...value,demoMode:enabled}));}}/><span>وضع التجربة</span></label>
    <p>إيقاف وضع التجربة يخفي رموز المساعدة ويوقف العروض التجريبية. العمليات المالية في هذه النسخة تبقى محاكاة.</p>
    <p>لا تجمع العروض والكوبونات وأسعار الجملة والخصومات اليدوية. يطبق أكبر عرض تلقائي مؤهل فقط؛ الخصم المختار يوقف العروض التلقائية.</p>
    <div className="choice-list">{(value.offers||[]).map(offer=><button key={offer.id} onClick={()=>{setDraft({...offer});setMessage('');}}><span>{offer.name} · {offer.code||'تلقائي'}</span><span>{offer.active?'مفعّل':'متوقف'}</span></button>)}</div>
    <button className="btn" onClick={()=>{setDraft(emptyOffer());setMessage('');}}>عرض جديد</button>
    <div className="printer-fields">
      <label>اسم العرض<input value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})} maxLength={80}/></label>
      <label>رمز الكوبون الاختياري<input value={draft.code} placeholder="فارغ للعرض التلقائي" onChange={e=>setDraft({...draft,code:normalizeDigits(e.target.value).trim().toUpperCase()})} maxLength={32}/></label>
      <label>نوع العرض<select value={draft.kind} onChange={e=>setDraft({...draft,kind:e.target.value as StoreOffer['kind']})}><option value="percent">نسبة مئوية</option><option value="fixed">مبلغ ثابت</option></select></label>
      <label>قيمة العرض<input type="number" min={1} value={draft.value} onChange={e=>setDraft({...draft,value:Number(e.target.value)})}/></label>
      <label>الحد الأدنى للشراء<input type="number" min={0} value={draft.minimumSpend} onChange={e=>setDraft({...draft,minimumSpend:Number(e.target.value)})}/></label>
      <label>فئة العرض<select value={draft.category} onChange={e=>setDraft({...draft,category:e.target.value})}><option value="">كل الأصناف المؤهلة</option>{categories.filter(c=>c.id!=='all').map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
    </div>
    <label className="printer-enabled"><input type="checkbox" checked={draft.active} onChange={e=>setDraft({...draft,active:e.target.checked})}/><span>تفعيل العرض</span></label>
    <button className="btn primary" onClick={save}>حفظ العرض</button>
    {message&&<p role="alert">{message}</p>}
  </section>;
}
