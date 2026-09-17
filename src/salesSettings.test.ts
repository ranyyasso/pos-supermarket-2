import { afterEach, describe, expect, it, vi } from 'vitest';
import { cashPayment, couponError, discountConflict, legacyPrice, newSale, price, reducer, refundValue, seed, validState } from './model';
import { defaultSalesSettings, loadSalesSettings, saveSalesSettings, salesSettingsKey, type SalesSettings, type StoreOffer } from './salesSettings';
afterEach(()=>vi.unstubAllGlobals());
const offer=(extra:Partial<StoreOffer>={}):StoreOffer=>({id:'one',name:'عرض المتجر',code:'',kind:'percent',value:10,minimumSpend:0,category:'',active:true,...extra});
const store=(extra:Partial<SalesSettings>={}):SalesSettings=>({...defaultSalesSettings(),demoMode:false,...extra});
const basket=()=>({...newSale(1),lines:[{id:'a',productId:'p1',quantity:2},{id:'b',productId:'p10',quantity:2}]});
describe('store pricing rules',()=>{
  it('disables every hard-coded offer outside demo mode',()=>{
    expect(price(basket(),store()).promotions).toBe(0);
    expect(price({...basket(),coupon:'WELCOME10'},store()).basketDiscount).toBe(0);
    for(const code of ['WELCOME10','DESSERT5','JUICE2'])expect(couponError(code,basket(),store())).toBeDefined();
  });
  it('requires explicit activation and selects only the largest automatic saving',()=>{
    expect(price(basket(),store({offers:[offer({active:false})]})).total).toBe(22000);
    const result=price(basket(),store({offers:[offer(),offer({id:'two',value:20})]}));
    expect(result.basketDiscount).toBe(4000);expect(result.savings).toHaveLength(1);
    expect(result.savings[0]).toEqual({reason:'عرض المتجر',amount:4000});
  });
  it('compares demo and configured offers instead of stacking them',()=>{
    const result=price(basket(),{...store({offers:[offer({value:20})]}),demoMode:true});
    expect(result.promotions).toBe(0);expect(result.basketDiscount).toBe(4000);
  });
  it('enforces coupon scope, minimum and activation',()=>{
    const settings=store({offers:[offer({code:'SNACKS',category:'starters',minimumSpend:16000})]});
    expect(couponError('SNACKS',basket(),settings)).toBeUndefined();
    const result=price({...basket(),coupon:'SNACKS'},settings);
    expect(result.basketDiscount).toBe(1600);expect(result.rows[1].basketDiscount).toBe(0);
    expect(couponError('SNACKS',{...basket(),lines:[{id:'a',productId:'p1',quantity:1}]},settings)).toBeDefined();
    expect(couponError('SNACKS',basket(),store({offers:[offer({code:'SNACKS',active:false})]}))).toBeDefined();
  });
  it('suppresses automatic offers for explicit discounts and rejects conflicting choices',()=>{
    const settings=store({offers:[offer()]});
    const manual={...basket(),discount:{kind:'fixed' as const,value:500}};
    expect(price(manual,settings).basketDiscount).toBe(500);
    expect(discountConflict({...manual,coupon:'SNACKS'},settings)).toBeDefined();
    expect(discountConflict({...manual,service:'dinein'},{...settings,wholesaleEnabled:true})).toBeDefined();
    expect(price({...manual,coupon:'SNACKS'},settings).itemDiscount).toBe(0);
  });
  it('aggregates quantities across noted lines but never changes scale-label amounts',()=>{
    const settings=store({wholesaleEnabled:true,wholesale:{p1:{price:7000,minimum:2}}});
    const sale={...newSale(1),service:'dinein' as const,lines:[{id:'a',productId:'p1',quantity:1,note:'one'},{id:'b',productId:'p1',quantity:1,note:'two'},{id:'c',productId:'p1',quantity:1,priceOverride:5000,scaleWeight:0.5}]};
    expect(price(sale,settings).rows.map(r=>r.gross)).toEqual([7000,7000,5000]);
  });
  it('validates settings, persists activation and rejects duplicate/reserved codes',()=>{
    const memory=new Map<string,string>();vi.stubGlobal('localStorage',{getItem:(key:string)=>memory.get(key)||null,setItem:(key:string,value:string)=>memory.set(key,value)});
    saveSalesSettings(store({offers:[offer({code:'STORE10'})]}));expect(loadSalesSettings().demoMode).toBe(false);
    expect(()=>saveSalesSettings(store({offers:[offer({code:'WELCOME10'})]}))).toThrow();
    expect(()=>saveSalesSettings(store({wholesale:{p1:{price:-1,minimum:0}}}))).toThrow();
    memory.set(salesSettingsKey,JSON.stringify({...store(),wholesale:{p1:{price:'bad',minimum:2}}}));expect(loadSalesSettings().wholesale).toEqual({});
  });
  it('keeps completed custom-coupon receipts valid after offer changes',()=>{
    const settings=store({offers:[offer({code:'STORE10'})]});vi.stubGlobal('localStorage',{getItem:()=>JSON.stringify(settings)});
    const state=seed();state.sale.coupon='STORE10';const amount=price(state.sale).total;
    const completed=reducer(state,{type:'complete',payments:[cashPayment(amount,amount)]});
    expect(completed.transactions).toHaveLength(1);expect(validState(completed)).toBe(true);
    settings.offers=[];
    expect(refundValue(completed.transactions[0],Object.fromEntries(state.sale.lines.map(l=>[l.id,l.quantity])))).toBe(amount);
  });
  it('preserves historical wholesale calculations independently from current settings',()=>{
    const sale={...basket(),service:'dinein' as const};
    expect(legacyPrice(sale).subtotal).toBe(18000);
    expect(price(sale,store()).subtotal).toBe(20000);
  });
});
