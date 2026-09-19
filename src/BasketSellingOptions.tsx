import {useEffect, useState} from 'react';
import {NumberStepper} from './NumberStepper';
import {lineUnit, lineQuantityText, money, unitLabels, validQuantity, type Line, type Product} from './model';

type Props={line:Line;product:Product;wholesale:boolean;wholesalePrice?:number;onChange:(line:Line)=>string|undefined};
export function BasketSellingOptions({line,product,wholesale,wholesalePrice,onChange}:Props) {
 const [draft,setDraft]=useState(String(line.quantity));
 const [error,setError]=useState('');
 const unit=lineUnit(line), measured=!['piece','pack'].includes(unit), locked=line.priceOverride!==undefined;
 useEffect(()=>{setDraft(String(line.quantity));},[line.quantity,line.saleUnit]);

 function change(value:string) {
  setDraft(value);setError('');
  if(value==='' || value.endsWith('.'))return;
  if(!validQuantity(Number(value),unit)){setError('أدخل كمية صالحة حتى 999');return;}
  setError(onChange({...line,quantity:Number(value)})||'');
 }
 return <div className="basket-selling-options" id={`selling-${line.id}`}>

  <div className="selling-price"><span>{unit==='pack'?'سعر العبوة':wholesale?'جملة':'مفرد'} · {unitLabels[unit]}</span><strong>{money(unit==='pack'?line.packPrice!:wholesale?wholesalePrice ?? product.price:product.price)}</strong></div>
  {locked ? <p className="selling-measure">{lineQuantityText(line)} · ملصق الميزان</p> : <label className="selling-quantity"><span>الكمية ({unitLabels[unit]})</span><NumberStepper aria-label={`كمية ${product.name}`} min={measured?0.001:1} max={999} step={measured?0.001:1} value={draft} onValueChange={change} onBlur={()=>setDraft(String(line.quantity))}/></label>}
  {error && <p role="alert" className="selling-error">{error}</p>}
 </div>;
}

