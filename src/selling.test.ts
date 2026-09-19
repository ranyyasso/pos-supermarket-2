import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import {products,productById,newSale,price,seed,reducer,validState,isSale,refundValue,findBarcode,lineStockQuantity,lineQuantityText,registerProduct,updateRegisteredProduct,changeInventory,receiveInventory,hydrateRegisteredProducts,sellingOptionsError,type Product,type Line,type State} from './model';
import {buildDailyReport} from './reports';
import {salePrintReceipt,refundPrintReceipt} from './printing';
const original=structuredClone(products);
const settings={wholesaleEnabled:false,wholesale:{},demoMode:false};
const product=():Product=>({...productById('p1'),tax:0,price:1000,cost:600,stock:100,packSize:24,packPrice:20000,wholesaleMinimum:12,wholesalePrice:800});
const sale=(lines:Line[])=>({...newSale(553),lines});
beforeEach(()=>{const values=new Map<string,string>();vi.stubGlobal('localStorage',{getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>values.set(k,v),removeItem:(k:string)=>values.delete(k)});Object.assign(productById('p1'),product());});
afterEach(()=>{products.splice(0,products.length,...structuredClone(original));vi.unstubAllGlobals();});
describe('mixed units and automatic wholesale',()=>{
 it('prices a pack separately, applies loose-unit wholesale at its threshold, and reverses below it',()=>{
  const pack:Line={id:'pack',productId:'p1',quantity:1,saleUnit:'pack',packSize:24,packPrice:20000};
  const loose:Line={id:'loose',productId:'p1',quantity:12,saleUnit:'piece'};
  const result=price(sale([pack,loose]),settings);
  expect(result.total).toBe(29600);expect(result.rows[1].wholesaleSaving).toBe(2400);expect(lineStockQuantity(pack)).toBe(24);
  expect(price(sale([pack,{...loose,quantity:11}]),settings).total).toBe(31000);
  expect(lineQuantityText(pack)).toBe('1 عبوة × 24 قطعة');
 });
 it('does not combine automatic wholesale with a manual discount',()=>{
  const result=price({...sale([{id:'l',productId:'p1',quantity:12}]),discount:{kind:'percent',value:10}},settings);
  expect(result.total).toBe(10800);expect(result.wholesaleSaving).toBe(0);
 });
 it('snapshots pack quantities through completion, later product edits, refunds, reports and reload validation',()=>{
  let state:State={...seed(),sale:sale([{id:'pack',productId:'p1',quantity:2,saleUnit:'pack' as const,packSize:24,packPrice:20000}]),held:[],transactions:[],refunds:[]};
  changeInventory([{productId:'p1',quantity:-48}],'sale','553');
  state=reducer(state,{type:'complete',payments:[{id:'pay',method:'cash',amount:40000,tendered:40000,change:0}]});
  expect(validState(state)).toBe(true);const tx=state.transactions[0];
  Object.assign(productById('p1'),{packSize:12,packPrice:11000});
  expect(lineStockQuantity(tx.sale.lines[0])).toBe(48);expect(refundValue(tx,{pack:1})).toBe(20000);
  state=reducer(state,{type:'refund',id:'553',selected:{pack:1},reason:'تالف',cash:false});
  changeInventory([{productId:'p1',quantity:24}],'refund','553');
  expect(productById('p1').stock).toBe(76);expect(validState(state)).toBe(true);
  const report=buildDailyReport(state);expect(report.productDetails[0].quantity).toBe(24);expect(report.estimatedProfit).toBe(5600);
  expect(salePrintReceipt(tx).rows[0].quantity).toBe('2 عبوة × 24 قطعة');expect(refundPrintReceipt(state.refunds[0],tx).rows[0].quantity).toBe('1 عبوة × 24 قطعة');
 });
 it.each(['kg','l'] as const)('supports fractional %s stock, price, repeated partial refunds and saved state',unit=>{
  Object.assign(productById('p1'),{unit,packSize:undefined,packPrice:undefined,wholesaleMinimum:undefined,wholesalePrice:undefined});
  let state:State={...seed(),sale:sale([{id:'l',productId:'p1',quantity:0.75,saleUnit:unit}]),held:[],transactions:[],refunds:[]};
  expect(price(state.sale,settings).total).toBe(750);
  state=reducer(state,{type:'complete',payments:[{id:'pay',method:'cash',amount:750,tendered:750,change:0}]});
  expect(validState(state)).toBe(true);
  for(const q of [0.1,0.2,0.45])state=reducer(state,{type:'refund',id:'553',selected:{l:q},reason:'تالف',cash:false});
  expect(state.transactions[0].refunded.l).toBe(0.75);expect(state.refunds.reduce((v,r)=>v+r.total,0)).toBe(750);expect(validState(state)).toBe(true);
  expect(()=>refundValue(state.transactions[0],{l:0.001})).toThrow();
 });
 it('validates packaging, barcode collisions, decimal stock and reload hydration',()=>{
  const p={...product(),id:'custom-unit-test',custom:true,entryMode:'barcode' as const,barcode:'880001',packBarcode:'880024'};
  registerProduct(p);expect(findBarcode('880024')).toMatchObject({product:{id:p.id},saleUnit:'pack'});
  expect(sellingOptionsError({...p,id:'other',barcode:'880024',packBarcode:undefined})).toContain('مسجل');
  expect(()=>registerProduct({...p,id:'custom-invalid',barcode:'991122',packSize:1})).toThrow();
  const weighed={...p,id:'custom-weighed',barcode:'880099',unit:'kg' as const,stock:1.25,packSize:undefined,packPrice:undefined,packBarcode:undefined};
  registerProduct(weighed);receiveInventory(weighed.id,0.75,600);expect(weighed.stock).toBe(2);
  products.splice(products.findIndex(p=>p.id===weighed.id),1);hydrateRegisteredProducts();expect(productById(weighed.id).stock).toBe(1.25);
  expect(()=>receiveInventory('p1',0.5,600)).toThrow();
 });
 it('rejects corrupt pack snapshots and fractional pieces',()=>{
  expect(isSale(sale([{id:'l',productId:'p1',quantity:0.5,saleUnit:'piece'}]))).toBe(false);
  expect(isSale(sale([{id:'l',productId:'p1',quantity:1,saleUnit:'pack',packSize:0,packPrice:20000}]))).toBe(false);
  expect(isSale(sale([{id:'l',productId:'p1',quantity:0.1234,saleUnit:'kg'}]))).toBe(false);
 });
});

