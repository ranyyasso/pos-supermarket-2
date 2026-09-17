import { useEffect, useState, type ReactNode } from 'react';
import { Printer, Save } from 'lucide-react';
import { normalizePrinterSettings, printerStorageKey, testPrintReceipt, type PrintReceipt, type PrinterSettings as Settings } from './printing';

export function PrinterSettings({ saveAction, value, onSave, onPreview, onDirtyChange, initialTab = "hardware", storeContent }: { saveAction?: {current: ((done:()=>void)=>void) | null}; initialTab?: "hardware" | "store" | "receipt"; storeContent?: ReactNode; value: Settings; onSave: (settings: Settings) => void; onPreview: (receipt: PrintReceipt, settings: Settings) => void; onDirtyChange: (dirty: boolean) => void}) {
  const [tab,setTab] = useState(initialTab);
  const [draft, setDraft] = useState(value);
  const [message, setMessage] = useState('');
  useEffect(() => {onDirtyChange(JSON.stringify(draft) !== JSON.stringify(value));}, [draft, value, onDirtyChange]);
  const update = <K extends keyof Settings>(key: K, next: Settings[K]) => {setDraft(d => ({...d, [key]: next})); setMessage('تغييرات غير محفوظة');};
  function save(done?:()=>void) {
    const settings = normalizePrinterSettings(draft);
    try {localStorage.setItem(printerStorageKey, JSON.stringify(settings)); onSave(settings); setDraft(settings); setMessage('تم حفظ إعدادات الطابعة في هذا المتصفح'); done?.();}
    catch {setMessage('تعذر الحفظ. تحقق من السماح بالتخزين في المتصفح.');}
  }
  function selectLogo(file?: File) {
    if (!file) return;
    if (!['image/png','image/jpeg','image/webp'].includes(file.type) || file.size > 250000) {
      setMessage('استخدم شعار PNG أو JPG أو WebP بحجم لا يتجاوز 250 كيلوبايت');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' && update('logoDataUrl', reader.result);
    reader.onerror = () => setMessage('تعذر قراءة ملف الشعار');
    reader.readAsDataURL(file);
  }
  useEffect(()=>{if(saveAction) saveAction.current=save;});
  return <section className="printer-settings">
    <div className="settings-sidebar" role="tablist" aria-orientation="vertical" aria-label="أقسام الإعدادات">{([{id:"hardware",label:"الأجهزة"},{id:"store",label:"المتجر"},{id:"receipt",label:"الإيصال"}] as const).map(item=><button key={item.id} role="tab" aria-selected={tab===item.id} className={tab===item.id?"active":""} onClick={()=>setTab(item.id)}>{item.label}</button>)}</div>
    <div className="settings-content">
    <div hidden={tab!=="hardware"} role="tabpanel" aria-label="الأجهزة">
    <div className={`printer-status ${draft.enabled ? 'ready' : ''}`} role="status">
      <strong>{draft.enabled ? 'الطباعة الحرارية مفعلة' : 'الطباعة الحرارية متوقفة'}</strong>
      <span>{draft.enabled ? `ورق ${draft.width} مم` : 'لن تظهر أزرار طباعة الإيصالات أو الملصقات'}</span>

    </div>
    <fieldset className="settings-group"><legend>الطابعة ودرج النقد</legend>
    <label className="printer-enabled"><input type="checkbox" checked={draft.enabled} onChange={e => update('enabled', e.target.checked)}/><span>تفعيل طباعة الإيصالات الحرارية</span></label>
    <div className="printer-fields">
      <label>عرض الورق<select value={draft.width} onChange={e => update('width', Number(e.target.value) as 58 | 80)}><option value={80}>80 مم</option><option value={58}>58 مم</option></select></label>
    </div>
    <details className="disclosure"><summary>إعدادات الطابعة المتقدمة</summary><div className="printer-fields">
      <label>الهامش الداخلي (مم)<input type="number" min={0} max={5} step={0.5} value={draft.margin} onChange={e => update('margin', Number(e.target.value))}/></label>
      <label>تغذية الورق قبل القص (مم)<input type="number" min={0} max={30} step={1} value={draft.feed} onChange={e => update('feed', Number(e.target.value))}/></label>
      <label>اسم الطابعة في Windows<input maxLength={120} placeholder="مثال: EPSON TM-T20III" value={draft.printerName} onChange={e => update('printerName', e.target.value)}/></label>
    </div><p className="printer-note">اسم الطابعة مرجع فقط؛ اختر الجهاز من نافذة الطباعة.</p></details>
    <label className="printer-enabled"><input type="checkbox" checked={draft.drawerKick} onChange={e => update('drawerKick', e.target.checked)}/><span>محاكاة نبضة درج النقد عند طباعة إيصال نقدي</span></label>
    <label className="drawer-reasons-field">أسباب فتح الدرج (سبب في كل سطر)<textarea rows={4} value={draft.drawerReasons.join("\n")} onChange={e=>update("drawerReasons",e.target.value.split("\n"))}/></label>
    </fieldset>
    </div>
    <div hidden={tab!=="store"} role="tabpanel" aria-label="المتجر"><fieldset className="settings-group"><legend>بيانات المتجر</legend><div className="printer-fields">
      <label>اسم المتجر<input maxLength={80} value={draft.merchant} onChange={e => update('merchant', e.target.value)}/></label>
      <label>العنوان<input maxLength={140} value={draft.address} onChange={e => update('address', e.target.value)}/></label>
      <label>هاتف المتجر<input maxLength={40} inputMode="tel" value={draft.phone} onChange={e => update('phone', e.target.value)}/></label>
      <label>الرقم الضريبي<input maxLength={60} value={draft.taxNumber} onChange={e => update('taxNumber', e.target.value)}/></label>
    </div></fieldset>{storeContent}</div>
    <div hidden={tab!=="receipt"} role="tabpanel" aria-label="الإيصال"><fieldset className="settings-group"><legend>مظهر الإيصال</legend><div className="printer-fields">
      <label className="logo-upload">شعار المتجر<span>اختيار شعار</span><input aria-label="شعار المتجر" type="file" accept="image/png,image/jpeg,image/webp" onChange={e => selectLogo(e.target.files?.[0])}/></label>
      <label>نهاية الإيصال<input maxLength={140} value={draft.footer} onChange={e => update('footer', e.target.value)}/></label>
    </div>
    <details className="disclosure"><summary>مظهر متقدم</summary><div className="printer-fields">      <label>حجم الخط (بكسل)<select value={draft.fontSize} onChange={e => update('fontSize', Number(e.target.value))}>{[10,11,12,13,14,15,16].map(n => <option key={n} value={n}>{n}</option>)}</select></label>
      <label>بادئة رقم الإيصال<input maxLength={20} placeholder="مثال: POS-" value={draft.receiptPrefix} onChange={e => update('receiptPrefix', e.target.value)}/></label>
</div></details>
    {draft.logoDataUrl && <div className="logo-preview"><img src={draft.logoDataUrl} alt="معاينة شعار المتجر"/><button className="btn" onClick={() => update('logoDataUrl','')}>إزالة الشعار</button></div>}
    </fieldset></div>
    <div className="printer-actions">
      <button className="btn primary" onClick={()=>save()}><Save size={18}/> حفظ الإعدادات</button>
      <button className="btn" disabled={!draft.enabled} onClick={() => onPreview(testPrintReceipt, draft)}><Printer size={18}/> معاينة اختبار</button>
    </div>
    {message && <p role="status">{message}</p>}
    <details hidden={tab!=="hardware"} className="disclosure"><summary>دليل إعداد الطابعة</summary>    <p className="printer-note">ثبّت تعريف الطابعة في Windows واجعل مقاس الورق الافتراضي {draft.width} مم. في نافذة الطباعة اختر الطابعة المسماة أعلاه، مقياس 100%، هوامش «بلا»، وأوقف رأس الصفحة وتذييلها. القص التلقائي يضبط من تعريف الطابعة.</p>

    <p className="printer-note">المتصفح يفتح نافذة الطباعة ولا يمكنه اختيار جهاز أو تأكيد خروج الورق. درج النقد الموصول بمنفذ الطابعة يفتح فعلياً فقط إذا كان تعريف الطابعة مضبوطاً لإرسال نبضة الدرج عند بدء طباعة إيصال نقدي. التطبيق يعرض محاكاة للنبضة ولا يدّعي استلام الجهاز لها.</p>
    </details>
    </div>
  </section>;
}
