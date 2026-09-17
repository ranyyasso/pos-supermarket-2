import {describe,it,expect,vi,afterEach} from 'vitest';
import {seed,newSale,price,legacyPrice,reducer,cashPayment,refundValue,refundAllocations,checkoutError,validState,loadState,validPayments,normalizeDigits,normalizePhone,type Sale,type State} from './model';
const complete=(s:State)=>reducer(s,{type:'complete',payments:price(s.sale).total ? [cashPayment(price(s.sale).total,price(s.sale).total)] : []});
afterEach(()=>vi.unstubAllGlobals());
describe('client demo regression checks',()=>{
 it('rounds invoice tax consistently after loyalty allocation',()=>{
  const s=seed();s.sale.customer='c1';s.sale.reward=true;
  expect(legacyPrice(s.sale)).toMatchObject({taxable:39000,tax:3900,total:42900});
  expect(price(s.sale).reward).toBe(0);
 });
 it('stores receipt pricing and caps legacy refunds at their recorded total',()=>{
  const s=complete(seed());expect(s.transactions[0].pricing?.total).toBe(s.transactions[0].total);
  const tx={...s.transactions[0],pricing:undefined,total:s.transactions[0].total-1};
  expect(refundValue(tx,Object.fromEntries(tx.sale.lines.map(l=>[l.id,l.quantity])))).toBe(tx.total);
 });
 it('applies cola promotion across separate noted lines',()=>{
  const sale:Sale={...newSale(1),lines:[{id:'a',productId:'p10',quantity:1,note:'بارد'},{id:'b',productId:'p10',quantity:1,note:'بدون ثلج'}]};
  expect(price(sale)).toMatchObject({promotions:2000,total:2200});
 });
 it('allocates dessert coupons only to dessert lines',()=>{
  const s:Sale={...newSale(1),coupon:'DESSERT5',lines:[{id:'a',productId:'p1',quantity:1},{id:'b',productId:'p3',quantity:3}]};
  expect(price(s).rows[0].basketDiscount).toBe(0);
  expect(price(s).rows[1].basketDiscount).toBe(5000);
 });
 it('keeps line totals nonnegative and conserves money in 500 varied baskets',()=>{
  for(let i=1;i<=500;i++){
   const s:Sale={...newSale(i),lines:[{id:'a',productId:'p1',quantity:i%9+1,discount:{kind:'fixed',value:7999}},{id:'b',productId:'p3',quantity:i%7+1},{id:'c',productId:'p10',quantity:i%5+1},{id:'d',productId:'p11',quantity:1,verified:true}],discount:{kind:'fixed',value:i*997},reward:i%2===0};
   const p=price(s);
   expect(p.rows.every(r=>r.net>=0 && Number.isSafeInteger(r.total))).toBe(true);
   expect(p.subtotal-p.itemDiscount-p.promotions-p.basketDiscount-p.reward+p.tax).toBe(p.total);
  }
 });
 it('does not redeem a reward without its full eligible value',()=>{
  const s=seed();s.sale.customer='c1';s.sale.reward=true;s.sale.lines=[{id:'cola',productId:'p10',quantity:1}];
  expect(price(s.sale).reward).toBe(0);expect(checkoutError(s)).toBeUndefined();
  expect(complete(s).customers).toEqual(s.customers);
 });
 it('rejects reuse of loyalty points in a recalled parked sale',()=>{
  const s=seed();s.sale.reward=true;s.sale.customer='c1';s.customers[0].points=100;
  expect(checkoutError(s)).toBeUndefined();expect(price(s.sale).reward).toBe(0);expect(complete(s).customers).toEqual(s.customers);
 });
 it('does not mutate disabled loyalty on a new sale or its void',()=>{
  let s=seed();s.sale.customer='c1';s.sale.reward=true;s=complete(s);
  expect(s.customers.find(c=>c.id==='c1')!.points).toBe(650);
  s=reducer(s,{type:'void',id:'553',reason:'اختبار'});
  expect(s.customers.find(c=>c.id==='c1')!.points).toBe(650);
  expect(reducer(s,{type:'void',id:'553',reason:'اختبار'})).toBe(s);
 });
 it('does not mutate disabled loyalty on a new sale or its refund',()=>{
  let s=seed();s.sale.customer='c1';s.sale.reward=true;s=complete(s);
  const tx=s.transactions[0];
  for(const line of tx.sale.lines)s=reducer(s,{type:'refund',id:'553',selected:{[line.id]:line.quantity},reason:'اختبار',cash:false});
  expect(s.customers.find(c=>c.id==='c1')!.points).toBe(650);
  expect(s.refunds.reduce((sum,r)=>sum+r.total,0)).toBe(tx.total);
 });
 it('accepts return of a zero-value sale and tracks its quantities',()=>{
  let s=seed();s.sale.discount={kind:'percent',value:100};s=complete(s);
  const line=s.transactions[0].sale.lines[0];s=reducer(s,{type:'refund',id:'553',selected:{[line.id]:1},reason:'اختبار',cash:false});
  expect(s.refunds[0].total).toBe(0);expect(s.transactions[0].refunded[line.id]).toBe(1);
 });
 it('invalid repeat refunds cannot throw from the reducer',()=>{
  let s=complete(seed());const line=s.transactions[0].sale.lines[0];
  s=reducer(s,{type:'refund',id:'553',selected:{[line.id]:1},reason:'اختبار',cash:false});
  expect(reducer(s,{type:'refund',id:'553',selected:{[line.id]:99},reason:'اختبار',cash:false})).toBe(s);
  expect(()=>refundValue(s.transactions[0],{unknown:1})).toThrow();
 });
 it('cash refund overrides still consume original payment capacity',()=>{
  const s=complete(seed()),tx=s.transactions[0];
  tx.payments=[cashPayment(tx.total,10000,true),{id:'card',method:'card',amount:tx.total-10000,tendered:tx.total-10000,change:0}];
  const prior=[{id:'r1',transactionId:tx.sale.id,lines:{},total:15000,reason:'override',allocations:[{method:'cash',amount:15000}]}];
  expect(refundAllocations(tx,tx.total-15000,prior)).toEqual([{method:'card',amount:tx.total-15000}]);
 });
 it('rejects malformed or duplicate payment records',()=>{
  expect(validPayments([{id:'x',method:'cash',amount:10,tendered:10,change:999}])).toBe(false);
  const p=cashPayment(100,100);expect(validPayments([p,p])).toBe(false);
  expect(()=>cashPayment(Infinity,100)).toThrow();
 });
 it('validates persisted state after normal sale, hold, recall and refund flows',()=>{
  let s=seed();expect(validState(s)).toBe(true);
  s=reducer(s,{type:'hold'});expect(validState(s)).toBe(true);
  s=reducer(s,{type:'recall',id:'553'});s=complete(s);expect(validState(s)).toBe(true);
  const line=s.transactions[0].sale.lines[0];s=reducer(s,{type:'refund',id:'553',selected:{[line.id]:1},reason:'test',cash:false});expect(validState(s)).toBe(true);
 });
 it.each(['{bad json',JSON.stringify({sale:{lines:null},transactions:[],customers:[],next:554})])('recovers bad saved data without losing its backup: %s',raw=>{
  const memory=new Map([['mizan-pos-v1',raw]]);vi.stubGlobal('localStorage',{getItem:(k:string)=>memory.get(k)||null,setItem:(k:string,v:string)=>memory.set(k,v)});
  expect(loadState().sale.lines.length).toBe(6);expect(memory.get('mizan-pos-recovery-v1')).toBe(raw);
 });
 it('rejects unknown products and out-of-range quantity without a crash',()=>{
  const s=seed();const bad={...s.sale,lines:[{id:'bad',productId:'missing',quantity:1}]};
  expect(reducer(s,{type:'sale',sale:bad})).toBe(s);expect(validState({...s,sale:bad})).toBe(false);
 });
 it('accepts Arabic and Persian digits and normalizes Iraqi phone numbers',()=>{
  expect(normalizeDigits('١٢٣٤۵۶')).toBe('123456');expect(normalizePhone('+964 770 123 4567')).toBe('07701234567');
 });
});
