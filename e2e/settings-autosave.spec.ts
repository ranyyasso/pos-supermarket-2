import {test,expect,type Page} from '@playwright/test';
const b=(p:Page,name:string)=>p.getByRole('button',{name,exact:true});
const tab=(p:Page,name:string)=>p.getByRole('tab',{name,exact:true});
const f=(p:Page,name:string)=>p.getByRole('textbox',{name,exact:true});
async function open(p:Page,name='المتجر'){await b(p,'الإعدادات').click();await tab(p,name).click();}
async function approve(p:Page){await f(p,'رمز المدير').fill('2468');await b(p,'اعتماد العملية').click();}
test.beforeEach(async({page})=>{await page.goto('/');});
test('six direct tabs expose their fields without expanders or save buttons',async({page})=>{
 await open(page);await expect(page.getByRole('tab')).toHaveText(['المتجر','الفئات','الأجهزة','الإيصال','العروض','المظهر والتجربة']);
 for(const name of ['المتجر','الفئات','الأجهزة','الإيصال','العروض','المظهر والتجربة']){await tab(page,name).click();await expect(page.getByRole('tabpanel',{name,exact:true})).toBeVisible();}
 await expect(page.locator('.printer-settings details')).toHaveCount(0);await expect(page.getByRole('button',{name:/^حفظ (الإعدادات|العرض)$/})).toHaveCount(0);
});
test('settings save immediately across tabs, close and reload',async({page})=>{
 await open(page);await f(page,'اسم المتجر').fill('متجر محفوظ تلقائياً');await f(page,'الأسباب (سبب في كل سطر)').fill('تالف\nغير مطابق\n');
 await tab(page,'الإيصال').click();await f(page,'نهاية الإيصال').fill('أهلاً بكم');await f(page,'بادئة رقم الإيصال').fill('AUTO-');
 await tab(page,'الأجهزة').click();await f(page,'أسباب فتح الدرج (سبب في كل سطر)').fill('فكة\nتوريد');await page.getByRole('combobox',{name:'عرض الورق',exact:true}).selectOption('58');
 await b(page,'العودة إلى شاشة البيع').click();await expect(page.getByRole('dialog')).toHaveCount(0);await page.reload();await open(page);
 await expect(f(page,'اسم المتجر')).toHaveValue('متجر محفوظ تلقائياً');await expect(f(page,'الأسباب (سبب في كل سطر)')).toHaveValue('تالف\nغير مطابق');await tab(page,'الإيصال').click();await expect(f(page,'نهاية الإيصال')).toHaveValue('أهلاً بكم');await expect(f(page,'بادئة رقم الإيصال')).toHaveValue('AUTO-');await tab(page,'الأجهزة').click();await expect(page.getByRole('combobox',{name:'عرض الورق',exact:true})).toHaveValue('58');await expect(f(page,'أسباب فتح الدرج (سبب في كل سطر)')).toHaveValue('فكة\nتوريد');
});
test('invalid required value keeps last saved data and retains exit protection',async({page})=>{
 await open(page);await f(page,'اسم المتجر').fill('اسم صحيح');await f(page,'اسم المتجر').fill('');await expect(page.locator('.settings-autosave')).toContainText('أدخل اسم المتجر');expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('mizan-printer-v1')!).merchant)).toBe('اسم صحيح');await b(page,'العودة إلى شاشة البيع').click();await expect(page.getByRole('heading',{name:'حفظ التغييرات؟'})).toBeVisible();await b(page,'العودة إلى التحرير').click();await f(page,'اسم المتجر').fill('اسم مصحح');await b(page,'العودة إلى شاشة البيع').click();await expect(page.getByRole('dialog')).toHaveCount(0);
});
test('storage failures are visible and a later edit retries',async({page})=>{
 await open(page);await page.evaluate(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='mizan-printer-v1'){Storage.prototype.setItem=original;throw new Error('quota');}return original.call(this,k,v);};});await f(page,'اسم المتجر').fill('محاولة');await expect(page.locator('.settings-autosave')).toContainText('تعذر الحفظ');await f(page,'اسم المتجر').fill('استعادة');await expect(page.locator('.settings-autosave')).toContainText('تم الحفظ تلقائياً');
});
test('offers autosave after manager authorization and reject invalid edits',async({page})=>{
 await open(page,'العروض');await f(page,'اسم العرض').fill('عرض تلقائي');await approve(page);await f(page,'رمز الكوبون الاختياري').fill('AUTO10');await page.getByRole('checkbox',{name:'تفعيل العرض',exact:true}).check();await approve(page);
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('mizan-sales-settings-v1')!).offers[0])).toMatchObject({name:'عرض تلقائي',code:'AUTO10',active:true});
 await f(page,'رمز الكوبون الاختياري').fill('WELCOME10');await expect(page.getByRole('alert')).toContainText('مكرر');expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('mizan-sales-settings-v1')!).offers[0].code)).toBe('AUTO10');await f(page,'رمز الكوبون الاختياري').fill('AUTO20');await approve(page);await b(page,'العودة إلى شاشة البيع').click();await expect(page.getByRole('dialog')).toHaveCount(0);
});
for(const width of [390,1366])test(`settings fit ${width}px with accessible open fields`,async({page})=>{
 await page.setViewportSize({width,height:800});await open(page);await expect(f(page,'اسم المتجر')).toBeInViewport();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:`qa/settings-autosave-${width}.png`});await tab(page,'الإيصال').click();await expect(f(page,'نهاية الإيصال')).toBeVisible();
});
test('printer numeric limits preserve the last valid setting',async({page})=>{
 await open(page,'الأجهزة');const margin=page.getByRole('spinbutton').first();await margin.fill('3.5');await margin.fill('99');await expect(page.locator('.settings-autosave')).toContainText('أدخل هامشاً');expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('mizan-printer-v1')!).margin)).toBe(3.5);await margin.fill('4');await b(page,'العودة إلى شاشة البيع').click();await expect(page.getByRole('dialog')).toHaveCount(0);
});
test('cancelling offer approval leaves saved prices unchanged and protects the draft',async({page})=>{
 await open(page,'العروض');await f(page,'اسم العرض').fill('عرض يتطلب اعتماداً');await expect(f(page,'رمز المدير')).toBeVisible();await b(page,'إغلاق').click();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('mizan-sales-settings-v1')||'{"offers":[]}').offers.length)).toBe(0);await expect(f(page,'اسم العرض')).toHaveValue('عرض يتطلب اعتماداً');await expect(b(page,'عرض جديد')).toBeDisabled();await b(page,'العودة إلى شاشة البيع').click();await expect(page.getByRole('heading',{name:'حفظ التغييرات؟'})).toBeVisible();await b(page,'نعم').click();await approve(page);await expect(page.getByRole('dialog')).toHaveCount(0);
});
