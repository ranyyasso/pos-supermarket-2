import {useRef, type InputHTMLAttributes} from 'react';
import {Minus, Plus} from 'lucide-react';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type'> & {onValueChange:(value:string)=>void};
export function NumberStepper({onValueChange, ...props}:Props) {
 const input=useRef<HTMLInputElement>(null);
 const value=Number(props.value);
 const locked=props.disabled || props.readOnly;
 function step(direction:number) {
  const element=input.current;
  if(!element || locked) return;
  if(direction>0) element.stepUp(); else element.stepDown();
  onValueChange(element.value);
 }
 return <span className="number-stepper" dir="ltr">
  <button type="button" aria-label="تقليل القيمة" disabled={locked || (props.min!==undefined && value<=Number(props.min))} onClick={()=>step(-1)}><Minus size={18} aria-hidden="true"/></button>
  <input {...props} ref={input} type="number" inputMode={props.inputMode || (Number(props.step)%1 ? 'decimal' : 'numeric')} onChange={e=>onValueChange(e.target.value)}/>
  <button type="button" aria-label="زيادة القيمة" disabled={locked || (props.max!==undefined && value>=Number(props.max))} onClick={()=>step(1)}><Plus size={18} aria-hidden="true"/></button>
 </span>;
}
