import {test,expect} from '@playwright/test';
test('configured drawer reasons persist and populate the dropdown',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'الإعدادات',exact:true}).click();await page.getByRole('textbox',{name:'أسباب فتح الدرج (سبب في كل سطر)',exact:true}).fill('صرف فكة\nتوريد نقد');await page.getByRole('button',{name:'حفظ الإعدادات',exact:true}).click();await page.reload();await page.getByRole('button',{name:'درج النقد',exact:true}).click();
 await expect(page.getByRole('button',{name:'طلب فتح الدرج',exact:true})).toBeDisabled();const reasons=page.getByRole('combobox',{name:'سبب فتح الدرج',exact:true});await expect(reasons.locator('option')).toHaveText(['اختر السبب','صرف فكة','توريد نقد']);await reasons.selectOption('صرف فكة');await expect(page.getByRole('button',{name:'طلب فتح الدرج',exact:true})).toBeEnabled();await expect(page.getByText('فتح الدرج محاكاة؛ لم يُرسل أمر إلى جهاز.',{exact:true})).toHaveCount(0);
});
