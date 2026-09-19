import {test,expect,type Page} from '@playwright/test';
const button=(page:Page,name:string)=>page.getByRole('button',{name,exact:true});
async function setup(page:Page,theme='dark'){
 await page.addInitScript(({theme})=>{
  if(localStorage.getItem('selling-test-ready'))return;
  localStorage.setItem('selling-test-ready','1');
  localStorage.setItem('mizan-printer-v1',JSON.stringify({theme}));
  localStorage.setItem('mizan-sales-settings-v1',JSON.stringify({wholesaleEnabled:false,wholesale:{},demoMode:false}));
  const base={category:'starters',tone:'pink',tax:0,cost:600,stock:100,available:true,discountable:true,unit:'piece'};
  localStorage.setItem('mizan-products-v1',JSON.stringify([
   {...base,id:'p1',edited:true,name:'بسكويت حليب · علبة',barcode:'100001',entryMode:'manual',price:1000,packSize:24,packPrice:20000,wholesalePrice:800,wholesaleMinimum:12},
   {...base,id:'custom-pack-test',custom:true,name:'ماء الاختبار',barcode:'880001',packBarcode:'880024',entryMode:'barcode',price:1000,packSize:24,packPrice:20000},
   {...base,id:'p2',edited:true,name:'حبوب إفطار بالشوكولاتة',barcode:'100002',entryMode:'manual',price:1000,unit:'kg',stock:10.5}
  ]));
  localStorage.setItem('mizan-pos-v1',JSON.stringify({sale:{id:'553',lines:[],service:'takeaway',note:'',ageRecords:[],reward:false,createdAt:new Date().toISOString()},held:[],transactions:[],refunds:[],customers:[],audit:[],next:554}));
 },{theme});await page.goto('/');
}
for(const theme of ['dark','light'])test(`inline pack controls and wholesale totals in ${theme}`,async({page})=>{
 await setup(page,theme);await button(page,'إضافة بسكويت حليب · علبة').click();
 await page.locator('.basket-line').filter({hasText:'بسكويت حليب · علبة'}).locator('.line-name').click();
 const options=page.locator('.basket-selling-options');await expect(options).toBeVisible();await expect(button(page,'خصم بسكويت حليب · علبة')).toHaveCount(0);
 await options.getByRole('spinbutton').fill('12');await expect(page.getByTestId('grand-total')).toContainText('9,600');await expect(options.locator('.selling-price')).toContainText('جملة');
 await options.getByRole('spinbutton').fill('11');await expect(page.getByTestId('grand-total')).toContainText('11,000');
 await button(page,'عبوة · 24 قطعة').click();await expect(page.getByTestId('grand-total')).toContainText('20,000');
 await options.getByRole('spinbutton').fill('5');await expect(options.getByRole('alert')).toContainText('المخزون');await page.locator('.basket-line').filter({hasText:'بسكويت حليب · علبة'}).locator('.line-name').click();
 await page.locator('.basket-line').filter({hasText:'بسكويت حليب · علبة'}).locator('.line-name').click();await expect(options.getByRole('spinbutton')).toHaveValue('1');
 await page.screenshot({path:`qa/selling-${theme}.png`,animations:'disabled'});
 await page.reload();await expect(page.getByTestId('grand-total')).toContainText('20,000');
 await button(page,'الدفع').click();await button(page,'دفع').click();await button(page,'بدون طباعة').click();
 const inventory=await page.evaluate(()=>JSON.parse(localStorage.getItem('mizan-inventory-v1')!));expect(inventory.stock.p1).toBe(76);
 await page.reload();const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('mizan-pos-v1')!));expect(state.transactions[0].sale.lines[0]).toMatchObject({saleUnit:'pack',packSize:24,quantity:1});
});
test('pack barcode scans a pack and fractional kg entry stays isolated from scanner',async({page})=>{
 await setup(page);const scanner=page.getByRole('textbox',{name:'البحث عن منتج أو باركود',exact:true});await scanner.fill('880024');await scanner.press('Enter');
 await expect(page.getByTestId('grand-total')).toContainText('20,000');await expect(page.locator('.selling-line-label')).toContainText('24');
 await button(page,'إضافة حبوب إفطار بالشوكولاتة').click();const quantity=page.getByRole('spinbutton',{name:'كمية حبوب إفطار بالشوكولاتة',exact:true});await expect(quantity).toBeVisible();await quantity.fill('0.75');await quantity.press('Tab');
 await expect(page.getByTestId('grand-total')).toContainText('20,750');await expect(page.getByRole('dialog')).toHaveCount(0);
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'qa/selling-mobile.png',fullPage:true,animations:'disabled'});
 await button(page,'الدفع').click();await button(page,'دفع').click();await button(page,'بدون طباعة').click();
 const inventory=await page.evaluate(()=>JSON.parse(localStorage.getItem('mizan-inventory-v1')!));expect(inventory.stock.p2).toBe(9.75);expect(inventory.stock['custom-pack-test']).toBe(76);
 await page.reload();await button(page,'بدء استرجاع').click();await page.getByRole('button',{name:'استرجاع',exact:true}).click();
 const refund=page.locator('.refund-line').filter({hasText:'حبوب إفطار بالشوكولاتة'});await refund.getByRole('spinbutton').fill('0.25');await page.getByRole('combobox',{name:'سبب الاسترجاع'}).selectOption({index:1});
 await button(page,'اعتماد الاسترجاع').click();
 const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('mizan-inventory-v1')!));expect(after.stock.p2).toBe(10);
 await page.reload();expect(await page.evaluate(()=>localStorage.getItem('mizan-pos-recovery-v1'))).toBeNull();
});
test('product editor saves pack and wholesale rules',async({page})=>{
 await setup(page);await button(page,'الإعدادات والإدارة').click();await page.getByRole('tab',{name:'الأصناف اليدوية',exact:true}).click();
 await page.locator('.managed-product').filter({hasText:'بسكويت حليب · علبة'}).getByRole('button',{name:'تعديل',exact:true}).click();
 await page.getByText('بيع بالعبوة',{exact:true}).click();await page.getByRole('spinbutton',{name:'عدد القطع في العبوة',exact:true}).fill('12');await page.getByRole('textbox',{name:'سعر العبوة',exact:true}).fill('10000');
 await page.getByText('سعر الجملة',{exact:true}).click();await page.getByRole('textbox',{name:'سعر الوحدة بالجملة',exact:true}).fill('750');await button(page,'حفظ التعديلات').click();
 await expect(page.getByRole('heading',{name:'تعديل صنف يدوي',exact:true})).toHaveCount(0);await page.reload();
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('mizan-products-v1')!).find((p:any)=>p.id==='p1'));expect(saved).toMatchObject({packSize:12,packPrice:10000,wholesalePrice:750});
});

