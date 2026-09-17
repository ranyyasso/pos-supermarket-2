import {it,expect,vi,afterEach} from 'vitest';
import {products,updateRegisteredProduct,hydrateRegisteredProducts,hydrateInventory,receiveInventory,inventoryMovements} from './model';
const originals=products.map(p=>({...p}));
afterEach(()=>{products.splice(0,products.length,...originals.map(p=>({...p})));vi.unstubAllGlobals();});
function storage(){const data=new Map<string,string>();vi.stubGlobal('localStorage',{getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>data.set(k,v),removeItem:(k:string)=>data.delete(k)});return data;}
it('persists built-in identity edits, stock adjustment and cost after receiving',()=>{
 storage();receiveInventory('p1',2,6000);const old=products[0];
 updateRegisteredProduct({...old,edited:true,name:'Edited',barcode:'99000001',price:9000,cost:6500,stock:40});
 expect(inventoryMovements()[0]).toMatchObject({productId:'p1',delta:14,balance:40,type:'adjust'});
 products.splice(0,products.length,...originals.map(p=>({...p})));hydrateRegisteredProducts();hydrateInventory();
 expect(products[0]).toMatchObject({id:'p1',name:'Edited',barcode:'99000001',price:9000,cost:6500,stock:40});
 expect(products).toHaveLength(originals.length);
});
it('rejects duplicate barcode edits without changing stored data',()=>{
 const data=storage();expect(()=>updateRegisteredProduct({...products[0],edited:true,barcode:products[1].barcode})).toThrow('الباركود');expect(data.size).toBe(0);expect(products[0]).toEqual(originals[0]);
});
it('rolls back product persistence when inventory storage fails',()=>{
 const data=storage();vi.stubGlobal('localStorage',{getItem:(k:string)=>data.get(k)??null,removeItem:(k:string)=>data.delete(k),setItem:(k:string,v:string)=>{if(k==='mizan-inventory-v1')throw new Error('full');data.set(k,v);}});
 expect(()=>updateRegisteredProduct({...products[0],edited:true,stock:50})).toThrow('full');expect(products[0]).toEqual(originals[0]);expect(data.has('mizan-products-v1')).toBe(false);
});
