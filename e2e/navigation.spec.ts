import {test,expect,type Page} from '@playwright/test';

const button=(page:Page,name:string)=>page.getByRole('button',{name,exact:true});
test.beforeEach(async({page})=>{await page.goto('/');});

test('rail shortcuts have a single destination and transactions exclude management navigation',async({page})=>{
  await expect(page.locator('.category-rail button.btn')).toHaveCount(0);
  await expect(button(page,'الإعدادات')).toHaveCount(1);
  await expect(button(page,'إعادة بيانات التجربة')).toHaveCount(0);
  await expect(button(page,'سجل العمليات والاعتمادات')).toHaveCount(0);
  await button(page,'الإعدادات').click();
  await expect(page.getByRole('navigation',{name:'أقسام الإدارة'})).toHaveCount(0);
  await button(page,'العودة إلى شاشة البيع').click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await button(page,'المعاملات').click();
  await expect(page.getByRole('navigation',{name:'أقسام الإدارة'})).toHaveCount(0);
  await expect(button(page,'المبيعات')).toHaveCount(0);
  await expect(button(page,'الاسترجاعات')).toHaveCount(0);
  await expect(button(page,'سجل العمليات')).toHaveCount(0);
});

test('product search survives child form cancellation and dirty edits require a decision',async({page})=>{
  await button(page,'الإعدادات والإدارة').click();
  await page.getByRole('textbox',{name:'بحث عن صنف بالاسم أو الباركود'}).fill('100001');
  await expect(page.locator('.managed-product')).toHaveCount(1);
  await button(page,'تسجيل صنف جديد').click();
  await expect(button(page,'العودة إلى الأصناف')).toBeVisible();
  await expect(page.getByRole('textbox',{name:'رمز الميزان (5 أرقام)',exact:true})).toHaveCount(0);
  await page.getByRole('textbox',{name:'اسم الصنف',exact:true}).fill('مسودة صنف');
  await button(page,'إلغاء').click();
  await expect(page.getByRole('heading',{name:'تغييرات غير محفوظة',exact:true})).toBeVisible();
  await expect(button(page,'متابعة التحرير')).toBeFocused();
  await button(page,'متابعة التحرير').click();
  await expect(page.getByRole('textbox',{name:'اسم الصنف',exact:true})).toHaveValue('مسودة صنف');
  await button(page,'العودة إلى الأصناف').click();
  await button(page,'تجاهل التغييرات والمغادرة').click();
  await expect(page.getByRole('heading',{name:'إدارة الأصناف',exact:true})).toBeVisible();
  await expect(page.locator('.managed-product')).toHaveCount(1);
  await page.getByRole('combobox',{name:'الحالة',exact:true}).selectOption('disabled');
  await expect(page.getByRole('status')).toContainText('لا توجد أصناف مطابقة');
});

test('printer draft survives cancelled navigation and saved settings persist',async({page})=>{
  await button(page,'الإعدادات').click();
  await page.getByRole('tab',{name:'المتجر',exact:true}).click();
  const merchant=page.getByRole('textbox',{name:'اسم المتجر',exact:true});
  await merchant.fill('متجر المسودة');
  await button(page,'العودة إلى شاشة البيع').click();
  await button(page,'متابعة التحرير').click();
  await expect(merchant).toHaveValue('متجر المسودة');
  await button(page,'حفظ الإعدادات').click();
  await button(page,'العودة إلى شاشة البيع').click();
  await button(page,'الإعدادات والإدارة').click();await button(page,'التقارير').click();
  await expect(page.getByRole('heading',{name:'التقارير',exact:true})).toBeVisible();
  await expect(button(page,'رجوع')).toHaveCount(0);
  await button(page,'العودة إلى شاشة البيع').click();await button(page,'الإعدادات').click();
  await page.getByRole('tab',{name:'المتجر',exact:true}).click();
  await expect(merchant).toHaveValue('متجر المسودة');
  await merchant.fill('لا تحفظ هذا');
  await button(page,'العودة إلى شاشة البيع').click();
  await button(page,'تجاهل التغييرات والمغادرة').click();
  await button(page,'الإعدادات').click();
  await page.getByRole('tab',{name:'المتجر',exact:true}).click();
  await expect(merchant).toHaveValue('متجر المسودة');
});

test('inventory opens receiving directly without view buttons and protects its draft',async({page})=>{
  await button(page,'الإعدادات والإدارة').click();
  await button(page,'المخزون والاستلام').click();
  await expect(page.getByRole('textbox',{name:'الكمية المستلمة',exact:true})).toBeVisible();
  for(const name of ['حالة المخزون','حركات المخزون','استلام مخزون']) await expect(button(page,name)).toHaveCount(0);
  await expect(page.getByRole('textbox',{name:'بحث في المخزون'})).toHaveCount(0);
  await page.getByRole('textbox',{name:'الكمية المستلمة',exact:true}).fill('3');
  await button(page,'تأكيد الاستلام').click();
  await expect(page.locator('.form-error')).toContainText('الباركود');
  await expect(page.getByRole('textbox',{name:'رمز المدير',exact:true})).toHaveCount(0);
  await button(page,'إدارة الأصناف').click();
  await button(page,'متابعة التحرير').click();
  await expect(page.getByRole('textbox',{name:'الكمية المستلمة',exact:true})).toHaveValue('3');
  await button(page,'العودة إلى شاشة البيع').click();
  await button(page,'تجاهل التغييرات والمغادرة').click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('scanner registration cancel returns directly to the sale and restores scanner focus',async({page})=>{
  const scanner=page.getByRole('textbox',{name:'البحث عن منتج أو باركود',exact:true});
  await scanner.fill('999991');await scanner.press('Enter');
  await button(page,'إلغاء').click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(scanner).toBeFocused();
});

test('management and grouped settings fit narrow touch panes',async({page})=>{
  for(const viewport of [{width:683,height:512},{width:390,height:844}]){
    await page.setViewportSize(viewport);
    await button(page,'الإعدادات').click();
    await expect(page.getByRole('group',{name:'الطابعة ودرج النقد',exact:true})).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    const body=page.locator('.dialog-body');
    expect(await body.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
    await button(page,'حفظ الإعدادات').scrollIntoViewIfNeeded();
    await expect(button(page,'حفظ الإعدادات')).toBeInViewport();
    await page.screenshot({path:`qa/navigation-settings-${viewport.width}.png`});
    await button(page,'العودة إلى شاشة البيع').click();
  }
});
