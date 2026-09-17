import {test,expect} from '@playwright/test';

test('management workspaces fill the viewport and preserve the active basket',async({page})=>{
  await page.setViewportSize({width:1366,height:768});
  await page.goto('/');
  const initialLines=await page.locator('.basket-line').count();
  await page.getByRole('button',{name:'الإعدادات والإدارة',exact:true}).click();
  await page.getByRole('button',{name:'إدارة الأصناف',exact:true}).click();
  for(const tab of ['إدارة الأصناف','المخزون والاستلام','التقارير']){
    await page.getByRole('button',{name:tab,exact:true}).click();
    await expect(page.locator('.workspace-shell')).toBeVisible();
    await expect(page.getByRole('button',{name:tab,exact:true})).toHaveAttribute('aria-current','page');
    const geometry=await page.locator('.workspace-shell').evaluate(el=>({width:el.clientWidth,height:el.clientHeight,documentWidth:document.documentElement.scrollWidth,documentHeight:document.documentElement.scrollHeight}));
    expect(geometry).toEqual({width:1366,height:768,documentWidth:1366,documentHeight:768});
  }
  await page.getByRole('button',{name:'العودة إلى شاشة البيع',exact:true}).click();
  await expect(page.locator('.workspace-shell')).toHaveCount(0);
  await expect(page.locator('.basket-line')).toHaveCount(initialLines);
  await expect(page.getByRole('textbox',{name:'البحث عن منتج أو باركود',exact:true})).toBeFocused();
  await page.getByRole('button',{name:'الإعدادات',exact:true}).click();
  await expect(page.getByRole('navigation',{name:'أقسام الإدارة'})).toHaveCount(0);
  await expect(page.locator('.workspace-shell')).toBeVisible();
});

test('management workspaces reflow in a smaller browser pane',async({page})=>{
  await page.setViewportSize({width:800,height:600});
  await page.goto('/');
  await page.getByRole('button',{name:'الإعدادات والإدارة',exact:true}).click();
  await page.getByRole('button',{name:'إدارة الأصناف',exact:true}).click();
  await expect(page.getByRole('navigation',{name:'أقسام الإدارة'})).toBeVisible();
  const geometry=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,shell:[document.querySelector('.workspace-shell')!.clientWidth,document.querySelector('.workspace-shell')!.clientHeight]}));
  expect(geometry).toEqual({overflow:false,shell:[800,600]});
  await expect(page.getByRole('button',{name:'العودة إلى شاشة البيع',exact:true})).toBeInViewport();
});
