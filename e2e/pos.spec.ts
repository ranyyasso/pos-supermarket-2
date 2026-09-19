import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{await page.goto('/');});

test('thermal settings persist and show a receipt-only preview',async({page})=>{
 await page.getByRole('button',{name:'الإعدادات',exact:true}).click();
 await page.getByRole('combobox',{name:'عرض الورق',exact:true}).selectOption('58');

 await page.reload();
 await page.getByRole('button',{name:'الإعدادات',exact:true}).click();
 await expect(page.getByRole('combobox',{name:'عرض الورق',exact:true})).toHaveValue('58');
 await page.getByRole('tab',{name:'الإيصال',exact:true}).click();await page.getByRole('button',{name:'معاينة اختبار',exact:true}).click();
 const frame=page.frameLocator('iframe[title="معاينة الإيصال الحراري"]');
 await expect(frame.getByRole('heading',{name:'اختبار الطابعة الحرارية',exact:true})).toBeVisible();
 await expect(frame.getByRole('status')).toHaveText('معاينة فقط. لم يُرسل الإيصال إلى الطابعة.');
 await expect(frame.locator('html')).toHaveAttribute('dir','rtl');
 await page.getByRole('button',{name:/^العودة إلى (الإعدادات|الأصناف|الإيصال|المعاملات)$/}).click();
 await expect(page.getByRole('tab',{name:'الإيصال',exact:true})).toBeVisible();
});
test('thermal printing can be disabled in settings',async({page})=>{
 await page.getByRole('button',{name:'الإعدادات',exact:true}).click();
 const enabled=page.getByRole('checkbox',{name:'تفعيل طباعة الإيصالات الحرارية',exact:true});
 await enabled.uncheck();
 await page.getByRole('tab',{name:'الإيصال',exact:true}).click();await expect(page.getByRole('button',{name:'معاينة اختبار',exact:true})).toBeDisabled();

 await page.reload();
 await page.getByRole('button',{name:'الإعدادات',exact:true}).click();
 await expect(page.getByRole('checkbox',{name:'تفعيل طباعة الإيصالات الحرارية',exact:true})).not.toBeChecked();
});
test('unknown barcode can be registered with manager approval and scanned after reload',async({page})=>{
 const search=page.getByRole('textbox',{name:'البحث عن منتج أو باركود',exact:true});
 await search.fill('999999');await search.press('Enter');
 await expect(page.getByRole('heading',{name:'تسجيل صنف جديد',exact:true})).toBeVisible();
 await expect(page.getByRole('textbox',{name:'الباركود',exact:true})).toHaveValue('999999');
 await page.getByRole('textbox',{name:'اسم الصنف',exact:true}).fill('منتج اختبار جديد');
 await page.getByRole('textbox',{name:'سعر البيع',exact:true}).fill('2500');
 await page.getByRole('textbox',{name:'التكلفة',exact:true}).fill('1800');
 await page.getByText('تفاصيل إضافية',{exact:true}).click();
 await page.getByRole('textbox',{name:'المخزون الابتدائي',exact:true}).fill('12');
 await page.getByRole('textbox',{name:'المورّد',exact:true}).fill('مورد الاختبار');
 await page.getByRole('button',{name:'حفظ وإضافة للسلة',exact:true}).click();
 await page.getByRole('textbox',{name:'رمز المدير',exact:true}).fill('2468');
 await page.getByRole('button',{name:'اعتماد العملية',exact:true}).click();
 await expect(page.getByRole('button',{name:'إضافة منتج اختبار جديد',exact:true})).toBeVisible();
 await page.reload();
 await search.fill('999999');await search.press('Enter');
 await expect(page.getByRole('button',{name:/منتج اختبار جديد/}).last()).toBeVisible();
});

test('new item registration rejects an existing barcode',async({page})=>{
 await page.getByRole('button',{name:'الإعدادات والإدارة',exact:true}).click();
 await page.getByRole('button',{name:'تسجيل صنف جديد',exact:true}).click();
 await page.getByRole('textbox',{name:'الباركود',exact:true}).fill('100001');
 await page.getByRole('textbox',{name:'اسم الصنف',exact:true}).fill('نسخة مكررة');
 await page.getByRole('textbox',{name:'سعر البيع',exact:true}).fill('1000');
 await page.getByRole('button',{name:'حفظ الصنف',exact:true}).click();
 await expect(page.locator('.form-error')).toContainText('الباركود مسجل مسبقاً');
});
test('manager can edit, disable, enable and delete a registered item',async({page})=>{
 await page.getByRole('button',{name:'الإعدادات والإدارة',exact:true}).click();
 await page.getByRole('button',{name:'تسجيل صنف جديد',exact:true}).click();
 await page.getByRole('textbox',{name:'الباركود',exact:true}).fill('888888');await page.getByRole('textbox',{name:'اسم الصنف',exact:true}).fill('صنف للإدارة');await page.getByRole('textbox',{name:'سعر البيع',exact:true}).fill('3000');
 await page.getByRole('button',{name:'حفظ الصنف',exact:true}).click();await page.getByRole('textbox',{name:'رمز المدير',exact:true}).fill('2468');await page.getByRole('button',{name:'اعتماد العملية',exact:true}).click();
 await expect(page.getByRole('heading',{name:'إدارة الأصناف',exact:true})).toBeVisible();
 let row=page.locator('.managed-product').filter({hasText:'صنف للإدارة'});await row.getByRole('button',{name:'تعديل',exact:true}).click();await page.getByRole('textbox',{name:'اسم الصنف',exact:true}).fill('صنف معدل');await page.getByRole('button',{name:'حفظ التعديلات',exact:true}).click();await page.getByRole('textbox',{name:'رمز المدير',exact:true}).fill('2468');await page.getByRole('button',{name:'اعتماد العملية',exact:true}).click();
 await expect(page.getByRole('heading',{name:'إدارة الأصناف',exact:true})).toBeVisible();row=page.locator('.managed-product').filter({hasText:'صنف معدل'});await row.getByRole('button',{name:'إيقاف',exact:true}).click();await page.getByRole('textbox',{name:'رمز المدير',exact:true}).fill('2468');await page.getByRole('button',{name:'اعتماد العملية',exact:true}).click();await expect(row).toContainText('موقوف');
 await row.getByRole('button',{name:'تفعيل',exact:true}).click();await page.getByRole('textbox',{name:'رمز المدير',exact:true}).fill('2468');await page.getByRole('button',{name:'اعتماد العملية',exact:true}).click();await expect(row.getByText('موقوف',{exact:true})).toHaveCount(0);
 await row.getByRole('button',{name:'حذف',exact:true}).click();await page.getByRole('textbox',{name:'رمز المدير',exact:true}).fill('2468');await page.getByRole('button',{name:'اعتماد العملية',exact:true}).click();await expect(page.locator('.managed-product').filter({hasText:'صنف معدل'})).toHaveCount(0);
});
test('inventory receiving and completed sales create stock movements',async({page})=>{
 await page.getByRole('button',{name:'الإعدادات والإدارة',exact:true}).click();
 await page.getByRole('button',{name:'المخزون والاستلام',exact:true}).click();
 await page.getByRole('textbox',{name:'باركود',exact:true}).fill('100001');await page.getByRole('textbox',{name:'باركود',exact:true}).press('Enter');await page.getByRole('textbox',{name:'الكمية المستلمة',exact:true}).fill('5');await page.getByRole('button',{name:'تأكيد الاستلام',exact:true}).click();await page.getByRole('textbox',{name:'رمز المدير',exact:true}).fill('2468');await page.getByRole('button',{name:'اعتماد العملية',exact:true}).click();
 let movements=await page.evaluate(()=>JSON.parse(localStorage.getItem('mizan-inventory-v1')||'{}').movements);expect(movements[0]).toMatchObject({productId:'p1',delta:5,balance:29,type:'receive'});
 await page.getByRole('button',{name:'العودة إلى شاشة البيع',exact:true}).click();await page.getByRole('button',{name:/^الدفع/}).click();await page.getByRole('textbox',{name:'المبلغ المستلم',exact:true}).fill('50000');await page.getByRole('button',{name:'دفع',exact:true}).click();
 movements=await page.evaluate(()=>JSON.parse(localStorage.getItem('mizan-inventory-v1')||'{}').movements);expect(movements.find((m:any)=>m.type==='sale'&&m.productId==='p1')).toMatchObject({delta:-1,balance:28});
});
test('scale barcode applies encoded price and weight, and product labels are printable',async({page})=>{
 await page.getByRole('button',{name:'الإعدادات والإدارة',exact:true}).click();
 await page.getByRole('button',{name:'تسجيل صنف جديد',exact:true}).click();
 await page.getByRole('textbox',{name:'الباركود',exact:true}).fill('777777');await page.getByText('تفاصيل إضافية',{exact:true}).click();await page.getByRole('combobox',{name:'الوحدة',exact:true}).selectOption('kg');await page.getByRole('textbox',{name:'رمز الميزان (5 أرقام)',exact:true}).fill('12345');await page.getByRole('textbox',{name:'اسم الصنف',exact:true}).fill('تفاح بالوزن');await page.getByRole('combobox',{name:'الوحدة',exact:true}).selectOption('kg');await page.getByRole('textbox',{name:'سعر البيع',exact:true}).fill('10000');await page.getByRole('textbox',{name:'المخزون الابتدائي',exact:true}).fill('10');await page.getByRole('button',{name:'حفظ الصنف',exact:true}).click();await page.getByRole('textbox',{name:'رمز المدير',exact:true}).fill('2468');await page.getByRole('button',{name:'اعتماد العملية',exact:true}).click();
 await page.getByRole('button',{name:'العودة إلى شاشة البيع',exact:true}).click();const search=page.getByRole('textbox',{name:'البحث عن منتج أو باركود',exact:true});await search.fill('2012345012509');await search.press('Enter');await expect(page.locator('.basket-line').filter({hasText:'تفاح بالوزن'})).toContainText('وزن 0.125 كغ');await expect(page.locator('.basket-line').filter({hasText:'تفاح بالوزن'})).toContainText('1,250');
 await page.getByRole('button',{name:'الإعدادات والإدارة',exact:true}).click();await page.getByRole('button',{name:'إدارة الأصناف',exact:true}).click();const row=page.locator('.managed-product').filter({hasText:'تفاح بالوزن'});await row.getByRole('button',{name:'ملصق',exact:true}).click();const frame=page.frameLocator('iframe');await expect(frame.locator('svg')).toBeVisible();await expect(frame.getByText('777777',{exact:true})).toBeVisible();
});
test('RTL layout keeps all tiles and checkout within the viewport',async({page})=>{
 for(const viewport of [{width:1280,height:720},{width:1366,height:768},{width:1920,height:1080}]){
  await page.setViewportSize(viewport);
  await expect(page.locator('html')).toHaveAttribute('dir','rtl');
  await expect(page.locator('.product-tile')).toHaveCount(15);
  const result=await page.evaluate(()=>{const pay=document.querySelector('.checkout>.pay')!.getBoundingClientRect();return document.documentElement.scrollWidth===innerWidth&&pay.bottom<=innerHeight});
  expect(result).toBe(true);
 }
});
test('quantity editor updates the basket without a visible undo control',async({page})=>{
 const total=await page.getByTestId('grand-total').innerText();
 await page.getByRole('complementary').getByRole('button',{name:'1 بسكويت حليب · علبة',exact:true}).click();
 await page.getByRole('button',{name:'تغيير كمية بسكويت حليب · علبة',exact:true}).click();
 await page.getByRole('textbox',{name:'الكمية',exact:true}).fill('3');
 await page.getByRole('button',{name:'حفظ التعديل',exact:true}).click();
 await expect(page.getByTestId('grand-total')).not.toHaveText(total);
 await expect(page.getByRole('button',{name:'التراجع عن آخر تعديل',exact:true})).toHaveCount(0);
});
test('price checking cannot add an item',async({page})=>{
 const total=await page.getByTestId('grand-total').innerText();
 await page.getByRole('button',{name:'التحقق من السعر',exact:true}).click();
 await page.getByRole('textbox',{name:'اسم الصنف أو الباركود',exact:true}).fill('100001');
 await expect(page.getByRole('dialog').getByRole('heading',{name:'بسكويت حليب · علبة',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'إغلاق',exact:true}).click();
 await expect(page.getByTestId('grand-total')).toHaveText(total);
});
test('cash tender calculates change and completes a receipt',async({page})=>{
 await page.getByRole('button',{name:/^الدفع/}).click();
 await page.getByRole('textbox',{name:'المبلغ المستلم',exact:true}).fill('50000');
 await page.getByRole('button',{name:'دفع',exact:true}).click();
 await expect(page.getByText(/الباقي للعميل/)).toHaveCount(0);
 await page.getByRole('button',{name:'بدون إيصال',exact:true}).click();
 await page.getByRole('button',{name:'تأكيد بدون إيصال',exact:true}).click();
 await page.getByRole('button',{name:'بدء طلب جديد',exact:true}).click();
 await expect(page.getByRole('heading',{name:'السلة فارغة',exact:true})).toBeVisible();
});
