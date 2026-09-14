import {test, expect} from '@playwright/test';

for (const [width, height] of [[1294,912],[1280,720],[1024,768],[1024,600],[900,650],[800,600],[683,512],[390,844]]) {
 test(`basket remains reachable at ${width}x${height}`, async ({page}) => {
  await page.setViewportSize({width,height});
  await page.goto('/');
  await expect(page.locator('.basket')).toBeVisible();
  await expect(page.locator('header.statusbar')).toHaveCount(0);
  await expect(page.locator('.category-rail .cashier, .rail-session')).toHaveCount(0);
  await expect(page.getByRole('button',{name:'فئة غير مسماة',exact:true})).toHaveCount(5);
  const geometry = await page.evaluate(() => {
   const box = (selector: string) => document.querySelector(selector)!.getBoundingClientRect();
   const basket = box('.basket'), lines = box('.basket-lines'), checkout = box('.checkout');
   return {overflow:document.documentElement.scrollWidth > innerWidth, left:basket.left, right:basket.right,
    bottom:checkout.bottom, listHeight:lines.height, listBottom:lines.bottom, checkoutTop:checkout.top};
  });
  expect(geometry.overflow).toBe(false);
  expect(geometry.left).toBeGreaterThanOrEqual(0);
  expect(geometry.right).toBeLessThanOrEqual(width);
  expect(geometry.listHeight).toBeGreaterThan(60);
  expect(geometry.listBottom).toBeLessThanOrEqual(geometry.checkoutTop + 1);
  if (width >= 720 || width >= 560 && height >= 600) expect(geometry.bottom).toBeLessThanOrEqual(height);
  await page.locator('.basket-line').last().scrollIntoViewIfNeeded();
  await expect(page.locator('.basket-line').last()).toBeInViewport();
  await page.locator('.checkout>.pay').scrollIntoViewIfNeeded();
  await expect(page.locator('.checkout>.pay')).toBeInViewport();
  await expect(page.getByText('اختر صنفاً لإضافته إلى السلة', {exact:true})).toHaveCount(0);
  await expect(page.locator('.catalog-note, .checkout-footnote, .rail-footer')).toHaveCount(0);
  if (width === 1024 && height === 768 || width === 800) await page.screenshot({path:`qa/basket-${width}x${height}.png`});
 });
}

test('product cards contain only a centered clamped name', async ({page}) => {
 await page.setViewportSize({width:1024,height:768});
 await page.goto('/');
 const cards=page.locator('.product-tile');
 await expect(cards).toHaveCount(15);
 expect(await cards.first().locator(':scope > *').count()).toBe(1);
 await expect(cards.first().locator('.product-name')).toHaveText('بسكويت حليب · علبة');
 await expect(cards.first().locator('.product-stock')).toHaveCount(0);
 expect(await cards.locator('svg, .tile-price, .tile-plus, .tile-top, .quantity-badge').count()).toBe(0);
 const layout=await page.evaluate(()=>{
  const cards=[...document.querySelectorAll<HTMLElement>('.product-tile')];
  const name=document.querySelector<HTMLElement>('.product-name')!;
  return {
   columns:getComputedStyle(document.querySelector('.product-grid')!).gridTemplateColumns.split(' ').length,
   equal:cards.every(card=>card.offsetHeight===cards[0].offsetHeight),
   clamp:getComputedStyle(name).webkitLineClamp,
   overflow:getComputedStyle(name).overflow,
  };
 });
 expect(layout).toEqual({columns:3,equal:true,clamp:'2',overflow:'hidden'});
 await expect(page.locator('.checkout>.pay')).toHaveText('الدفع');
 expect(await page.locator('.checkout>.pay svg').count()).toBe(0);

 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>getComputedStyle(document.querySelector('.product-grid')!).gridTemplateColumns.split(' ').length)).toBe(2);
});

test('each basket row has an always-visible direct remove button', async ({page}) => {
 await page.setViewportSize({width:1294,height:912});
 await page.goto('/');
 const rows=page.locator('.basket-line');
 const initialCount=await rows.count();
 expect(initialCount).toBeGreaterThan(0);
 const removeButton=rows.first().getByRole('button',{name:/^حذف .+ من السلة$/});
 await expect(removeButton).toBeVisible();
 await expect(removeButton).toHaveCSS('width','40px');
 await expect(removeButton).toHaveCSS('height','40px');
 await removeButton.click();
 await expect(rows).toHaveCount(initialCount-1);
});

test('desktop category rail uses 125px categories and 50px icon action cells',async({page})=>{
 await page.setViewportSize({width:1294,height:912});await page.goto('/');
 const category=page.locator('.category').first(),cell=page.locator('.rail-tool-cell').first(),rail=page.locator('.category-rail');
 await expect(category).toHaveCSS('width','125px');await expect(category).toHaveCSS('height','50px');
 await expect(category).toHaveCSS('border-top-width','1px');
 await expect(cell).toHaveCSS('width','50px');await expect(cell).toHaveCSS('height','50px');await expect(rail).toHaveCSS('width','175px');
 const positions=await page.evaluate(()=>({category:document.querySelector('.category')!.getBoundingClientRect().x,tools:document.querySelector('.rail-tool-cell')!.getBoundingClientRect().x}));expect(positions.tools).toBeGreaterThan(positions.category);
 await expect(page.getByRole('button',{name:'المعاملات',exact:true})).toHaveText('');
 await expect(page.getByRole('button',{name:'الإعدادات والإدارة',exact:true})).toHaveText('');
 const categoryColors=await page.locator('.category-list > *').evaluateAll(elements=>elements.map(element=>getComputedStyle(element).backgroundColor));
 expect(categoryColors).toEqual(['rgb(221, 199, 111)','rgb(209, 127, 139)','rgb(198, 196, 198)','rgb(134, 183, 213)','rgb(223, 160, 126)','rgb(213, 191, 162)','rgb(167, 206, 126)','rgb(217, 175, 192)','rgb(114, 185, 176)','rgb(159, 174, 216)','rgb(190, 157, 206)','rgb(140, 203, 200)','rgb(224, 173, 143)','rgb(179, 164, 210)']);
 const marker=await category.evaluate(el=>getComputedStyle(el,'::after').content);expect(marker).toBe('none');
 await page.screenshot({path:'qa/category-action-rail-1294x912.png'});
 await expect(page.getByRole('button',{name:/سارة حسن/})).toHaveCount(0);await expect(page.locator('.rail-tool-cell')).toHaveCount(14);await expect(page.getByRole('button',{name:'فئة غير مسماة',exact:true})).toHaveCount(5);
 await page.getByRole('button',{name:'المساعدة',exact:true}).click();await expect(page.getByRole('heading',{name:'دليل نقطة البيع',exact:true})).toBeVisible();
});
