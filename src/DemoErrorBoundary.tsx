import {Component,type ReactNode} from 'react';
export class DemoErrorBoundary extends Component<{children:ReactNode},{failed:boolean}> {
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed ? <main className="demo-recovery" dir="rtl"><h1>تعذر عرض نقطة البيع</h1><p>البيانات المحفوظة باقية في هذا المتصفح. أعد تحميل الصفحة للمحاولة مجدداً.</p><button className="btn primary" onClick={()=>location.reload()}>إعادة تحميل التطبيق</button></main> : this.props.children;}
}
