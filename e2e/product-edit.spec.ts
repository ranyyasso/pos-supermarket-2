import {test,expect} from '@playwright/test';
test('built-in products have editable details and persist barcode, prices and stock',async({page})=>{
 const button=(name:string)=>page.getByRole('button',{name,exact:true});const field=(name:string)=>page.getByRole('textbox',{name,exact:true});
 await page.goto('/');await button('الإعدادات والإدارة').click();await page.locator('.managed-product').first().getByRole('button',{name:'تعديل',exact:true}).click();
 await expect(page.getByRole('heading',{name:'تعديل الصنف',exact:true})).toBeVisible();
 await field('الباركود').fill('100002');await button('حفظ التعديلات').click();await expect(page.locator('.form-error')).toContainText('مسجل');
 await field('الباركود').fill('99881122');await field('اسم الصنف').fill('بسكويت معدل');await field('سعر البيع').fill('9200');await field('التكلفة').fill('6100');
 await page.getByText('تفاصيل إضافية',{exact:true}).click();await field('كمية المخزون').fill('50');await field('المورّد').fill('المورد الجديد');await expect(field('حد المخزون المنخفض')).toHaveCount(0);await expect(field('الضريبة %')).toHaveCount(0);
 await button('حفظ التعديلات').click();await field('رمز المدير').fill('2468');await button('اعتماد العملية').click();await expect(page.locator('.managed-product').first()).toContainText('بسكويت معدل');
 await page.reload();await button('الإعدادات والإدارة').click();await page.locator('.managed-product').first().getByRole('button',{name:'تعديل',exact:true}).click();
 await expect(field('الباركود')).toHaveValue('99881122');await expect(field('سعر البيع')).toHaveValue('9200');await expect(field('التكلفة')).toHaveValue('6100');await page.getByText('تفاصيل إضافية',{exact:true}).click();await expect(field('كمية المخزون')).toHaveValue('50');await expect(field('المورّد')).toHaveValue('المورد الجديد');
 const movement=await page.evaluate(()=>JSON.parse(localStorage.getItem('mizan-inventory-v1')!).movements[0]);expect(movement).toMatchObject({productId:'p1',type:'adjust',delta:26,balance:50});
});
