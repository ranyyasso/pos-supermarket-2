import { describe, it, expect } from 'vitest';
import { buildPrintDocument, normalizePrinterSettings, printerDefaults, testPrintReceipt, salePrintReceipt, refundPrintReceipt, thermalPrintDocument } from './printing';
import { price, type Transaction } from './model';
const sale: Transaction['sale'] = {id:'test', lines:[{id:'l1',productId:'p1',quantity:1}],service:'takeaway',note:'',ageRecords:[],reward:false,createdAt:'2026-09-14T10:00:00Z'};
const tx: Transaction = {sale,total:price(sale).total,payments:[{id:'cash',method:'cash',amount:8800,tendered:10000,change:1200}],status:'completed',refunded:{}};
describe('thermal printing', () => {
  it('prints wholesale savings and their reason without subtracting them twice',()=>{
    const wholesaleSale={...sale,service:'dinein' as const};
    const pricing=price(wholesaleSale,{wholesaleEnabled:true,wholesale:{p1:{price:7000,minimum:1}}});
    const receipt=salePrintReceipt({...tx,sale:wholesaleSale,pricing,total:pricing.total});
    expect(receipt.totals[0].amount).toBe(8000);
    expect(receipt.totals[1]).toEqual({label:'سعر الجملة · بسكويت حليب · علبة',amount:-1000});
    expect(receipt.totals[0].amount+receipt.totals[1].amount+receipt.totals[2].amount).toBe(pricing.total);
  });
  it('uses defaults for missing or invalid settings', () => {
    expect(normalizePrinterSettings(null)).toEqual(printerDefaults);
    expect(normalizePrinterSettings({width:42,margin:NaN,fontSize:Infinity}).width).toBe(80);
    expect(normalizePrinterSettings({width:58,margin:-10,feed:99,fontSize:99})).toMatchObject({width:58,margin:0,feed:30,fontSize:16});
  });
  it('limits stored text and numeric values', () => {
    expect(normalizePrinterSettings({merchant:' '.repeat(10)}).merchant).toBe(printerDefaults.merchant);
    expect(normalizePrinterSettings({footer:'a'.repeat(200)}).footer).toHaveLength(140);
    expect(normalizePrinterSettings({margin:9,fontSize:2})).toMatchObject({margin:5,fontSize:10});
  });
  it('normalizes receipt identity, logo and drawer options', () => {
    const logo='data:image/png;base64,AAAA';
    expect(normalizePrinterSettings({phone:' 0770 ',taxNumber:' TAX-1 ',receiptPrefix:' POS-',logoDataUrl:logo,drawerKick:false})).toMatchObject({phone:'0770',taxNumber:'TAX-1',receiptPrefix:'POS-',logoDataUrl:logo,drawerKick:false});
    expect(normalizePrinterSettings({logoDataUrl:'javascript:alert(1)'}).logoDataUrl).toBe('');
    expect(salePrintReceipt(tx,{receiptPrefix:'POS-'}).title).toBe('إيصال #POS-test');
  });
  it.each([58,80] as const)('creates a %s mm RTL print-only receipt', width => {
    const html=buildPrintDocument(testPrintReceipt,{...printerDefaults,width});
    expect(html).toContain('lang="ar" dir="rtl"');
    expect(html).toContain(`width:${width}mm`);
    expect(html).toContain(`padding-bottom:${printerDefaults.margin + printerDefaults.feed}mm`);
    expect(html).toContain(`@page { size: ${width}mm auto; margin: 0; }`);
    expect(html).toContain(`.thermal-paper{width:${width}mm;margin:0 auto;max-width:none;box-shadow:none}`);
    expect(html).toContain('.print-controls{display:none!important}');
    expect(html).toContain('await document.fonts.ready');
    expect(html).toContain('لم يُرسل الإيصال إلى الطابعة');
  });
  it('refuses to create an active print document when thermal printing is disabled', () => {
    expect(() => thermalPrintDocument(testPrintReceipt, {...printerDefaults,enabled:false})).toThrow('disabled');
  });
  it('escapes editable receipt text and stylesheet URLs', () => {
    const html=buildPrintDocument({...testPrintReceipt,title:'<img src=x onerror=alert(1)>'},{...printerDefaults,merchant:'</style><script>alert(1)</script>'},['https://example.com/" onload="alert(1)']);
    expect(html).not.toContain('<img src=x');
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;img');
    expect(html).toContain('&quot; onload=&quot;');
  });
  it('renders configured store identity and announces print requests to the POS', () => {
    const html=buildPrintDocument(testPrintReceipt,{...printerDefaults,phone:'0770',taxNumber:'TAX-1',logoDataUrl:'data:image/png;base64,AAAA'});
    expect(html).toContain('الهاتف: 0770');
    expect(html).toContain('الرقم الضريبي: TAX-1');
    expect(html).toContain('class="store-logo"');
    expect(html).toContain("type:'mizan-print-request'");
  });
  it('uses checkout totals and preserves cash change', () => {
    const receipt=salePrintReceipt(tx);
    expect(receipt.totals.find(t=>t.label==='الإجمالي')?.amount).toBe(8800);
    expect(receipt.totals.find(t=>t.label==='الباقي للعميل')?.amount).toBe(1200);
    expect(receipt.rows[0].name).toBe('بسكويت حليب · علبة');
  });
  it('marks void transactions and prints the recorded refund amount', () => {
    expect(salePrintReceipt({...tx,status:'void'}).details).toContain('معاملة ملغاة');
    const r=refundPrintReceipt({id:'r1',transactionId:'test',lines:{l1:1},total:8800,reason:'اختبار',allocations:[{method:'cash',amount:8800}]},tx);
    expect(r.rows[0].quantity).toBe(1);
    expect(r.totals[0].amount).toBe(8800);
  });
});
