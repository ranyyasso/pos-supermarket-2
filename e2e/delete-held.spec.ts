import {test,expect} from '@playwright/test';
test('suspended sale deletion can be cancelled and persists after confirmation',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'حفظ في المبيعات المعلقة',exact:true}).click();await page.getByRole('button',{name:'حفظ في المبيعات المعلقة',exact:true}).click();
 await page.getByRole('button',{name:'المبيعات المعلقة',exact:true}).click();
 const remove=page.getByRole('button',{name:'حذف البيع المعلق #553',exact:true});await remove.click();
 await page.getByRole('button',{name:'رجوع',exact:true}).click();await expect(remove).toBeVisible();await remove.click();await page.getByRole('button',{name:'تأكيد المتابعة',exact:true}).click();
 await expect(page.getByText('لا توجد مبيعات معلقة',{exact:true})).toBeVisible();await page.reload();await page.getByRole('button',{name:'المبيعات المعلقة',exact:true}).click();await expect(page.getByText('لا توجد مبيعات معلقة',{exact:true})).toBeVisible();
});
