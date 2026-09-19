import {test,expect,type Page} from '@playwright/test';
const b=(p:Page,name:string)=>p.getByRole('button',{name,exact:true});
const field=(p:Page,name:string)=>p.getByRole('textbox',{name,exact:true});
test.beforeEach(async({page})=>{await page.goto('/');await b(page,'الإعدادات والإدارة').click();});

test('receiving defaults allow navigation but edited cost and barcode remain protected',async({page})=>{
  await b(page,'المخزون والاستلام').click();
  await expect(field(page,'سعر القطعة')).toHaveValue('');
  await b(page,'التقارير').click();
  await expect(page.getByRole('heading',{name:'التقارير',exact:true})).toBeVisible();
  await expect(page.locator('.unsaved-guard')).toHaveCount(0);
  await b(page,'المخزون والاستلام').click();
  await field(page,'سعر القطعة').fill('6100');await b(page,'التقارير').click();
  await expect(page.locator('.unsaved-guard')).toBeVisible();
  await expect(b(page,'العودة إلى التحرير')).not.toContainText('البيع');
  await b(page,'العودة إلى التحرير').click();await expect(field(page,'سعر القطعة')).toHaveValue('6100');
  await field(page,'سعر القطعة').fill('');await b(page,'التقارير').click();
  await expect(page.locator('.unsaved-guard')).toHaveCount(0);
  await b(page,'المخزون والاستلام').click();
  await field(page,'باركود').fill('100010');await b(page,'التقارير').click();
  await b(page,'العودة إلى التحرير').click();await expect(field(page,'باركود')).toHaveValue('100010');
});

test('label copies are contextual and invalid copies cannot print a stale preview',async({page})=>{
  await expect(page.getByRole('spinbutton',{name:'عدد الملصقات'})).toHaveCount(0);
  await page.locator('.managed-product').first().getByRole('button',{name:'ملصق',exact:true}).click();
  const copies=page.getByRole('spinbutton',{name:'عدد الملصقات'});
  await copies.fill('100');await expect(page.frameLocator('iframe').locator('.label')).toHaveCount(100);
  await copies.fill('101');await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.getByRole('alert')).toContainText('100');
  await copies.fill('2');await expect(page.frameLocator('iframe').locator('.label')).toHaveCount(2);
  await b(page,'العودة إلى الأصناف').click();
  await expect(page.getByRole('spinbutton',{name:'عدد الملصقات'})).toHaveCount(0);
});

test('expanded settings autosave and keep the receipt test preview',async({page})=>{
 await b(page,'العودة إلى شاشة البيع').click();await b(page,'الإعدادات').click();await expect(field(page,'اسم الطابعة في Windows')).toBeVisible();await page.getByRole('tab',{name:'المتجر',exact:true}).click();await field(page,'اسم المتجر').fill('متجر مبسط');await page.getByRole('tab',{name:'الإيصال',exact:true}).click();await b(page,'معاينة اختبار').click();const frame=page.frameLocator('iframe');await expect(frame.getByRole('heading',{name:'متجر مبسط',exact:true})).toBeVisible();await expect(frame.getByRole('status')).toContainText('لم يُرسل');await b(page,'العودة إلى الإعدادات').click();await page.getByRole('tab',{name:'المتجر',exact:true}).click();await expect(field(page,'اسم المتجر')).toHaveValue('متجر مبسط');
});
