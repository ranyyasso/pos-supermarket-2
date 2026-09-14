import {test,expect,type Page} from '@playwright/test';
import {mkdirSync} from 'node:fs';
const errors=new WeakMap<Page,string[]>();
test('wholesale selection and help remain available after reload',async({page})=>{
 await page.getByRole('button',{name:'جملة',exact:true}).click();await page.reload();await expect(page.getByRole('button',{name:'جملة',exact:true})).toHaveAttribute('aria-pressed','true');await page.getByRole('button',{name:'المساعدة',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('2468');await expect(page.getByRole('dialog')).toContainText('محاكاة');
});
test('completed receipt survives reload and can be reprinted without another sale',async({page})=>{
 await cashSale(page);await receiptDone(page);await page.reload();await history(page);await expect(page.locator('.transaction-card')).toHaveCount(1);await page.getByRole('button',{name:'إعادة الإيصال',exact:true}).click();await page.getByRole('button',{name:'معاينة وطباعة الإيصال',exact:true}).click();await expect(page.frameLocator('iframe').getByRole('main')).toContainText('٤٨٬٤٠٠');await page.getByRole('button',{name:'رجوع من معاينة الطباعة',exact:true}).click();await page.getByRole('button',{name:'بدء طلب جديد',exact:true}).click();await history(page);await expect(page.locator('.transaction-card')).toHaveCount(1);
});
test('audit search filters actual events',async({page})=>{
 await page.getByRole('button',{name:'تعليق',exact:true}).click();await page.getByRole('button',{name:'تعليق البيع',exact:true}).click();await history(page);await page.getByRole('button',{name:'سجل العمليات',exact:true}).click();await page.getByRole('textbox',{name:'بحث في سجل العمليات',exact:true}).fill('غير موجود');await expect(dialog(page)).toContainText('لا توجد عمليات مطابقة');await page.getByRole('textbox',{name:'بحث في سجل العمليات',exact:true}).fill('تعليق');await expect(page.locator('.audit-list strong')).toHaveText('تعليق بيع');
});
test('print button requests printing without asserting physical success',async({page})=>{
 await page.addInitScript(()=>{window.print=()=>{document.documentElement.dataset.printRequested='yes';};});await page.reload();await printer(page);await page.getByRole('button',{name:'معاينة وطباعة اختبار',exact:true}).click();const frame=page.frameLocator('iframe');await frame.getByRole('button',{name:'طباعة / حفظ PDF',exact:true}).click();await expect(frame.locator('html')).toHaveAttribute('data-print-requested','yes');await expect(frame.getByRole('status')).toContainText('لا يؤكد خروج الورق');
});
test('cash receipt print request demonstrates the printer-connected drawer pulse',async({page})=>{
 await page.addInitScript(()=>{window.print=()=>{};});await page.reload();await printer(page);await page.getByRole('textbox',{name:'اسم الطابعة في Windows',exact:true}).fill('EPSON Demo');await page.getByRole('textbox',{name:'هاتف المتجر',exact:true}).fill('07701234567');await page.getByRole('textbox',{name:'الرقم الضريبي',exact:true}).fill('TAX-42');await page.getByRole('textbox',{name:'بادئة رقم الإيصال',exact:true}).fill('POS-');await page.getByRole('button',{name:'حفظ الإعدادات',exact:true}).click();await page.getByRole('button',{name:'العودة إلى شاشة البيع',exact:true}).click();await page.getByRole('button',{name:'إغلاق',exact:true}).click();await cashSale(page);await expect(dialog(page)).not.toContainText('نبضة درج النقد');await page.getByRole('button',{name:'معاينة وطباعة الإيصال',exact:true}).click();const frame=page.frameLocator('iframe');await expect(frame.getByRole('main')).toContainText('الهاتف: 07701234567');await expect(frame.getByRole('main')).toContainText('الرقم الضريبي: TAX-42');await expect(frame.getByRole('heading',{name:/إيصال #POS-/})).toBeVisible();await frame.getByRole('button',{name:'طباعة / حفظ PDF',exact:true}).click();await page.getByRole('button',{name:'رجوع من معاينة الطباعة',exact:true}).click();await expect(dialog(page)).toContainText('تمت محاكاة نبضة درج النقد');
});
test('daily reports summarize saved sales and export CSV',async({page})=>{
 await cashSale(page);await receiptDone(page);await page.getByRole('button',{name:'الإعدادات والإدارة',exact:true}).click();await page.getByRole('button',{name:'تقارير اليوم',exact:true}).click();await expect(page.getByRole('heading',{name:'تقارير اليوم',exact:true})).toBeVisible();await expect(page.locator('.report-summary')).toContainText('٤٨٬٤٠٠');await expect(page.locator('.report-summary')).toContainText('١');await expect(page.locator('.report-columns')).toContainText('بسكويت حليب');const download=page.waitForEvent('download');await page.getByRole('button',{name:'تصدير CSV',exact:true}).click();const file=await download;expect(file.suggestedFilename()).toMatch(/^mizan-report-\d{4}-\d{2}-\d{2}\.csv$/);
});
test.beforeEach(async({page})=>{
 errors.set(page,[]);page.on('pageerror',e=>errors.get(page)!.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.get(page)!.push(m.text());});
 await page.goto('/');
});
test.afterEach(async({page})=>{expect(errors.get(page),'No browser runtime or console errors').toEqual([]);});
const dialog=(page:Page)=>page.getByRole('dialog');
const total=(page:Page)=>page.getByTestId('grand-total');
async function manager(page:Page){await page.getByRole('textbox',{name:'رمز المدير',exact:true}).fill('2468');await page.getByRole('button',{name:'اعتماد العملية',exact:true}).click();}
async function close(page:Page){await page.getByRole('button',{name:'إغلاق',exact:true}).click();}
async function customer(page:Page){await page.getByRole('button',{name:/إضافة عميل|أحمد علي|نور حسين/}).first().click();}
async function cashSale(page:Page){await page.getByRole('button',{name:/^الدفع/}).click();await page.getByRole('button',{name:'تأكيد الدفع النقدي',exact:true}).click();}
async function receiptDone(page:Page){const drawer=page.getByRole('button',{name:'تأكيد الإغلاق',exact:true});if(await drawer.isVisible())await drawer.click();await page.getByRole('button',{name:'بدون إيصال',exact:true}).click();await page.getByRole('button',{name:'تأكيد بدون إيصال',exact:true}).click();await page.getByRole('button',{name:'بدء طلب جديد',exact:true}).click();}
async function history(page:Page){await page.getByRole('button',{name:'المعاملات',exact:true}).click();}
async function printer(page:Page){await page.getByRole('button',{name:'الإعدادات والإدارة',exact:true}).click();await page.getByRole('button',{name:'إعدادات الطابعة الحرارية',exact:true}).click();}

test('all categories, global product search, empty Enter and Arabic barcode',async({page})=>{
 for(const name of ['الوجبات الخفيفة','الإفطار','الألبان','الحلويات','العصائر والمياه','العناية بالطفل','القرطاسية','العناية اليومية']){
  await page.locator('.category-list button').filter({hasText:name}).click();await expect(page.locator('.product-tile').first()).toBeVisible();
 }
 const activeCategory=page.locator('.category.active');await expect(activeCategory).toHaveCSS('justify-content','center');await expect(activeCategory.locator(':scope > svg')).toHaveCount(0);
 const search=page.getByRole('textbox',{name:'البحث عن منتج أو باركود',exact:true});
 const before=await total(page).innerText();await search.press('Enter');await expect(total(page)).toHaveText(before);
 await search.fill('بسكويت حليب');await expect(page.getByRole('button',{name:'إضافة بسكويت حليب · علبة',exact:true})).toBeVisible();
 await search.fill('غير موجود');await expect(page.locator('.product-tile')).toHaveCount(0);
 await search.fill('١٠٠٠٠١');await search.press('Enter');await expect(total(page)).not.toHaveText(before);
});
test('keyboard-wedge scan adds once without activating the focused button',async({page})=>{
 const before=await total(page).innerText();await page.getByRole('heading',{name:'المفضلة',exact:true}).click();
 await page.keyboard.type('100001',{delay:10});await page.keyboard.press('Enter');
 await expect(total(page)).not.toHaveText(before);await expect(page.getByRole('complementary')).toContainText('٥٧٬٢٠٠');await expect(page.locator('.toast')).toHaveCount(0);
});
test('quantity notes, validation, cap and remove confirmation',async({page})=>{
 await page.getByRole('complementary').getByRole('button',{name:'1 بسكويت حليب · علبة',exact:true}).click();
 await page.getByRole('button',{name:'تغيير كمية بسكويت حليب · علبة',exact:true}).click();
 await page.getByRole('textbox',{name:'الكمية',exact:true}).fill('1000');await page.getByRole('button',{name:'حفظ التعديل',exact:true}).click();await expect(page.getByRole('alert')).toContainText('٩٩٩');
 await page.getByRole('textbox',{name:'الكمية',exact:true}).fill('٩٩٩');await page.getByRole('textbox',{name:'ملاحظة على الصنف',exact:true}).fill('');await page.getByRole('button',{name:'حفظ التعديل',exact:true}).click();
 const capped=await total(page).innerText();await page.getByRole('button',{name:'إضافة بسكويت حليب · علبة',exact:true}).click();await expect(total(page)).toHaveText(capped);
 await page.getByRole('button',{name:'تغيير كمية بسكويت حليب · علبة',exact:true}).click();await page.getByRole('textbox',{name:'الكمية',exact:true}).fill('2');await page.getByRole('textbox',{name:'ملاحظة على الصنف',exact:true}).fill('بدون صلصة');await page.getByRole('button',{name:'حفظ التعديل',exact:true}).click();
 await page.getByRole('button',{name:'تغيير كمية بسكويت حليب · علبة',exact:true}).click();await page.getByRole('textbox',{name:'الكمية',exact:true}).fill('0');await page.getByRole('button',{name:'تأكيد حذف الصنف',exact:true}).click();await expect(page.getByRole('complementary')).not.toContainText('بسكويت حليب · علبة');
});
test('price checker known name, unknown barcode, reset and no basket mutation',async({page})=>{
 const before=await total(page).innerText();await page.getByRole('button',{name:'التحقق من السعر',exact:true}).click();const input=page.getByRole('textbox',{name:'اسم الصنف أو الباركود',exact:true});await input.fill('999999');await expect(dialog(page)).toContainText('غير معروف');await input.fill('بسكويت حليب');await dialog(page).getByRole('button',{name:/بسكويت حليب · علبة/}).click();await expect(dialog(page)).toContainText('٨٬٠٠٠');await page.getByRole('button',{name:'فحص صنف آخر',exact:true}).click();await expect(input).toHaveValue('');await close(page);await expect(total(page)).toHaveText(before);
});
test('item and basket discounts, invalid values, approval and removal',async({page})=>{
 const before=await total(page).innerText();await page.getByRole('button',{name:'خصم',exact:true}).click();await page.getByRole('textbox',{name:'قيمة الخصم',exact:true}).fill('101');await page.getByRole('button',{name:'تطبيق الخصم',exact:true}).click();await expect(page.getByRole('alert')).toBeVisible();
 await page.getByRole('combobox',{name:'نطاق الخصم',exact:true}).selectOption({label:'بسكويت حليب · علبة'});await page.getByRole('textbox',{name:'قيمة الخصم',exact:true}).fill('5');await page.getByRole('button',{name:'تطبيق الخصم',exact:true}).click();await expect(total(page)).not.toHaveText(before);
 await page.getByRole('button',{name:'خصم',exact:true}).click();await page.getByRole('combobox',{name:'نطاق الخصم',exact:true}).selectOption('basket');await page.getByRole('textbox',{name:'قيمة الخصم',exact:true}).fill('20');await page.getByRole('button',{name:'تطبيق الخصم',exact:true}).click();await manager(page);
 await page.getByRole('button',{name:'خصم',exact:true}).click();await page.getByRole('button',{name:'إزالة الخصم',exact:true}).click();await expect(total(page)).not.toHaveText(before);
});
test('coupons reject expired, unknown, threshold and stacking',async({page})=>{
 await page.getByRole('button',{name:/العروض والكوبونات/}).click();const code=page.getByRole('textbox',{name:'رمز الكوبون',exact:true});
 for(const [value,message] of [['EXPIRED','انتهت'],['BAD','غير صالح'],['DESSERT5','٢٠٬٠٠٠'],['JUICE2','تلقائياً']]){await code.fill(value);await page.getByRole('button',{name:'تطبيق الكوبون',exact:true}).click();await expect(page.getByRole('alert')).toContainText(message);}
 await code.fill('WELCOME10');await page.getByRole('button',{name:'تطبيق الكوبون',exact:true}).click();await expect(total(page)).toContainText('٤٣٬٥٦٠');
 await page.getByRole('button',{name:'خصم',exact:true}).click();await page.getByRole('textbox',{name:'قيمة الخصم',exact:true}).fill('5');await page.getByRole('button',{name:'تطبيق الخصم',exact:true}).click();await expect(page.getByRole('alert')).toContainText('الكوبون');await close(page);
 await page.getByRole('button',{name:/العروض والكوبونات/}).click();await page.getByRole('button',{name:'إزالة WELCOME10',exact:true}).click();await expect(total(page)).toContainText('٤٨٬٤٠٠');
});
test('juice pair promo and qualifying dessert coupon update live',async({page})=>{
 await page.getByRole('button',{name:'إضافة عصير تفاح · ٢٠٠ مل',exact:true}).click();await expect(total(page)).toContainText('٤٨٬٤٠٠');
 await page.getByRole('button',{name:'إضافة كيك فانيلا · عبوة',exact:true}).click();await page.getByRole('button',{name:/العروض والكوبونات/}).click();await page.getByRole('textbox',{name:'رمز الكوبون',exact:true}).fill('DESSERT5');await page.getByRole('button',{name:'تطبيق الكوبون',exact:true}).click();await expect(total(page)).toContainText('٥٠٬٦٠٠');
});
test('customer search, reward cancel, manager point change and detach',async({page})=>{
 await customer(page);await page.getByRole('textbox',{name:'بحث بالاسم أو الهاتف أو بطاقة الولاء',exact:true}).fill('200001');await dialog(page).getByRole('button',{name:/أحمد علي/}).click();await customer(page);
 await page.getByRole('button',{name:'استبدال ٥٠٠ نقطة · خصم ٥٬٠٠٠ د.ع',exact:true}).click();await page.getByRole('button',{name:'تأكيد المتابعة',exact:true}).click();await close(page);await expect(total(page)).toContainText('٤٢٬٩٠٠');await customer(page);await page.getByRole('button',{name:'إلغاء المكافأة',exact:true}).click();
 await page.getByRole('textbox',{name:'رصيد النقاط الجديد',exact:true}).fill('700');await page.getByRole('button',{name:'تعديل النقاط',exact:true}).click();await manager(page);await expect(dialog(page)).toContainText('700');await page.getByRole('button',{name:'فصل',exact:true}).click();await close(page);await expect(page.getByRole('button',{name:/إضافة عميل/})).toBeVisible();
});
test('new customer validates phone and prevents duplicates',async({page})=>{
 await customer(page);await page.getByRole('button',{name:'عميل جديد',exact:true}).click();await page.getByRole('textbox',{name:'اسم العميل',exact:true}).fill('عميل اختبار');const phone=page.getByRole('textbox',{name:'رقم الهاتف',exact:true});await phone.fill('123');await page.getByRole('button',{name:'حفظ وإرفاق العميل',exact:true}).click();await expect(page.getByRole('alert')).toBeVisible();await phone.fill('+9647701234567');await page.getByRole('button',{name:'حفظ وإرفاق العميل',exact:true}).click();await expect(page.getByRole('alert')).toContainText('مسجل');await phone.fill('٠٧٧١٢٣٤٥٦٧٨');await page.getByRole('button',{name:'حفظ وإرفاق العميل',exact:true}).click();await expect(page.getByRole('complementary')).toContainText('عميل اختبار');
});
test('kids supplies add without age verification',async({page})=>{
 await page.getByRole('button',{name:'إضافة مناديل أطفال',exact:true}).click();await expect(dialog(page)).toHaveCount(0);await expect(total(page)).toContainText('٥٣٬٩٠٠');
 await page.getByRole('button',{name:'إضافة أقلام تلوين',exact:true}).click();await expect(dialog(page)).toHaveCount(0);await expect(total(page)).toContainText('٦١٬٦٠٠');
});
test('cash rejects bad tender and accepts exact payment with no receipt',async({page})=>{
 await page.getByRole('button',{name:/^الدفع/}).click();const input=page.getByRole('textbox',{name:'المبلغ المستلم نقداً',exact:true});
 for(const bad of ['-1','NaN','10']){await input.fill(bad);await page.getByRole('button',{name:'تأكيد الدفع النقدي',exact:true}).click();await expect(page.getByRole('alert')).toBeVisible();}
 await input.fill('٤٨٤٠٠');await page.getByRole('button',{name:'تأكيد الدفع النقدي',exact:true}).click();await receiptDone(page);await expect(page.getByRole('heading',{name:'السلة فارغة',exact:true})).toBeVisible();
});
test('card decline, timeout and cancel remain retryable; contactless succeeds',async({page})=>{
 await page.getByRole('button',{name:/^الدفع/}).click();await page.getByRole('button',{name:'بطاقة مصرفية',exact:true}).click();
 for(const [action,message] of [['رفض','تم رفض'],['انتهاء المهلة','انتهت مهلة'],['إلغاء المحاولة','تم إلغاء']]){await page.getByRole('button',{name:action,exact:true}).click();await expect(dialog(page)).toContainText(message);}
 await page.getByRole('button',{name:'دفع لاتلامسي',exact:true}).click();await page.getByRole('button',{name:'محاكاة موافقة الدفع',exact:true}).click();await expect(page.getByRole('heading',{name:'إيصال البيع',exact:true})).toBeVisible();await receiptDone(page);
});
test('split payment cannot close and supports manager reversal after reload',async({page})=>{
 const before=await total(page).innerText();await page.getByRole('button',{name:'تقسيم الدفع',exact:true}).click();await page.getByRole('textbox',{name:'المبلغ المستلم نقداً',exact:true}).fill('20000');await page.getByRole('button',{name:'تسجيل الدفعة النقدية',exact:true}).click();await close(page);await expect(page.getByRole('alert')).toContainText('المتبقي');await page.reload();await expect(dialog(page)).toContainText('المدفوع');await page.getByRole('button',{name:/إلغاء الدفع وعكس المبالغ/}).click();await manager(page);await expect(dialog(page)).toHaveCount(0);await expect(total(page)).toHaveText(before);
});
for(const email of [true,false])test(`${email?'Email':'SMS'} receipt rejects invalid destination and simulates send`,async({page})=>{
 await cashSale(page);await page.getByRole('button',{name:email?'بريد إلكتروني':'رسالة SMS',exact:true}).click();const input=page.getByRole('textbox',{name:email?'البريد الإلكتروني':'رقم الهاتف',exact:true});await input.fill('bad');await page.getByRole('button',{name:'محاكاة إرسال الإيصال',exact:true}).click();await expect(page.getByRole('alert')).toBeVisible();await input.fill(email?'demo@example.com':'07701234567');await page.getByRole('button',{name:'محاكاة إرسال الإيصال',exact:true}).click();await expect(dialog(page)).toContainText('محاكاة إرسال');
});
test('park and recall preserves note and parks a nonempty replacement basket',async({page})=>{
 const before=await total(page).innerText();await page.getByRole('button',{name:'تعليق',exact:true}).click();await page.getByRole('textbox',{name:'اسم أو ملاحظة للطلب',exact:true}).fill('طاولة اختبار');await page.getByRole('button',{name:'تعليق البيع',exact:true}).click();await page.getByRole('button',{name:'إضافة بسكويت حليب · علبة',exact:true}).click();await page.getByRole('button',{name:/^استدعاء/}).click();await page.getByRole('textbox',{name:'بحث بالرقم أو العميل أو الملاحظة',exact:true}).fill('طاولة');await dialog(page).getByRole('button',{name:/طاولة اختبار/}).click();await page.getByRole('button',{name:'تأكيد المتابعة',exact:true}).click();await expect(total(page)).toHaveText(before);await page.getByRole('button',{name:/^استدعاء/}).click();await expect(dialog(page)).toContainText('٨٬٨٠٠');
});
test('sale screen omits annotated visual clutter and formats prices compactly',async({page})=>{
 await expect(page.getByRole('button',{name:'إلغاء البيع',exact:true})).toHaveCount(0);await expect(page.locator('.basket-table-heading')).toHaveCount(0);await expect(page.locator('.rail-heading')).toHaveCount(0);await expect(page.locator('.category-index')).toHaveCount(0);await expect(page.locator('.totals')).toHaveCount(0);await expect(page.locator('.line-main').first().locator('strong')).not.toContainText('د.ع');await expect(page.locator('.line-name').first()).not.toContainText('وحدة');await expect(page.getByTestId('grand-total').locator('small')).toHaveText('د.ع.');await expect(page.getByTestId('grand-total').locator('small')).toHaveCSS('color','rgb(127, 137, 150)');
});
test('partial refund prevents repeat quantities, prints and disables void',async({page})=>{
 await cashSale(page);await receiptDone(page);await history(page);await dialog(page).getByRole('button',{name:'استرجاع',exact:true}).click();await page.locator('.refund-line input').first().fill('1');await page.getByRole('textbox',{name:'سبب الاسترجاع',exact:true}).fill('إرجاع تجريبي');await page.getByRole('checkbox',{name:/تحويل كامل/}).check();await page.getByRole('button',{name:'اعتماد الاسترجاع',exact:true}).click();await manager(page);expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('mizan-inventory-v1')||'{}').movements.some((m:any)=>m.type==='refund'&&m.productId==='p1'&&m.delta===1))).toBe(true);await expect(dialog(page)).toContainText('٨٬٨٠٠');await page.getByRole('button',{name:'طباعة الإيصال',exact:true}).click();await expect(page.frameLocator('iframe').getByRole('main')).toContainText('إيصال استرجاع');await page.getByRole('button',{name:'رجوع من معاينة الطباعة',exact:true}).click();await page.getByRole('button',{name:'المبيعات',exact:true}).click();await expect(page.getByRole('button',{name:'إلغاء المعاملة',exact:true})).toBeDisabled();await dialog(page).getByRole('button',{name:'استرجاع',exact:true}).click();await expect(page.locator('.refund-line').first()).toContainText('المتاح للاسترجاع: 0');
});
test('void creates one reversal and prevents another void',async({page})=>{
 await cashSale(page);await receiptDone(page);await history(page);await page.getByRole('button',{name:'إلغاء المعاملة',exact:true}).click();await page.getByRole('textbox',{name:'السبب',exact:true}).fill('اختبار إلغاء');await page.getByRole('button',{name:'تأكيد المتابعة',exact:true}).click();await manager(page);expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('mizan-inventory-v1')||'{}').movements.some((m:any)=>m.type==='void'&&m.delta>0))).toBe(true);await expect(dialog(page)).toContainText('إلغاء: اختبار إلغاء');await page.getByRole('button',{name:'المبيعات',exact:true}).click();await expect(page.getByRole('button',{name:'إلغاء المعاملة',exact:true})).toBeDisabled();await expect(dialog(page).getByRole('button',{name:'استرجاع',exact:true})).toBeDisabled();
});
test('drawer manager lock, unlock, open, close and audit trail',async({page})=>{
 await page.clock.install();await page.getByRole('button',{name:'درج النقد',exact:true}).click();await page.getByRole('textbox',{name:'سبب فتح الدرج',exact:true}).fill('اختبار الدرج');await page.getByRole('button',{name:'طلب فتح الدرج',exact:true}).click();
 for(let n=0;n<3;n++){await page.getByRole('textbox',{name:'رمز المدير',exact:true}).fill('0000');await page.getByRole('button',{name:'اعتماد العملية',exact:true}).click();}
 await expect(dialog(page)).toContainText('المحاولة التالية');await page.clock.fastForward(31000);await manager(page);await expect(dialog(page)).toContainText('درج النقد مفتوح');await page.getByRole('button',{name:'تأكيد إغلاق الدرج',exact:true}).click();await history(page);await page.getByRole('button',{name:'سجل العمليات',exact:true}).click();await expect(dialog(page)).toContainText('اختبار الدرج');
});
test('100 percent discount completes a free sale and allows return tracking',async({page})=>{
 await page.getByRole('button',{name:'خصم',exact:true}).click();await page.getByRole('textbox',{name:'قيمة الخصم',exact:true}).fill('100');await page.getByRole('button',{name:'تطبيق الخصم',exact:true}).click();await manager(page);await page.getByRole('button',{name:/^الدفع/}).click();await receiptDone(page);await history(page);await dialog(page).getByRole('button',{name:'استرجاع',exact:true}).click();await page.locator('.refund-line input').first().fill('1');await page.getByRole('textbox',{name:'سبب الاسترجاع',exact:true}).fill('استرجاع مجاني');await expect(page.getByRole('button',{name:'اعتماد الاسترجاع',exact:true})).toBeEnabled();await page.getByRole('button',{name:'اعتماد الاسترجاع',exact:true}).click();await manager(page);await expect(dialog(page)).toContainText('استرجاع مجاني');
});
test('damaged saved state recovers with a backup instead of a blank screen',async({page})=>{
 await page.evaluate(()=>localStorage.setItem('mizan-pos-v1','{"broken":true}'));await page.reload();await expect(page.getByRole('alert')).toContainText('تعذر تحميل');await expect(page.locator('.product-tile')).toHaveCount(15);expect(await page.evaluate(()=>localStorage.getItem('mizan-pos-recovery-v1'))).toBe('{"broken":true}');
});
test('blocked storage shows a persistent warning and still allows a demo sale',async({page})=>{
 await page.addInitScript(()=>{Storage.prototype.setItem=function(){throw new Error('Storage blocked for test');};});await page.reload();await expect(page.getByRole('alert')).toContainText('تعذر حفظ');await page.getByRole('button',{name:'إضافة بسكويت حليب · علبة',exact:true}).click();await expect(total(page)).toContainText('٥٧٬٢٠٠');
});
test('demo reset is confirmed and manager-approved',async({page})=>{
 await page.getByRole('button',{name:'إضافة بسكويت حليب · علبة',exact:true}).click();await page.getByRole('button',{name:'إعادة بيانات التجربة',exact:true}).click();await page.getByRole('button',{name:'تأكيد المتابعة',exact:true}).click();await manager(page);await expect(total(page)).toContainText('٤٨٬٤٠٠');
});
test('thermal previews escape editable text, print only the receipt and save PDF',async({page})=>{
 await printer(page);await page.getByRole('textbox',{name:'اسم المتجر',exact:true}).fill('مطعم اختبار <b>نص</b>');await page.getByRole('button',{name:'حفظ الإعدادات',exact:true}).click();
 mkdirSync('qa',{recursive:true});
 for(const width of ['58','80']){
  await page.getByRole('combobox',{name:'عرض الورق',exact:true}).selectOption(width);await page.getByRole('button',{name:'معاينة وطباعة اختبار',exact:true}).click();const frame=page.frameLocator('iframe');await expect(frame.getByRole('heading',{name:'مطعم اختبار <b>نص</b>',exact:true})).toBeVisible();
  const html=await page.locator('iframe').getAttribute('srcdoc');const printPage=await page.context().newPage();await printPage.setContent(html!);await printPage.evaluate(()=>document.fonts.ready);await printPage.emulateMedia({media:'print'});await expect(printPage.locator('.print-controls')).toBeHidden();expect(await printPage.locator('.thermal-paper').evaluate((e,width)=>Math.abs(e.getBoundingClientRect().width-width*96/25.4),Number(width))).toBeLessThan(1);
  await printPage.pdf({path:`qa/thermal-test-${width}.pdf`,width:`${width}mm`,height:'220mm',printBackground:true});await printPage.close();await page.getByRole('button',{name:'رجوع من معاينة الطباعة',exact:true}).click();
 }
});
test('desktop layouts have no overflow, visible Pay and legible dialog controls',async({page})=>{
 mkdirSync('qa',{recursive:true});
 for(const viewport of [{width:1280,height:720},{width:1366,height:768},{width:1920,height:1080}]){
  await page.setViewportSize(viewport);await page.screenshot({path:`qa/client-demo-${viewport.width}.png`});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await expect(page.getByRole('button',{name:/^الدفع/})).toBeInViewport();
 }
 await printer(page);await expect(page.getByRole('button',{name:'حفظ الإعدادات',exact:true})).toBeInViewport();await page.screenshot({path:'qa/client-demo-printer.png'});
});
