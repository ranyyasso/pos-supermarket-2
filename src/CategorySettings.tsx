import { useEffect, useState } from 'react';
import { categories, normalizeDigits, registerCategory } from './model';

export function CategorySettings({ onSave, onDirtyChange, approve }: {onSave:()=>void;onDirtyChange:(dirty:boolean)=>void;approve:(title:string,run:()=>void)=>void}) {
  const [name,setName] = useState('');
  const [error,setError] = useState('');
  useEffect(()=>{onDirtyChange(!!name.trim());},[name,onDirtyChange]);
  function save() {
    if(!name.trim() || categories.some(c=>c.name===name.trim())) {setError(!name.trim()?'أدخل اسم الفئة':'الفئة مسجلة مسبقاً');return;}
    approve('تسجيل فئة',()=>{
      try {registerCategory(name);setName('');setError('');onSave();}
      catch(error){setError(error instanceof Error?error.message:'تعذر حفظ الفئة');}
    });
  }
  return <section className="printer-settings">
    <div className="registered-categories">{categories.filter(c=>c.id!=='all').map(c=><span key={c.id}>{c.name}</span>)}</div>
    <label className="field">اسم الفئة<input value={name} maxLength={80} onChange={e=>{setName(normalizeDigits(e.target.value));setError('');}}/></label>
    <button className="btn primary" onClick={save}>إضافة فئة</button>
    {error && <p role="alert">{error}</p>}
  </section>;
}
