import {test,expect} from '@playwright/test';
test('category controls limit names and persist removal without orphaning products',async({page})=>{
 const b=(name:string)=>page.getByRole('button',{name,exact:true});
 const open=async()=>{await b('الإعدادات').click();await page.getByRole('tab',{name:'الفئات',exact:true}).click();};
 const approve=async()=>{await page.getByRole('textbox',{name:'رمز المدير',exact:true}).fill('2468');await b('اعتماد العملية').click();};
 await page.goto('/');await open();const input=page.getByRole('textbox',{name:'اسم الفئة',exact:true});await expect(input).toHaveAttribute('maxlength','24');await input.fill('فئة جديدة');await expect(page.locator('#category-name-count')).toHaveText('9 / 24');await b('إضافة فئة').click();await approve();await b('حذف فئة فئة جديدة').click();await approve();await expect(b('حذف فئة فئة جديدة')).toHaveCount(0);
 await b('حذف فئة الوجبات الخفيفة').click();await expect(page.getByRole('alert')).toContainText('انقل أصناف');await page.reload();await open();await expect(b('حذف فئة فئة جديدة')).toHaveCount(0);await expect(b('حذف فئة الوجبات الخفيفة')).toBeVisible();
});
test('13 regular categories reserve the Favorites slot and block further additions',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('mizan-categories-v1',JSON.stringify(Array.from({length:5},(_,i)=>({id:'category-extra-'+i,name:'فئة '+i,tone:'neutral'})))));
 await page.goto('/');await page.getByRole('button',{name:'الإعدادات',exact:true}).click();await page.getByRole('tab',{name:'الفئات',exact:true}).click();
 await expect(page.locator('.category-chip')).toHaveCount(13);await expect(page.locator('.category-capacity')).toHaveText('الفئات: 13 / 13');await expect(page.getByRole('button',{name:'إضافة فئة',exact:true})).toBeDisabled();await expect(page.getByRole('button',{name:'حذف فئة المفضلة',exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'حذف فئة فئة 0',exact:true}).click();await page.getByRole('textbox',{name:'رمز المدير',exact:true}).fill('2468');await page.getByRole('button',{name:'اعتماد العملية',exact:true}).click();await expect(page.getByRole('button',{name:'إضافة فئة',exact:true})).toBeEnabled();await expect(page.locator('.category-capacity')).toHaveText('الفئات: 12 / 13');
});
