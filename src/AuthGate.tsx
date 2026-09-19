import { useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, supabaseConfigured } from './supabase';

export function AuthGate({children}:{children:ReactNode}){
  const [session,setSession]=useState<Session|null>(null),[ready,setReady]=useState(false);
  const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[error,setError]=useState('');
  useEffect(()=>{if(!supabase){setReady(true);return;} void supabase.auth.getSession().then(({data})=>{setSession(data.session);setReady(true);});const {data}=supabase.auth.onAuthStateChange((_event,next)=>setSession(next));return()=>data.subscription.unsubscribe();},[]);
  async function submit(create:boolean){if(!supabase)return;setError('');const result=create?await supabase.auth.signUp({email,password}):await supabase.auth.signInWithPassword({email,password});if(result.error){setError(result.error.message);return;}if(result.data.session){const {error:claimError}=await supabase.rpc('claim_app_ownership');if(claimError){await supabase.auth.signOut();setError(claimError.message);}}}
  if(!supabaseConfigured)return <main className="demo-recovery" dir="rtl"><h1>إعداد الاتصال مطلوب</h1><p>إعدادات Supabase غير موجودة في بناء التطبيق.</p></main>;
  if(!ready)return <main className="demo-recovery" dir="rtl"><p>جارٍ الاتصال…</p></main>;
  if(!session)return <main className="demo-recovery" dir="rtl"><h1>دخول المالك</h1><label className="field"><span>البريد الإلكتروني</span><input type="email" value={email} onChange={e=>setEmail(e.target.value)}/></label><label className="field"><span>كلمة المرور</span><input type="password" value={password} onChange={e=>setPassword(e.target.value)}/></label>{error&&<p role="alert">{error}</p>}<button className="btn primary" onClick={()=>void submit(false)}>دخول</button><button className="btn" onClick={()=>void submit(true)}>إنشاء حساب المالك</button></main>;
  return <>{children}</>;
}
