import {test,expect} from '@playwright/test';
test('favorite stars control the catalog and persist additions and removals',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'الإعدادات والإدارة',exact:true}).click();
 await page.getByRole('button',{name:'إزالة من المفضلة · بسكويت حليب · علبة',exact:true}).click();
 await page.getByRole('button',{name:'إضافة إلى المفضلة · حليب أطفال · عبوة',exact:true}).click();
 await page.getByRole('button',{name:'العودة إلى شاشة البيع',exact:true}).click();
 await expect(page.getByRole('button',{name:'إضافة بسكويت حليب · علبة',exact:true})).toHaveCount(0);await expect(page.getByRole('button',{name:'إضافة حليب أطفال · عبوة',exact:true})).toBeVisible();
 await page.reload();await expect(page.getByRole('button',{name:'إضافة حليب أطفال · عبوة',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'إضافة بسكويت حليب · علبة',exact:true})).toHaveCount(0);
});
