import {test,expect,type Page} from '@playwright/test';
const button=(p:Page,name:string)=>p.getByRole('button',{name,exact:true});
const field=(p:Page,name:string)=>p.getByRole('textbox',{name,exact:true});
async function approve(p:Page){await field(p,'رمز المدير').fill('2468');await button(p,'اعتماد العملية').click();}
async function settings(p:Page){await button(p,'الإعدادات').click();await p.getByRole('tab',{name:'المتجر',exact:true}).click();}
test.beforeEach(async({page})=>{await page.goto('/');});
test('store offers require configuration and activation, and production Help excludes demo material',async({page})=>{
  await settings(page);await page.getByText('العروض ووضع التجربة',{exact:true}).click();
  await page.getByRole('checkbox',{name:'وضع التجربة',exact:true}).click();await approve(page);
  await field(page,'اسم العرض').fill('عرض المدرسة');
  await button(page,'حفظ العرض').click();await approve(page);
  await button(page,'العودة إلى شاشة البيع').click();
  await settings(page);await page.getByText('العروض ووضع التجربة',{exact:true}).click();
  await page.getByRole('button',{name:/عرض المدرسة/}).click();await page.getByRole('checkbox',{name:'تفعيل العرض',exact:true}).check();await button(page,'حفظ العرض').click();await approve(page);
  await button(page,'العودة إلى شاشة البيع').click();await page.reload();
  await button(page,'المساعدة').click();const help=page.getByRole('dialog');await expect(help).not.toContainText('2468');await expect(help).not.toContainText('WELCOME10');await expect(help).not.toContainText('محاكاة');await expect(help).not.toContainText('بطاقة أحمد');await button(page,'إغلاق').click();
  await expect(page.getByTestId('grand-total')).toContainText('43,560');await expect(page.locator('.totals')).toContainText('عرض المدرسة');
});
test('printer shortcut opens Hardware in the one Settings workspace and tab drafts survive',async({page})=>{
  await button(page,'الإعدادات').click();await expect(page.getByRole('heading',{name:'الإعدادات',exact:true})).toBeVisible();await expect(page.getByRole('tab',{name:'الأجهزة',exact:true})).toHaveAttribute('aria-selected','true');
  await page.getByRole('tab',{name:'المتجر',exact:true}).click();await field(page,'اسم المتجر').fill('متجر موحد');
  await page.getByRole('tab',{name:'الإيصال',exact:true}).click();await field(page,'نهاية الإيصال').fill('شكراً');await page.getByRole('tab',{name:'المتجر',exact:true}).click();await expect(field(page,'اسم المتجر')).toHaveValue('متجر موحد');
  await button(page,'حفظ الإعدادات').click();await button(page,'العودة إلى شاشة البيع').click();await settings(page);await expect(field(page,'اسم المتجر')).toHaveValue('متجر موحد');
});
test('start return selects a receipt, then completed refunds appear in Returns',async({page})=>{
  await button(page,'الدفع').click();await button(page,'دفع').click();await button(page,'بدون إيصال').click();await button(page,'تأكيد بدون إيصال').click();await button(page,'بدء طلب جديد').click();
  await button(page,'بدء استرجاع').click();await expect(page.getByRole('heading',{name:'اختر فاتورة للاسترجاع',exact:true})).toBeVisible();await expect(button(page,'إلغاء المعاملة')).toHaveCount(0);await expect(button(page,'الاسترجاعات')).toBeHidden();
  await field(page,'بحث برقم الإيصال').fill('553');await page.locator('.transaction-card').getByRole('button',{name:'استرجاع',exact:true}).click();await page.locator('.refund-line input').first().fill('1');await field(page,'سبب الاسترجاع').fill('عبوة تالفة');await button(page,'اعتماد الاسترجاع').click();await approve(page);
  await expect(page.getByRole('heading',{name:'سجل المعاملات',exact:true})).toBeVisible();await expect(button(page,'الاسترجاعات')).toHaveCount(0);await expect(page.getByRole('dialog')).toContainText('عبوة تالفة');
});
test('parked-sale count persists and search only advertises number or note',async({page})=>{
  await expect(button(page,'المبيعات المعلقة')).toBeVisible();await button(page,'حفظ في المبيعات المعلقة').click();await expect(page.getByRole('heading',{name:'المبيعات المعلقة',exact:true})).toBeVisible();await page.getByRole('dialog').getByRole('button',{name:'حفظ في المبيعات المعلقة',exact:true}).click();
  await expect(button(page,'المبيعات المعلقة')).toBeVisible();await page.reload();await button(page,'المبيعات المعلقة').click();await expect(field(page,'بحث بالرقم أو اسم الصنف')).toHaveCount(0);await expect(page.getByRole('dialog')).not.toContainText('العميل');await page.getByRole('button',{name:/#553 · بسكويت حليب/}).click();await expect(button(page,'المبيعات المعلقة')).toBeVisible();
});
test('wholesale and offer drafts are protected on exit and cancelled approval preserves input',async({page})=>{
  await settings(page);await page.getByText('البيع بالجملة',{exact:true}).click();await field(page,'سعر الجملة الاختياري').fill('7000');await button(page,'حفظ سعر الجملة').click();await button(page,'إغلاق').click();await expect(field(page,'سعر الجملة الاختياري')).toHaveValue('7000');
  await button(page,'العودة إلى شاشة البيع').click();await expect(page.getByRole('heading',{name:'حفظ التغييرات؟',exact:true})).toBeVisible();await button(page,'العودة إلى التحرير').click();await expect(field(page,'سعر الجملة الاختياري')).toHaveValue('7000');await button(page,'حفظ سعر الجملة').click();await approve(page);
  await page.getByText('العروض ووضع التجربة',{exact:true}).click();await field(page,'اسم العرض').fill('مسودة');await button(page,'العودة إلى شاشة البيع').click();await button(page,'لا').click();await expect(page.getByRole('dialog')).toHaveCount(0);
});
