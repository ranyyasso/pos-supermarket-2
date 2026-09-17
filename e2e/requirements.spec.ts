import {test,expect,type Page} from '@playwright/test';
const b=(p:Page,name:string)=>p.getByRole('button',{name,exact:true});
const f=(p:Page,name:string)=>p.getByRole('textbox',{name,exact:true});
async function approve(p:Page){await f(p,'رمز المدير').fill('2468');await b(p,'اعتماد العملية').click();}
test.beforeEach(async({page})=>{await page.goto('/');});
test('unknown sale barcode saves and adds exactly once, and internal labels print requested copies',async({page})=>{
 await f(page,'البحث عن منتج أو باركود').fill('999876');await f(page,'البحث عن منتج أو باركود').press('Enter');
 await f(page,'اسم الصنف').fill('صنف جديد للبيع');await f(page,'سعر البيع').fill('2500');await f(page,'التكلفة').fill('1500');await page.getByText('تفاصيل إضافية',{exact:true}).click();await f(page,'المخزون الابتدائي').fill('10');
 await b(page,'حفظ وإضافة للسلة').click();await approve(page);
 await expect(page.locator('.basket-line').filter({hasText:'صنف جديد للبيع'})).toHaveCount(1);
 await b(page,'الإعدادات والإدارة').click();
 await page.locator('.managed-product').filter({hasText:'صنف جديد للبيع'}).getByRole('button',{name:'ملصق',exact:true}).click();
 await page.getByRole('spinbutton',{name:'عدد الملصقات'}).fill('3');
 await expect(page.frameLocator('iframe').locator('.label')).toHaveCount(3);
 await expect(page.frameLocator('iframe').locator('svg')).toHaveCount(3);
 await page.screenshot({path:'qa/requirements-labels.png'});
});
test('unknown receiving barcode preserves category and quantity and generates a receipt reference',async({page})=>{
 await b(page,'الإعدادات والإدارة').click();await b(page,'المخزون والاستلام').click();
 await page.getByRole('combobox',{name:'الفئة',exact:true}).selectOption('dessert');await f(page,'الكمية المستلمة').fill('7');
 await f(page,'باركود').fill('999877');await f(page,'باركود').press('Enter');
 await expect(f(page,'الباركود')).toHaveValue('999877');await f(page,'اسم الصنف').fill('صنف مستلم');await f(page,'سعر البيع').fill('3000');await f(page,'التكلفة').fill('1800');
 await b(page,'حفظ الصنف').click();await approve(page);
 await expect(page.getByRole('combobox',{name:'الفئة',exact:true})).toHaveValue('dessert');await expect(f(page,'الكمية المستلمة')).toHaveValue('7');
 await page.screenshot({path:'qa/requirements-receiving.png'});
 await b(page,'تأكيد الاستلام').click();await approve(page);
 const movement=await page.evaluate(()=>JSON.parse(localStorage.getItem('mizan-inventory-v1')!).movements[0]);
 expect(movement).toMatchObject({delta:7,balance:7,unitCost:1800});
 expect(movement.reference).toMatch(/^RECV-/);expect(movement.supplier).toBeUndefined();
 await b(page,'التقارير').click();await page.getByRole('combobox',{name:'التقرير',exact:true}).selectOption('receiving');
 await expect(page.locator('.detailed-report')).toContainText(movement.reference);await page.screenshot({path:'qa/requirements-reports.png'});
 await page.getByLabel('من تاريخ',{exact:true}).fill('2099-01-01');await expect(b(page,'تصدير CSV')).toBeDisabled();
});
test('generated internal barcode is retained and duplicate barcode is rejected',async({page})=>{
 await b(page,'الإعدادات والإدارة').click();await b(page,'تسجيل صنف جديد').click();await b(page,'توليد باركود داخلي').click();
 await expect(f(page,'الباركود')).toHaveValue(/^99\d{10}$/);
 await f(page,'الباركود').fill('100001');await b(page,'حفظ الصنف').click();await expect(page.locator('.form-error')).toContainText('الباركود مسجل مسبقاً');
});
