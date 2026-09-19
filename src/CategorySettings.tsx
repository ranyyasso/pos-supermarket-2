import { useEffect, useState } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { categories, maxCategories, categoryNameMaxLength, normalizeDigits, registerCategory, removeCategory, products } from './model';

export function CategorySettings({ saveAction, onSave, onDirtyChange, approve }: { saveAction?: {current: ((done:()=>void)=>void) | null}; onSave:()=>void;onDirtyChange:(dirty:boolean)=>void;approve:(title:string,run:()=>void)=>void}) {
  const categoryCount=categories.filter(c=>c.id!=='all').length;
  const limitReached=categoryCount>=maxCategories;
  const [name,setName] = useState('');
  const [error,setError] = useState('');
  useEffect(()=>{onDirtyChange(!!name.trim());},[name,onDirtyChange]);
  function save(done?:()=>void) {
    if(limitReached){setError('الحد الأقصى 13 فئة، بالإضافة إلى المفضلة');return;}
    if(!name.trim() || categories.some(c=>c.name===name.trim())) {setError(!name.trim()?'أدخل اسم الفئة':'الفئة مسجلة مسبقاً');return;}
    approve('تسجيل فئة',()=>{
      try {registerCategory(name);setName('');setError('');onSave();done?.();}
      catch(error){setError(error instanceof Error?error.message:'تعذر حفظ الفئة');}
    });
  }
  function remove(id:string) {
    if(products.some(p=>p.category===id)){setError('انقل أصناف هذه الفئة إلى فئة أخرى قبل حذفها');return;}
    approve('حذف فئة',()=>{try{removeCategory(id);setError('');onSave();}catch(error){setError(error instanceof Error?error.message:'تعذر حذف الفئة');}});
  }
  useEffect(()=>{if(saveAction) saveAction.current=save;});
  return <section className="settings-form">
    <p className="category-capacity">الفئات: {categoryCount} / {maxCategories}</p>
    <div className="registered-categories">{categories.filter(c=>c.id!=='all').map(c=><div className="category-chip" key={c.id}><span>{c.name}</span><button type="button" className="btn" aria-label={`حذف فئة ${c.name}`} onClick={()=>remove(c.id)}><Trash2 size={16}/></button></div>)}</div>
    <label className="field"><span>اسم الفئة</span><input aria-label="اسم الفئة" value={name} aria-describedby="category-name-count" maxLength={categoryNameMaxLength} onChange={e=>{setName(normalizeDigits(e.target.value));setError('');}}/><small id="category-name-count" className="category-name-count">{name.length} / {categoryNameMaxLength}</small></label>
    <button className="btn primary" disabled={limitReached} onClick={()=>save()}><Plus size={18} aria-hidden="true"/>إضافة فئة</button>
    {error && <p role="alert">{error}</p>}
  </section>;
}
