import {test,expect} from '@playwright/test';

test('theme choice persists, preserves basket and reverses to original dark palette',async({page})=>{
 await page.goto('/');
 await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 await page.getByRole('button',{name:'إضافة بسكويت حليب · علبة',exact:true}).click();
 const total=await page.getByTestId('grand-total').innerText();
 const categoryColor=await page.locator('.category').first().evaluate(e=>getComputedStyle(e).backgroundColor);
 await page.getByRole('button',{name:'الإعدادات',exact:true}).click();
 await page.getByRole('tab',{name:'المظهر والتجربة',exact:true}).click();
 await page.getByRole('radio',{name:'فاتح',exact:true}).check();
 await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 await page.getByRole('button',{name:'العودة إلى شاشة البيع',exact:true}).click();
 await expect(page.getByTestId('grand-total')).toHaveText(total);
 await expect(page.locator('.category').first()).toHaveCSS('background-color',categoryColor);
 await page.reload();
 await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 await expect(page.getByTestId('grand-total')).toHaveText(total);
 await page.screenshot({path:'qa/theme-light.png'});
 await page.getByRole('button',{name:'الإعدادات',exact:true}).click();
 await page.getByRole('tab',{name:'المظهر والتجربة',exact:true}).click();
 await page.getByRole('radio',{name:'داكن',exact:true}).check();
 await page.reload();
 await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 await expect(page.locator('body')).toHaveCSS('background-color','rgb(23, 27, 34)');
 await page.screenshot({path:'qa/theme-dark.png'});
});

test('light theme on a phone retains reachable settings and payment controls',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');
 await page.getByRole('button',{name:'الإعدادات',exact:true}).click();
 await page.getByRole('tab',{name:'المظهر والتجربة',exact:true}).click();
 await page.getByRole('radio',{name:'فاتح',exact:true}).check();
 await page.screenshot({path:'qa/theme-settings-mobile.png'});
 await page.getByRole('button',{name:'العودة إلى شاشة البيع',exact:true}).click();
 await page.getByRole('button',{name:'إضافة بسكويت حليب · علبة',exact:true}).click();
 await page.getByRole('button',{name:'الدفع',exact:true}).click();
 await expect(page.getByRole('button',{name:'دفع',exact:true})).toBeVisible();
 await page.screenshot({path:'qa/theme-payment-mobile.png'});
});
