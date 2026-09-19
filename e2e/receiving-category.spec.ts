import {test,expect,type Page} from '@playwright/test';
const button=(page:Page,name:string)=>page.getByRole('button',{name,exact:true});
const field=(page:Page,name:string)=>page.getByRole('textbox',{name,exact:true});
async function manager(page:Page){await field(page,'رمز المدير').fill('2468');await button(page,'اعتماد العملية').click();}
test('settings categories persist and populate barcode receiving and new-product registration',async({page})=>{
  await page.goto('/');await button(page,'الإعدادات').click();await page.getByRole('tab',{name:'الفئات',exact:true}).click();
  await field(page,'اسم الفئة').fill('مستلزمات المدرسة');await button(page,'إضافة فئة').click();await manager(page);
  await expect(page.locator('.registered-categories')).toContainText('مستلزمات المدرسة');
  await field(page,'اسم الفئة').fill('مستلزمات المدرسة');await button(page,'إضافة فئة').click();await expect(page.getByRole('alert')).toContainText('مسجلة');await field(page,'اسم الفئة').fill('');
  await button(page,'العودة إلى شاشة البيع').click();await page.reload();await button(page,'الإعدادات والإدارة').click();await button(page,'المخزون والاستلام').click();
  const category=page.getByRole('combobox',{name:'الفئة',exact:true});await category.selectOption({label:'مستلزمات المدرسة'});const id=await category.inputValue();
  await expect(page.getByRole('combobox')).toHaveCount(1);await expect(field(page,'المورّد')).toHaveCount(0);await expect(field(page,'مرجع الاستلام')).toHaveCount(0);
  await field(page,'باركود').fill('998822');await field(page,'باركود').press('Enter');await expect(category).toHaveValue(id);
  await field(page,'اسم الصنف').fill('دفتر مدرسي');await field(page,'سعر البيع').fill('3000');await field(page,'التكلفة').fill('2000');await button(page,'حفظ الصنف').click();await manager(page);
  await expect(category).toHaveValue(id);await expect(page.locator('.receiving-match')).toContainText('دفتر مدرسي');await expect(field(page,'سعر القطعة')).toHaveValue('2000');
  await field(page,'الكمية المستلمة').fill('4');await button(page,'تأكيد الاستلام').click();await manager(page);await expect(field(page,'باركود')).toHaveValue('');
  const movement=await page.evaluate(()=>JSON.parse(localStorage.getItem('mizan-inventory-v1')!).movements[0]);expect(movement).toMatchObject({delta:4,balance:4,unitCost:2000});expect(movement.reference).toMatch(/^RECV-/);expect(movement.supplier).toBeUndefined();
});
test('receiving rejects missing and mismatched barcode selection and centers confirmation',async({page})=>{
  await page.goto('/');await button(page,'الإعدادات والإدارة').click();await button(page,'المخزون والاستلام').click();
  await field(page,'الكمية المستلمة').fill('3');await field(page,'سعر القطعة').fill('5000');await button(page,'تأكيد الاستلام').click();await expect(page.getByRole('alert')).toContainText('الباركود');
  await page.getByRole('combobox',{name:'الفئة',exact:true}).selectOption('dessert');await field(page,'باركود').fill('100001');await button(page,'بحث').click();await expect(page.getByRole('alert')).toContainText('الفئة المحددة');
  await page.getByRole('combobox',{name:'الفئة',exact:true}).selectOption('starters');await button(page,'بحث').click();await expect(page.locator('.receiving-match')).toContainText('بسكويت حليب');
  await field(page,'باركود').fill('100010');await expect(page.locator('.receiving-match')).toHaveCount(0);await button(page,'تأكيد الاستلام').click();await expect(page.getByRole('alert')).toContainText('الباركود');
  const footer=await page.locator('.receiving-actions').boundingBox();const action=await button(page,'تأكيد الاستلام').boundingBox();expect(Math.abs(footer!.x+footer!.width/2-action!.x-action!.width/2)).toBeLessThan(2);
});
