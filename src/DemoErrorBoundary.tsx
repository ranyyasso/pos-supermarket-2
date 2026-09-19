import {Component,type ReactNode} from 'react';
export class AppErrorBoundary extends Component<{children:ReactNode},{failed:boolean}> {
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed ? <main className="demo-recovery" dir="rtl"><h1>تعذر عرض نقطة البيع</h1><p>تحقق من الاتصال ثم أعد تحميل الصفحة.</p><button className="btn primary" onClick={()=>location.reload()}>إعادة تحميل التطبيق</button></main> : this.props.children;}
}
