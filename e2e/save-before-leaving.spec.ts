import {test,expect} from '@playwright/test';
const b=(page:any,name:string)=>page.getByRole('button',{name,exact:true});
test('valid store edits save automatically without an exit prompt',async({page})=>{
 await page.goto('/');await b(page,'الإعدادات').click();await page.getByRole('tab',{name:'المتجر',exact:true}).click();await page.getByRole('textbox',{name:'اسم المتجر',exact:true}).fill('متجر محفوظ');await b(page,'العودة إلى شاشة البيع').click();await expect(page.getByRole('dialog')).toHaveCount(0);await page.reload();await b(page,'الإعدادات').click();await page.getByRole('tab',{name:'المتجر',exact:true}).click();await expect(page.getByRole('textbox',{name:'اسم المتجر',exact:true})).toHaveValue('متجر محفوظ');
});

test('Yes waits for category approval and cancellation retains its draft',async({page})=>{
 await page.goto('/');await b(page,'الإعدادات').click();await page.getByRole('tab',{name:'الفئات',exact:true}).click();await page.getByRole('textbox',{name:'اسم الفئة',exact:true}).fill('فئة محفوظة');
 await b(page,'العودة إلى شاشة البيع').click();await b(page,'نعم').click();await expect(page.getByRole('heading',{name:'موافقة المدير',exact:true})).toBeVisible();await b(page,'إغلاق').click();await expect(page.getByRole('textbox',{name:'اسم الفئة',exact:true})).toHaveValue('فئة محفوظة');
 await b(page,'العودة إلى شاشة البيع').click();await b(page,'نعم').click();await page.getByRole('textbox',{name:'رمز المدير',exact:true}).fill('2468');await b(page,'اعتماد العملية').click();await expect(page.getByRole('dialog')).toHaveCount(0);
 await page.reload();await b(page,'الإعدادات').click();await page.getByRole('tab',{name:'الفئات',exact:true}).click();await expect(page.locator('.registered-categories')).toContainText('فئة محفوظة');
});
