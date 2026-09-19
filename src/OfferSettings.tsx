import { NumberStepper } from "./NumberStepper";
import { useEffect, useRef, useState } from 'react';
import { categories, normalizeDigits, uid } from './model';
import { loadSalesSettings, saveSalesSettings, validOffer, type SalesSettings, type StoreOffer } from './salesSettings';
const emptyOffer = (): StoreOffer => ({id:uid(),name:'',code:'',kind:'percent',value:10,minimumSpend:0,category:'',active:true});
export function OfferSettings({autoSaveEnabled=true,saveAction,value,onSave,approve,onDirtyChange}:{autoSaveEnabled?:boolean;saveAction?: {current: ((done:()=>void)=>void) | null};onDirtyChange:(dirty:boolean)=>void;value:SalesSettings;onSave:(value:SalesSettings)=>void;approve:(title:string,run:()=>void)=>void}) {
  const [draft,setDraft] = useState(emptyOffer);
  const [message,setMessage] = useState('');
  const attempted = useRef('');
  const baseline=(value.offers||[]).find(o=>o.id===draft.id)||{id:draft.id,name:'',code:'',kind:'percent',value:10,minimumSpend:0,category:'',active:true};
  const dirty=JSON.stringify(baseline)!==JSON.stringify(draft);
  useEffect(()=>{const baseline=(value.offers||[]).find(o=>o.id===draft.id)||{id:draft.id,name:'',code:'',kind:'percent',value:10,minimumSpend:0,category:'',active:true};onDirtyChange(JSON.stringify(baseline)!==JSON.stringify(draft));},[draft,value,onDirtyChange]);
  function persist(next:SalesSettings, done?:()=>void) {
    try {saveSalesSettings(next);onSave(next);setMessage('تم الحفظ');done?.();} catch(error) {setMessage(error instanceof Error?error.message:'تعذر الحفظ');}
  }
  function save(done?:()=>void) {
    attempted.current=JSON.stringify(draft);
    if(!validOffer(draft)){setMessage('أدخل اسم العرض وقيمة صحيحة ورمزاً من 2 إلى 32 حرفاً لاتينياً أو رقماً، أو اترك الرمز فارغاً');return;}
    const offers=[...(loadSalesSettings().offers||[]).filter(o=>o.id!==draft.id),draft];
    if(draft.code && (['WELCOME10','DESSERT5','JUICE2'].includes(draft.code)||offers.some(o=>o.id!==draft.id&&o.code===draft.code))){setMessage('رمز الكوبون مكرر أو محجوز للتجربة');return;}
    approve('حفظ إعدادات العرض',()=>persist({...loadSalesSettings(),offers},done));
  }
  useEffect(()=>{if(saveAction) saveAction.current=save;});
  useEffect(()=>{
    if(!autoSaveEnabled || attempted.current===JSON.stringify(draft)) return;
    const baseline=(value.offers||[]).find(o=>o.id===draft.id);
    if(JSON.stringify(baseline)===JSON.stringify(draft) || (!baseline && !draft.name && !draft.code)) return;
    if(!validOffer(draft)){setMessage('أكمل اسم العرض وقيمته ورمزه الصحيح للحفظ التلقائي');return;}
    const timer=window.setTimeout(()=>save(),800);
    return ()=>window.clearTimeout(timer);
  },[draft,autoSaveEnabled]);
  return <section className="settings-form">
    <p className="printer-note">تُحفظ تغييرات العرض تلقائياً.</p>
    <p>لا تجمع العروض والكوبونات وأسعار الجملة والخصومات اليدوية. يطبق أكبر عرض تلقائي مؤهل فقط؛ الخصم المختار يوقف العروض التلقائية.</p>
    <div className="choice-list">{(value.offers||[]).map(offer=><button key={offer.id} disabled={dirty} onClick={()=>{setDraft({...offer});setMessage('');}}><span>{offer.name} · {offer.code||'تلقائي'}</span><span>{offer.active?'مفعّل':'متوقف'}</span></button>)}</div>
    <button className="btn" disabled={dirty} onClick={()=>{setDraft(emptyOffer());setMessage('');}}>عرض جديد</button>
    <div className="printer-fields">
      <label>اسم العرض<input value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})} maxLength={80}/></label>
      <label>رمز الكوبون الاختياري<input value={draft.code} placeholder="فارغ للعرض التلقائي" onChange={e=>setDraft({...draft,code:normalizeDigits(e.target.value).trim().toUpperCase()})} maxLength={32}/></label>
      <label>نوع العرض<select value={draft.kind} onChange={e=>setDraft({...draft,kind:e.target.value as StoreOffer['kind']})}><option value="percent">نسبة مئوية</option><option value="fixed">مبلغ ثابت</option></select></label>
      <label>قيمة العرض<NumberStepper  min={1} value={draft.value} onValueChange={value =>setDraft({...draft,value:Number(value)})}/></label>
      <label>الحد الأدنى للشراء<NumberStepper  min={0} value={draft.minimumSpend} onValueChange={value =>setDraft({...draft,minimumSpend:Number(value)})}/></label>
      <label>فئة العرض<select value={draft.category} onChange={e=>setDraft({...draft,category:e.target.value})}><option value="">كل الأصناف المؤهلة</option>{categories.filter(c=>c.id!=='all').map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
    </div>

    {message&&<p role="alert">{message}</p>}
  </section>;
}

export function DemoSettings({value,onSave,approve}:{value:SalesSettings;onSave:(value:SalesSettings)=>void;approve:(title:string,run:()=>void)=>void}) {
 const [error,setError]=useState('');
 return <fieldset className="settings-group"><legend>وضع التجربة</legend><label className="printer-enabled"><input type="checkbox" checked={value.demoMode!==false} onChange={e=>{const enabled=e.target.checked;approve('تغيير وضع التجربة',()=>{try{const next={...loadSalesSettings(),demoMode:enabled};saveSalesSettings(next);onSave(next);setError('');}catch{setError('تعذر حفظ وضع التجربة');}});}}/><span>وضع التجربة</span></label><p className="printer-note">إيقاف وضع التجربة يخفي رموز المساعدة ويوقف العروض التجريبية. العمليات المالية في هذه النسخة تبقى محاكاة.</p>{error&&<p role="alert">{error}</p>}</fieldset>;
}
