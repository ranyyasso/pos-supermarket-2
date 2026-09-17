import { useEffect, useState } from 'react';
import { products, normalizeDigits } from './model';
import { loadSalesSettings, saveSalesSettings, type SalesSettings } from './salesSettings';

export function WholesaleSettings({ saveAction, value, onSave, approve, onDirtyChange }: { saveAction?: {current: ((done:()=>void)=>void) | null};  onDirtyChange:(dirty:boolean)=>void; value: SalesSettings; onSave: (value: SalesSettings) => void; approve: (title: string, run: () => void) => void }) {
  const [productId, setProductId] = useState(products[0].id);
  const [amount, setAmount] = useState(value.wholesale[productId]?.price.toString() || '');
  const [minimum, setMinimum] = useState(value.wholesale[productId]?.minimum.toString() || '1');
  const [message, setMessage] = useState('');
  useEffect(()=>{onDirtyChange(amount !== (value.wholesale[productId]?.price.toString() || '') || minimum !== (value.wholesale[productId]?.minimum.toString() || '1'));},[amount,minimum,productId,value,onDirtyChange]);
  function persist(next: SalesSettings, done?:()=>void) {
    try { saveSalesSettings(next); onSave(next); setMessage('تم حفظ إعدادات الجملة');done?.(); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'تعذر الحفظ'); }
  }
  function save(done?:()=>void) {
    const product = products.find(p => p.id === productId)!;
    if (amount !== '' && (!Number.isSafeInteger(Number(amount)) || Number(amount) < 0 || Number(amount) >= product.price || !Number.isSafeInteger(Number(minimum)) || Number(minimum) < 1 || Number(minimum) > 999)) {
      setMessage('أدخل سعراً أقل من سعر المفرد وحداً أدنى من 1 إلى 999'); return;
    }
    const wholesale = { ...value.wholesale };
    if (amount === '') delete wholesale[productId];
    else wholesale[productId] = { price: Number(amount), minimum: Number(minimum) };
    approve('حفظ سعر الجملة', () => persist({ ...loadSalesSettings(), wholesale }, done));
  }
  useEffect(()=>{if(saveAction) saveAction.current=save;});
  return <section className="settings-form">
    <label className="printer-enabled"><input type="checkbox" checked={value.wholesaleEnabled} onChange={e => { const enabled = e.target.checked; approve('تغيير تفعيل البيع بالجملة', () => persist({ ...value, wholesaleEnabled: enabled })); }}/><span>تفعيل البيع بالجملة</span></label>
    <p>يطبق سعر الجملة عند بلوغ الحد الأدنى للصنف. الأصناف بلا سعر جملة تبقى بسعر المفرد؛ ملصقات الميزان تحتفظ بسعرها.</p>
    <div className="printer-fields">
      <label>صنف الجملة<select value={productId} onChange={e => {const id=e.target.value; setProductId(id); setAmount(value.wholesale[id]?.price.toString() || ''); setMinimum(value.wholesale[id]?.minimum.toString() || '1'); setMessage('');}}>{products.map(p => <option key={p.id} value={p.id}>{p.name} · {p.barcode}</option>)}</select></label>
      <label>سعر الجملة الاختياري<input inputMode="numeric" placeholder="سعر المفرد" value={amount} onChange={e => setAmount(normalizeDigits(e.target.value))}/></label>
      <label>الحد الأدنى للجملة<input inputMode="numeric" value={minimum} onChange={e => setMinimum(normalizeDigits(e.target.value))}/></label>
    </div>
    <button className="btn primary" onClick={()=>save()}>حفظ سعر الجملة</button>
    {message && <p role="status">{message}</p>}
  </section>;
}
