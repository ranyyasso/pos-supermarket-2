import { dateTime, money, legacyPrice, productById, ean13CheckDigit, type Transaction, type Refund } from './model';
import JsBarcode from 'jsbarcode';

export type PrinterSettings = {
  enabled: boolean;
  width: 58 | 80;
  margin: number;
  feed: number;
  fontSize: number;
  printerName: string;
  merchant: string;
  address: string;
  phone: string;
  taxNumber: string;
  receiptPrefix: string;
  logoDataUrl: string;
  drawerKick: boolean;
  drawerReasons: string[];
  footer: string;
};
export const printerDefaults: PrinterSettings = {
  enabled: true, width: 80, margin: 2, feed: 8, fontSize: 12, printerName: '',
  merchant: 'سوبرماركت الصغار', address: 'بغداد · الفرع الرئيسي', phone: '', taxNumber: '',
  receiptPrefix: '', logoDataUrl: '', drawerKick: true, drawerReasons: ['تبديل نقد', 'إيداع نقد', 'سحب نقد'], footer: 'شكراً لزيارتكم',
};
export const printerStorageKey = 'mizan-printer-v1';
export function normalizePrinterSettings(value: unknown): PrinterSettings {
  const v = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const text = (key: 'printerName' | 'merchant' | 'address' | 'phone' | 'taxNumber' | 'receiptPrefix' | 'footer', max: number) =>
    typeof v[key] === 'string' ? v[key].trim().slice(0, max) : printerDefaults[key];
  return {
    enabled: typeof v.enabled === 'boolean' ? v.enabled : printerDefaults.enabled,
    width: v.width === 58 ? 58 : 80,
    margin: typeof v.margin === 'number' && Number.isFinite(v.margin) ? Math.max(0, Math.min(5, v.margin)) : 2,
    feed: typeof v.feed === 'number' && Number.isFinite(v.feed) ? Math.max(0, Math.min(30, v.feed)) : printerDefaults.feed,
    fontSize: typeof v.fontSize === 'number' && Number.isFinite(v.fontSize) ? Math.max(10, Math.min(16, v.fontSize)) : 12,
    printerName: text('printerName', 120),
    merchant: text('merchant', 80) || printerDefaults.merchant,
    address: text('address', 140), phone: text('phone', 40), taxNumber: text('taxNumber', 60),
    receiptPrefix: text('receiptPrefix', 20),
    logoDataUrl: typeof v.logoDataUrl === 'string' && /^data:image\/(png|jpeg|webp);base64,/.test(v.logoDataUrl) && v.logoDataUrl.length <= 350000 ? v.logoDataUrl : '',
    drawerReasons: Array.isArray(v.drawerReasons) ? [...new Set(v.drawerReasons.filter((r): r is string => typeof r === 'string').map(r=>r.trim().slice(0,120)).filter(Boolean))].slice(0,50) : [...printerDefaults.drawerReasons],
    drawerKick: typeof v.drawerKick === 'boolean' ? v.drawerKick : printerDefaults.drawerKick,
    footer: text('footer', 140),
  };
}
export function loadPrinterSettings(): PrinterSettings {
  try { return normalizePrinterSettings(JSON.parse(localStorage.getItem(printerStorageKey) || 'null')); }
  catch { return { ...printerDefaults }; }
}
export type PrintReceipt = {
  title: string;
  details: string[];
  rows: { name: string; quantity: number | string; amount?: number }[];
  totals: { label: string; amount: number }[];
};
export function receiptNumber(id: string, settings: Pick<PrinterSettings, 'receiptPrefix'> = printerDefaults) {
  return `${settings.receiptPrefix}${id}`;
}
export function salePrintReceipt(tx: Transaction, settings: Pick<PrinterSettings, 'receiptPrefix'> = printerDefaults): PrintReceipt {
  const p = tx.pricing || legacyPrice(tx.sale);
  const method = {cash: 'نقداً', card: 'بطاقة مصرفية', contactless: 'دفع لاتلامسي'};
  return {
    title: `إيصال #${receiptNumber(tx.sale.id, settings)}`,
    details: [dateTime(tx.sale.createdAt), ...(tx.status === 'void' ? ['معاملة ملغاة'] : [])],
    rows: tx.sale.lines.map(l => ({name: productById(l.productId).name, quantity: l.scaleWeight ? `${l.scaleWeight} كغ` : l.quantity, amount: p.rows.find(r => r.id === l.id)!.net})),
    totals: [
      {label: 'المجموع قبل الخصم', amount: p.subtotal + (p.wholesaleSaving || 0)},
      ...(p.savings?.length ? p.savings.map(saving => ({label:saving.reason,amount:-saving.amount})) : [{label: 'الخصومات والعروض', amount: p.itemDiscount + p.promotions + p.basketDiscount + p.reward}]),
      {label: 'الضريبة', amount: p.tax}, {label: 'الإجمالي', amount: tx.total},
      ...tx.payments.map(pay => ({label: method[pay.method], amount: pay.amount})),
      {label: 'الباقي للعميل', amount: tx.payments.reduce((sum, pay) => sum + pay.change, 0)},
    ],
  };
}
export function refundPrintReceipt(refund: Refund, tx: Transaction): PrintReceipt {
  return {
    title: `إيصال استرجاع #${refund.transactionId}`,
    details: [refund.id, refund.reason],
    rows: tx.sale.lines.filter(l => refund.lines[l.id] > 0).map(l => ({name: productById(l.productId).name, quantity: refund.lines[l.id]})),
    totals: [{label: 'المبلغ المسترجع', amount: refund.total},...refund.allocations.map(a=>({label:({cash:'نقداً',card:'بطاقة مصرفية',contactless:'دفع لاتلامسي'} as Record<string,string>)[a.method]||a.method,amount:a.amount}))],
  };
}
export const testPrintReceipt: PrintReceipt = {
  title: 'اختبار الطابعة الحرارية', details: ['اختبار العربية: أبجد هوز 0123456789'],
  rows: [{name: 'بسكويت حليب · علبة', quantity: 1, amount: 8000}, {name: 'اسم صنف طويل لاختبار التفاف النص العربي', quantity: 2, amount: 4000}],
  totals: [{label: 'المجموع', amount: 12000}, {label: 'الضريبة', amount: 1200}, {label: 'الإجمالي', amount: 13200}],
};
export const escapePrintText = (s: string) => s.replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]!));

export function buildPrintDocument(receipt: PrintReceipt, settings: PrinterSettings, stylesheets: string[] = []): string {
  const s = normalizePrinterSettings(settings), e = escapePrintText;
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${e(receipt.title)}</title>
  ${stylesheets.map(href => `<link rel="stylesheet" href="${e(href)}">`).join('')}
  <style>
    @page { size: ${s.width}mm auto; margin: 0; }
    html,body{margin:0;padding:0;width:${s.width}mm;height:auto;min-height:0;overflow:visible;background:#fff;color:#000;font-family:'IBM Plex Sans Arabic','Segoe UI',sans-serif;font-size:${s.fontSize}px;color-scheme:light;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    *{box-sizing:border-box;scrollbar-width:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none} *::-webkit-scrollbar{display:none} :focus-visible{outline:1px solid #73879b;outline-offset:1px} html,body{touch-action:pan-x pan-y} summary{min-height:44px;cursor:pointer;align-content:center} .print-controls{padding:16px;background:#eee;color:#111;font-size:14px;line-height:1.8} .print-controls button{min-height:44px;padding:8px 20px;border:1px solid #333;border-radius:4px;background:white;cursor:pointer;font:inherit}
    .thermal-paper{width:${s.width}mm;max-width:100%;padding:${s.margin}mm;padding-bottom:${s.margin + s.feed}mm;margin:12px auto;color:#000;line-height:1.5;overflow-wrap:anywhere}
    .thermal-paper header,.thermal-paper footer{text-align:center;margin:8px 0} .store-logo{display:block;max-width:36mm;max-height:18mm;object-fit:contain;margin:0 auto 5px}.thermal-paper h1{font-size:1.3em;margin:0} .thermal-paper h2{font-size:1.1em;margin:6px 0} .thermal-paper p{margin:4px 0} .thermal-paper table{border-collapse:collapse;width:100%;table-layout:fixed}
    .thermal-paper th,.thermal-paper td{text-align:start;padding:5px 1px;border-bottom:1px dashed #555;vertical-align:top} .thermal-paper th:nth-child(2){width:17%;white-space:nowrap} .thermal-paper th:last-child{width:33%} .thermal-paper td:last-child{text-align:end} .thermal-paper tr{break-inside:avoid}
    .print-total{display:flex;justify-content:space-between;gap:6px;padding:4px 0;break-inside:avoid}.print-total span:last-child{flex-shrink:0}.thermal-paper footer{border-top:1px dashed #555;padding-top:6px}.thermal-paper small{font-size:.8em}
    @media print{html,body{width:${s.width}mm!important}.print-controls{display:none!important}.thermal-paper{width:${s.width}mm;margin:0 auto;max-width:none;box-shadow:none} }
  </style></head><body>
  <nav class="print-controls" aria-label="أدوات الطباعة"><button id="print-now" type="button">طباعة / حفظ PDF</button>
    <details><summary>إعداد الطباعة</summary><p>اختر ${s.printerName ? `الطابعة «${e(s.printerName)}»` : 'الطابعة الحرارية'} من نافذة الطباعة. اضبط الورق على ${s.width} مم، والمقياس على 100%، والهوامش على «بلا»، وأوقف رؤوس الصفحات وتذييلاتها. عدد النسخ من نافذة الطباعة.</p></details>
    <p id="print-status" role="status">معاينة فقط. لم يُرسل الإيصال إلى الطابعة.</p>
  </nav>
  <main class="thermal-paper"><header>${s.logoDataUrl ? `<img class="store-logo" src="${e(s.logoDataUrl)}" alt="">` : ''}<h1>${e(s.merchant)}</h1><p>${e(s.address)}</p>${s.phone ? `<p>الهاتف: ${e(s.phone)}</p>` : ''}${s.taxNumber ? `<p>الرقم الضريبي: ${e(s.taxNumber)}</p>` : ''}<h2>${e(receipt.title)}</h2>${receipt.details.map(d => `<p>${e(d)}</p>`).join('')}</header>
  <table><thead><tr><th>الصنف</th><th>العدد</th><th>المبلغ</th></tr></thead><tbody>${receipt.rows.map(r => `<tr><td>${e(r.name)}</td><td>${e(String(r.quantity))}</td><td>${r.amount === undefined ? '—' : e(money(r.amount))}</td></tr>`).join('')}</tbody></table>
  ${receipt.totals.map(t => `<div class="print-total"><span>${e(t.label)}</span><span>${e(money(t.amount))}</span></div>`).join('')}
  <footer><p>${e(s.footer)}</p><small>إيصال تجريبي · غير صالح للاستخدام المالي</small></footer></main>
  <script>const status=document.getElementById('print-status');window.addEventListener('beforeprint',()=>{status.textContent='فُتحت نافذة الطباعة. اختر الطابعة الحرارية وتحقق من عرض الورق.'});window.addEventListener('afterprint',()=>{status.textContent='أُغلقت نافذة الطباعة. لا يستطيع المتصفح معرفة هل خرج الورق أم أُلغيت العملية.'});document.getElementById('print-now').onclick=async function(){this.disabled=true;try{await document.fonts.ready;status.textContent='جارٍ فتح نافذة الطباعة؛ المتصفح لا يؤكد خروج الورق.';parent.postMessage({type:'mizan-print-request'},'*');window.print();}catch(e){status.textContent='تعذر فتح نافذة الطباعة. افتح التطبيق في Chrome أو Edge وحاول مجدداً.';}finally{this.disabled=false;}};</script>
  </body></html>`;
}

/** Opening a preview is not evidence that a physical printer accepted a job. */
export function thermalPrintDocument(receipt: PrintReceipt, settings: PrinterSettings): string {
  if (!normalizePrinterSettings(settings).enabled) throw new Error('Thermal printing is disabled');
  const sheets = [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].map(l => l.href).filter(href => new URL(href).origin === location.origin);
  return buildPrintDocument(receipt, settings, sheets);
}
export function productLabelDocument(product: {name:string;barcode:string;price:number}, settings: PrinterSettings, copies = 1): string {
  if(!Number.isInteger(copies)||copies<1||copies>100)throw new Error("عدد الملصقات من 1 إلى 100");
  const s=normalizePrinterSettings(settings), e=escapePrintText;
  if(!s.enabled)throw new Error('Thermal printing is disabled');
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  const ean=/^\d{13}$/.test(product.barcode)&&ean13CheckDigit(product.barcode.slice(0,12))===Number(product.barcode[12]);
  JsBarcode(svg,product.barcode,{format:ean?'EAN13':'CODE128',displayValue:true,height:s.width===58?45:55,width:2,margin:0,fontSize:14});
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${e(product.name)}</title><style>@page{margin:0}*{box-sizing:border-box}html,body{margin:0;width:${s.width}mm;background:#fff;color:#000;font-family:'IBM Plex Sans Arabic','Segoe UI',sans-serif}.controls{padding:12px;background:#eee}.controls button{min-height:44px;font:inherit}.label{width:${s.width}mm;padding:${s.margin}mm ${s.margin}mm ${s.margin+s.feed}mm;text-align:center}.label h1{font-size:16px;margin:4px 0}.label strong{display:block;font-size:18px;margin:4px}.label svg{max-width:100%;height:auto}@media print{.controls{display:none!important}.label{margin:0}}</style></head><body><nav class="controls"><button onclick="window.print()">طباعة الملصق</button><p>اختر الطابعة الحرارية ومقاس ${s.width} مم، مقياس 100% وهوامش بلا.</p></nav>${Array.from({length:copies},()=>`<main class="label" style="break-after:page"><h1>${e(product.name)}</h1><strong>${e(money(product.price))}</strong>${svg.outerHTML}</main>`).join('')}</body></html>`;
}
