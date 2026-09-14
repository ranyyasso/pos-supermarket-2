export type Tone =
  "pink" | "purple" | "cyan" | "green" | "blue" | "red" | "neutral" | "sand";
export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  barcode: string;
  tone: Tone;
  age?: number;
  available?: boolean;
  discountable?: boolean;
  tax: number;
  stock: number;
  custom?: boolean;
  cost?: number;
  supplier?: string;
  minStock?: number;
  unit?: "piece" | "kg" | "g" | "l" | "ml";
  expiry?: string;
  scaleCode?: string;
};
export type Discount = { kind: "percent" | "fixed"; value: number };
export type Line = {
  id: string;
  productId: string;
  quantity: number;
  discount?: Discount;
  note?: string;
  verified?: boolean;
  priceOverride?: number;
  scaleWeight?: number;
};
export type Customer = {
  id: string;
  name: string;
  phone: string;
  card: string;
  points: number;
  tier: string;
};
export type Payment = {
  id: string;
  method: "cash" | "card" | "contactless";
  amount: number;
  tendered: number;
  change: number;
};
export type Sale = {
  id: string;
  lines: Line[];
  discount?: Discount;
  coupon?: string;
  customer?: string;
  service: "takeaway" | "dinein";
  note: string;
  ageRecords: string[];
  reward: boolean;
  createdAt: string;
};
export type Transaction = {
  sale: Sale;
  payments: Payment[];
  total: number;
  receipt?: string;
  status: "completed" | "void";
  refunded: Record<string, number>;
  pricing?: ReturnType<typeof price>;
};
export type Audit = {
  id: string;
  action: string;
  reason: string;
  at: string;
  cashier: string;
  manager?: string;
};
export type Refund = {
  id: string;
  transactionId: string;
  lines: Record<string, number>;
  total: number;
  reason: string;
  allocations: { method: string; amount: number }[];
};
export type State = {
  sale: Sale;
  held: Sale[];
  transactions: Transaction[];
  refunds: Refund[];
  customers: Customer[];
  audit: Audit[];
  previous?: Sale;
  next: number;
};
export const money = (v: number) =>
  new Intl.NumberFormat("ar-IQ", {
    style: "currency",
    currency: "IQD",
    maximumFractionDigits: 0,
  }).format(v);
export const categories: { id: string; name: string; tone: Tone }[] = [
  { id: "all", name: "المفضلة", tone: "neutral" },
  { id: "starters", name: "الوجبات الخفيفة", tone: "pink" },
  { id: "pizza", name: "الإفطار", tone: "purple" },
  { id: "burger", name: "الألبان", tone: "blue" },
  { id: "dessert", name: "الحلويات", tone: "cyan" },
  { id: "soda", name: "العصائر والمياه", tone: "green" },
  { id: "beer", name: "العناية بالطفل", tone: "blue" },
  { id: "wine", name: "القرطاسية", tone: "red" },
  { id: "hot", name: "العناية اليومية", tone: "sand" },
];
const catalog: [string, string, number, Tone][] = [
  ["بسكويت حليب · علبة", "starters", 8000, "pink"],
  ["حبوب إفطار بالشوكولاتة", "pizza", 14000, "purple"],
  ["كيك فانيلا · عبوة", "dessert", 7000, "cyan"],
  ["رقائق بطاطس · عبوة عائلية", "starters", 10000, "pink"],
  ["شوفان بالعسل · علبة", "pizza", 16000, "purple"],
  ["بسكويت شوكولاتة", "dessert", 6000, "cyan"],
  ["فشار بالجبن", "starters", 5000, "pink"],
  ["زبدة فول سوداني", "pizza", 15000, "purple"],
  ["ويفر بالفانيلا", "dessert", 6500, "cyan"],
  ["عصير تفاح · ٢٠٠ مل", "soda", 2000, "green"],
  ["مناديل أطفال", "beer", 5000, "blue"],
  ["شامبو أطفال", "beer", 4500, "blue"],
  ["أقلام تلوين", "wine", 7000, "neutral"],
  ["دفتر رسم", "wine", 7000, "red"],
  ["حقيبة مدرسية", "wine", 30000, "red"],
  ["حليب أطفال · عبوة", "burger", 10000, "blue"],
  ["زبادي فراولة · عبوة", "burger", 8500, "blue"],
  ["كراكرز بالجبن", "starters", 3500, "pink"],
  ["معجون أسنان أطفال", "hot", 3000, "sand"],
  ["فرشاة أسنان أطفال", "hot", 1500, "sand"],
  ["مياه شرب · ٣٣٠ مل", "soda", 2000, "green"],
];
export const products: Product[] = catalog.map(
  ([name, category, price, tone], i) => ({
    id: `p${i + 1}`,
    name,
    category,
    price,
    cost: Math.round(price * 0.7),
    tone,
    age: undefined,
    barcode: `100${String(i + 1).padStart(3, "0")}`,
    tax: 10,
    stock: 24 + ((i * 17) % 73),
    discountable: true,
    available: true,
  }),
);
export const registeredProductsKey = 'mizan-products-v1';
const validRegisteredProduct = (p: unknown): p is Product => {
  if (!p || typeof p !== 'object') return false;
  const v = p as Record<string, unknown>;
  return v.custom === true && typeof v.id === 'string' && v.id.startsWith('custom-') &&
    typeof v.name === 'string' && !!v.name.trim() && typeof v.barcode === 'string' && /^\d{4,32}$/.test(v.barcode) &&
    typeof v.category === 'string' && categories.some(c => c.id === v.category && c.id !== 'all') &&
    typeof v.price === 'number' && Number.isSafeInteger(v.price) && v.price >= 0 &&
    typeof v.stock === 'number' && Number.isSafeInteger(v.stock) && v.stock >= 0 &&
    typeof v.tax === 'number' && Number.isFinite(v.tax) && v.tax >= 0 && v.tax <= 100 &&
    (v.cost === undefined || typeof v.cost === 'number' && Number.isSafeInteger(v.cost) && v.cost >= 0) &&
    (v.minStock === undefined || typeof v.minStock === 'number' && Number.isSafeInteger(v.minStock) && v.minStock >= 0) &&
    (v.supplier === undefined || typeof v.supplier === 'string') &&
    (v.expiry === undefined || typeof v.expiry === 'string') &&
    (v.scaleCode === undefined || typeof v.scaleCode === 'string' && /^\d{5}$/.test(v.scaleCode)) &&
    (v.unit === undefined || ['piece','kg','g','l','ml'].includes(String(v.unit)));
};
export function hydrateRegisteredProducts(): number {
  if (typeof localStorage === 'undefined') return 0;
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(registeredProductsKey) || '[]');
    if (!Array.isArray(saved)) return 0;
    const valid = saved.filter(validRegisteredProduct);
    for (const product of valid) {
      if (!products.some(p => p.id === product.id || p.barcode === product.barcode)) products.push(product);
    }
    return valid.length;
  } catch { return 0; }
}
export function registerProduct(product: Product): Product {
  if (!validRegisteredProduct(product)) throw new Error('بيانات الصنف غير صالحة');
  if (products.some(p => p.barcode === product.barcode)) throw new Error('الباركود مسجل لصنف آخر');
  if (product.scaleCode && products.some(p=>p.scaleCode===product.scaleCode)) throw new Error('رمز الميزان مسجل لصنف آخر');
  if (typeof localStorage === 'undefined') throw new Error('التخزين المحلي غير متاح');
  const saved = products.filter(p => p.custom);
  localStorage.setItem(registeredProductsKey, JSON.stringify([...saved, product]));
  products.push(product);
  return product;
}
function persistRegisteredProducts(next: Product[]) {
  if (typeof localStorage === 'undefined') throw new Error('التخزين المحلي غير متاح');
  localStorage.setItem(registeredProductsKey, JSON.stringify(next));
}
export function updateRegisteredProduct(product: Product): Product {
  if (!validRegisteredProduct(product)) throw new Error('بيانات الصنف غير صالحة');
  const index = products.findIndex(p => p.id === product.id && p.custom);
  if (index < 0) throw new Error('لا يمكن تعديل هذا الصنف');
  if (products.some(p => p.id !== product.id && p.barcode === product.barcode)) throw new Error('الباركود مسجل لصنف آخر');
  if (product.scaleCode && products.some(p=>p.id!==product.id&&p.scaleCode===product.scaleCode)) throw new Error('رمز الميزان مسجل لصنف آخر');
  const saved = products.filter(p => p.custom && p.id !== product.id);
  persistRegisteredProducts([...saved, product]);
  products[index] = product;
  return product;
}
export function deleteRegisteredProduct(id: string): void {
  const index = products.findIndex(p => p.id === id && p.custom);
  if (index < 0) throw new Error('لا يمكن حذف هذا الصنف');
  persistRegisteredProducts(products.filter(p => p.custom && p.id !== id));
  products.splice(index, 1);
}
export type InventoryMovement = {
  id: string;
  productId: string;
  delta: number;
  balance: number;
  type: 'sale' | 'refund' | 'void' | 'receive' | 'adjust';
  reference: string;
  supplier?: string;
  at: string;
};
export const inventoryStorageKey = 'mizan-inventory-v1';
function loadInventoryData(): {stock: Record<string,number>; movements: InventoryMovement[]} {
  if (typeof localStorage === 'undefined') return {stock:{},movements:[]};
  try {
    const value = JSON.parse(localStorage.getItem(inventoryStorageKey) || 'null');
    if (!value || typeof value !== 'object' || !value.stock || !Array.isArray(value.movements)) return {stock:{},movements:[]};
    const stock = Object.fromEntries(Object.entries(value.stock).filter(([,q])=>Number.isSafeInteger(q)&&Number(q)>=0)) as Record<string,number>;
    const movements = value.movements.filter((m:unknown)=>m&&typeof m==='object').slice(0,500) as InventoryMovement[];
    return {stock,movements};
  } catch { return {stock:{},movements:[]}; }
}
export function hydrateInventory(): number {
  const data=loadInventoryData();
  for(const product of products) if(Number.isSafeInteger(data.stock[product.id])) product.stock=data.stock[product.id];
  return data.movements.length;
}
export function inventoryMovements(): InventoryMovement[] { return loadInventoryData().movements; }
export function changeInventory(changes: {productId:string;quantity:number}[], type: InventoryMovement['type'], reference: string, supplier?: string): InventoryMovement[] {
  if(typeof localStorage==='undefined') throw new Error('التخزين المحلي غير متاح');
  const totals=new Map<string,number>();
  for(const change of changes){if(!Number.isFinite(change.quantity)||change.quantity===0||Math.abs(change.quantity)>999999)throw new Error('كمية المخزون غير صالحة');totals.set(change.productId,Math.round(((totals.get(change.productId)||0)+change.quantity)*1000)/1000);}
  const now=new Date().toISOString(), data=loadInventoryData(), nextStock={...data.stock}, created:InventoryMovement[]=[];
  for(const [productId,delta] of totals){const product=products.find(p=>p.id===productId);if(!product)throw new Error('الصنف غير موجود');const balance=Math.round((product.stock+delta)*1000)/1000;if(balance<0)throw new Error(`المخزون غير كافٍ: ${product.name}`);nextStock[productId]=balance;created.push({id:crypto.randomUUID(),productId,delta,balance,type,reference,supplier:supplier?.trim()||undefined,at:now});}
  try{localStorage.setItem(inventoryStorageKey,JSON.stringify({stock:nextStock,movements:[...created,...data.movements].slice(0,500)}));}catch{/* Keep the active till usable; the app displays its persistent storage warning. */}
  for(const movement of created) products.find(p=>p.id===movement.productId)!.stock=movement.balance;
  return created;
}
export const productById = (id: string) => products.find((p) => p.id === id)!;
export function ean13CheckDigit(first12:string):number{if(!/^\d{12}$/.test(first12))return -1;const sum=[...first12].reduce((total,d,i)=>total+Number(d)*(i%2===0?1:3),0);return (10-sum%10)%10;}
export function findBarcode(code:string): {product:Product;priceOverride?:number;scaleWeight?:number}|null {
  const direct=products.find(p=>p.barcode===code);if(direct)return {product:direct};
  if(!/^2\d{12}$/.test(code)||Number(code[1])>9||ean13CheckDigit(code.slice(0,12))!==Number(code[12]))return null;
  const product=products.find(p=>p.scaleCode===code.slice(2,7));if(!product)return null;
  const priceOverride=Number(code.slice(7,12));if(priceOverride<=0)return null;
  const scaleWeight=Math.round((priceOverride/product.price)*1000)/1000;
  return {product,priceOverride,scaleWeight};
}
export const uid = () => crypto.randomUUID();
export const normalizeDigits = (text: string) => text.replace(/[٠-٩۰-۹]/g, c => String(c.charCodeAt(0) - (c >= '۰' ? 1776 : 1632)));
export const normalizePhone = (text: string) => normalizeDigits(text).replace(/[\s()-]/g, '').replace(/^\+964/, '0');
export const newSale = (n: number): Sale => ({
  id: String(n),
  lines: [],
  service: "takeaway",
  note: "",
  ageRecords: [],
  reward: false,
  createdAt: new Date().toISOString(),
});
const cut = (base: number, d?: Discount) =>
  d
    ? Math.min(
        base,
        Math.max(
          0,
          Math.round(d.kind === "percent" ? (base * d.value) / 100 : d.value),
        ),
      )
    : 0;
export function price(sale: Sale) {
  const rows = sale.lines.map((l) => {
    const p = productById(l.productId);
    const gross = l.priceOverride ?? Math.round(p.price * l.quantity);
    const itemDiscount = p.discountable ? cut(gross, l.discount) : 0;
    return {
      id: l.id,
      gross,
      itemDiscount,
      promo: 0,
      basketDiscount: 0,
      reward: 0,
      net: gross - itemDiscount,
      tax: 0,
      total: 0,
      taxRate: p.tax,
      eligible: !!p.discountable,
    };
  });
  // JUICE2 is an automatic buy-two promotion: every second juice is free.
  let juicePromotion = Math.floor(sale.lines.filter(l => l.productId === 'p10').reduce((sum,l) => sum+l.quantity,0)/2)*productById('p10').price;
  for (const r of rows) {
    if (sale.lines.find(l => l.id === r.id)!.productId !== 'p10') continue;
    r.promo = Math.min(r.net, juicePromotion);
    r.net -= r.promo;
    juicePromotion -= r.promo;
  }
  const eligible = rows.filter((r) => r.eligible);
  const base = eligible.reduce((a, r) => a + r.net, 0);
  const couponDiscount =
    sale.coupon === "WELCOME10"
      ? Math.round(base * 0.1)
      : sale.coupon === "DESSERT5" &&
          sale.lines
            .filter((l) => productById(l.productId).category === "dessert")
            .reduce(
              (s, l) => s + productById(l.productId).price * l.quantity,
              0,
            ) >= 20000
        ? 5000
        : 0;
  const dessertRows = eligible.filter(r => productById(sale.lines.find(l => l.id === r.id)!.productId).category === 'dessert');
  const couponRows = sale.coupon === 'DESSERT5' ? dessertRows : eligible;
  const basketOnly = cut(base, sale.discount);
  const coupon = Math.min(base-basketOnly, couponRows.reduce((sum,r) => sum+r.net,0), couponDiscount);
  const basket = basketOnly + coupon;
  const reward = sale.reward && base - basket >= 5000 ? 5000 : 0;
  const allocate = (amount: number, key: "basketDiscount" | "reward", target = eligible) => {
    let left = amount;
    const denominator = target.reduce((a, r) => a + r.net, 0);
    const shares = target.map(r => ({r, value: Math.floor(amount*r.net/(denominator || 1)), fraction: (amount*r.net)%(denominator || 1)}));
    left -= shares.reduce((sum, share) => sum+share.value,0);
    [...shares].sort((a,b) => b.fraction-a.fraction).forEach(share => {if(left>0 && share.value<share.r.net){share.value++;left--;}});
    shares.forEach(({r,value}) => {
      r[key] += value;
      r.net -= value;
    });
  };
  allocate(basketOnly, "basketDiscount");
  allocate(Math.min(coupon, couponRows.reduce((sum,r) => sum+r.net,0)), "basketDiscount", couponRows);
  allocate(reward, "reward");
  // Round each tax-rate group once, then distribute its whole dinars to lines.
  // This keeps a displayed 10% tax consistent with the invoice's taxable base.
  for(const rate of new Set(rows.map(r=>r.taxRate))){
    const group=rows.filter(r=>r.taxRate===rate);
    const tax=Math.round(group.reduce((sum,r)=>sum+r.net,0)*rate/100);
    group.forEach(r=>{r.tax=Math.floor(r.net*rate/100);});
    let remainder=tax-group.reduce((sum,r)=>sum+r.tax,0);
    [...group].sort((a,b)=>(b.net*rate%100)-(a.net*rate%100)).forEach(r=>{if(remainder>0){r.tax++;remainder--;}});
  }
  rows.forEach(r=>{r.total=r.net+r.tax;});
  const sum = (
    key: "gross" | "itemDiscount" | "promo" | "net" | "tax" | "total",
  ) => rows.reduce((a, r) => a + r[key], 0);
  return {
    rows,
    subtotal: sum("gross"),
    itemDiscount: sum("itemDiscount"),
    promotions: sum("promo"),
    basketDiscount: basket,
    reward,
    taxable: sum("net"),
    tax: sum("tax"),
    total: sum("total"),
    count: sale.lines.reduce((a, l) => a + l.quantity, 0),
  };
}
export function couponError(code: string, sale: Sale): string | undefined {
  if (!["WELCOME10", "DESSERT5", "JUICE2"].includes(code))
    return code === "EXPIRED" ? "انتهت صلاحية هذا الكوبون" : "الكوبون غير صالح";
  if (sale.discount) return "احذف خصم السلة قبل إضافة كوبون";
  if (code === "JUICE2") return "عرض عصير ٢ يُطبّق تلقائياً عند شراء عبوتين";
  if (
    code === "DESSERT5" &&
    sale.lines
      .filter((l) => productById(l.productId).category === "dessert")
      .reduce((a, l) => a + l.quantity * productById(l.productId).price, 0) <
      20000
  )
    return "يتطلب حلويات بقيمة ٢٠٬٠٠٠ د.ع";
  if (!sale.lines.some((l) => productById(l.productId).discountable))
    return "لا توجد أصناف مؤهلة";
}
export function cashPayment(
  remaining: number,
  tendered: number,
  partial = false,
): Payment {
  if (!Number.isSafeInteger(tendered) || tendered <= 0 || !Number.isSafeInteger(remaining) || remaining <= 0)
    throw new Error("أدخل مبلغاً صحيحاً");
  if (!partial && tendered < remaining)
    throw new Error("المبلغ المستلم أقل من المطلوب");
  return {
    id: uid(),
    method: "cash",
    amount: Math.min(remaining, tendered),
    tendered,
    change: Math.max(0, tendered - remaining),
  };
}
export function refundValue(tx: Transaction, selected: Record<string, number>) {
  if (tx.status === "void") throw new Error("المعاملة ملغاة");
  if(Object.entries(selected).some(([id,q]) => !tx.sale.lines.some(l=>l.id===id) || !Number.isSafeInteger(q) || q<0)) throw new Error('كمية الاسترجاع غير صالحة');
  const totals = tx.pricing || price(tx.sale);
  // Older demo receipts lack a pricing snapshot. Preserve their recorded grand total.
  let cumulative=0;
  const historical = new Map(totals.rows.map(r=>{const before=cumulative;cumulative+=r.total;return [r.id, totals.total ? Math.round(tx.total*cumulative/totals.total)-Math.round(tx.total*before/totals.total) : 0];}));
  return tx.sale.lines.reduce((sum, l) => {
    const q = selected[l.id] || 0,
      done = tx.refunded[l.id] || 0;
    if (!Number.isInteger(q) || q < 0 || q + done > l.quantity)
      throw new Error("كمية الاسترجاع غير صالحة");
    const total = historical.get(l.id)!;
    return (
      sum +
      Math.round((total * (done + q)) / l.quantity) -
      Math.round((total * done) / l.quantity)
    );
  }, 0);
}
export function refundAllocations(
  tx: Transaction,
  total: number,
  prior: Refund[],
) {
  let remaining = total;
  let priorAmount = prior.filter(r=>r.transactionId===tx.sale.id).reduce((sum,r)=>sum+r.total,0);
  const methods = [...new Set(tx.payments.map((p) => p.method))];
  return methods
    .map((method) => {
      const paid = tx.payments
        .filter((p) => p.method === method)
        .reduce((s, p) => s + p.amount, 0);
      // Consume original tender capacity even when a manager paid an earlier refund in cash.
      const used = Math.min(paid, priorAmount);
      priorAmount -= used;
      const amount = Math.min(remaining, Math.max(0, paid - used));
      remaining -= amount;
      return { method, amount };
    })
    .filter((a) => a.amount > 0);
}
export const seed = (): State => {
  const sale = newSale(553);
  sale.lines = ["p1", "p5", "p3", "p6", "p10", "p7"].map((productId) => ({
    id: uid(),
    productId,
    quantity: 1,
  }));
  return {
    sale,
    held: [],
    transactions: [],
    refunds: [],
    customers: [
      {
        id: "c1",
        name: "أحمد علي",
        phone: "07701234567",
        card: "200001",
        points: 650,
        tier: "ذهبي",
      },
      {
        id: "c2",
        name: "نور حسين",
        phone: "07801234567",
        card: "200002",
        points: 120,
        tier: "فضي",
      },
    ],
    audit: [],
    next: 554,
  };
};
export type Action =
  | { type: "sale"; sale: Sale }
  | { type: "undo" }
  | { type: "hold" }
  | { type: "recall"; id: string }
  | { type: "cancel"; reason: string }
  | { type: "complete"; payments: Payment[] }
  | { type: "receipt"; id: string; method: string }
  | { type: "customer"; customer: Customer }
  | { type: "audit"; action: string; reason: string; manager?: string }
  | { type: "void"; id: string; reason: string }
  | {
      type: "refund";
      id: string;
      selected: Record<string, number>;
      reason: string;
      cash: boolean;
    }
  | { type: "reset" };
export function reducer(s: State, a: Action): State {
  const log = (action: string, reason = "", manager?: string): Audit => ({
    id: uid(),
    action,
    reason,
    manager,
    at: new Date().toISOString(),
    cashier: "سارة حسن",
  });
  switch (a.type) {
    case "sale":
      return isSale(a.sale) ? { ...s, previous: s.sale, sale: a.sale } : s;
    case "undo":
      return s.previous ? { ...s, sale: s.previous, previous: undefined } : s;
    case "hold":
      return s.sale.lines.length
        ? {
            ...s,
            held: [s.sale, ...s.held],
            sale: newSale(s.next),
            next: s.next + 1,
            previous: undefined,
            audit: [log("تعليق بيع", s.sale.id), ...s.audit],
          }
        : s;
    case "recall": {
      const sale = s.held.find((h) => h.id === a.id);
      return sale
        ? {
            ...s,
            sale,
            held: s.held
              .filter((h) => h.id !== a.id)
              .concat(s.sale.lines.length ? [s.sale] : []),
            previous: undefined,
          }
        : s;
    }
    case "cancel":
      return {
        ...s,
        sale: newSale(s.next),
        next: s.next + 1,
        previous: undefined,
        audit: [log("إلغاء بيع", a.reason), ...s.audit],
      };
    case "complete": {
      const total = price(s.sale).total;
      if (
        checkoutError(s) || !validPayments(a.payments) ||
        a.payments.reduce((v, p) => v + p.amount, 0) !== total ||
        s.transactions.some((t) => t.sale.id === s.sale.id)
      )
        return s;
      return {
        ...s,
        transactions: [
          {
            sale: structuredClone(s.sale),
            payments: a.payments,
            total,
            status: "completed",
            refunded: {},
            pricing: structuredClone(price(s.sale)),
          },
          ...s.transactions,
        ],
        customers: s.customers.map((c) =>
          c.id === s.sale.customer
            ? {
                ...c,
                points: Math.min(999999999,
                  c.points -
                  (price(s.sale).reward > 0 ? 500 : 0) +
                  Math.floor(total / 1000)),
              }
            : c,
        ),
        sale: newSale(s.next),
        next: s.next + 1,
        previous: undefined,
        audit: [log("إتمام بيع", s.sale.id), ...s.audit],
      };
    }
    case "receipt":
      return {
        ...s,
        transactions: s.transactions.map((t) =>
          t.sale.id === a.id ? { ...t, receipt: a.method } : t,
        ),
        audit: [log("إيصال", a.method), ...s.audit],
      };
    case "customer":
      if (!isCustomer(a.customer)) return s;
      return {
        ...s,
        customers: [
          a.customer,
          ...s.customers.filter((c) => c.id !== a.customer.id),
        ],
      };
    case "audit":
      return { ...s, audit: [log(a.action, a.reason, a.manager), ...s.audit] };
    case "void": {
      const tx = s.transactions.find((t) => t.sale.id === a.id);
      if (
        !tx ||
        tx.status === "void" ||
        Object.values(tx.refunded).some((v) => v > 0)
      )
        return s;
      return {
        ...s,
        customers: reverseLoyalty(s.customers, tx, 0, tx.total, true),
        transactions: s.transactions.map((t) =>
          t.sale.id === a.id ? { ...t, status: "void" } : t,
        ),
        refunds: [
          {
            id: uid(),
            transactionId: a.id,
            lines: Object.fromEntries(
              tx.sale.lines.map((l) => [l.id, l.quantity]),
            ),
            total: tx.total,
            reason: `إلغاء: ${a.reason}`,
            allocations: tx.payments.map((p) => ({
              method: p.method,
              amount: p.amount,
            })),
          },
          ...s.refunds,
        ],
        audit: [log("إلغاء معاملة مكتملة", a.reason, "مدير"), ...s.audit],
      };
    }
    case "refund": {
      const tx = s.transactions.find((t) => t.sale.id === a.id);
      if (!tx) return s;
      let total: number;
      try { total = refundValue(tx, a.selected); } catch { return s; }
      if (!Object.values(a.selected).some(q=>q>0) || !a.reason.trim()) return s;
      const prior = s.refunds.filter(r=>r.transactionId===a.id).reduce((sum,r)=>sum+r.total,0);
      const full = tx.sale.lines.every(l=>(tx.refunded[l.id]||0)+(a.selected[l.id]||0)===l.quantity);
      return {
        ...s,
        customers: reverseLoyalty(s.customers, tx, prior, prior+total, full),
        transactions: s.transactions.map((t) =>
          t.sale.id === a.id
            ? {
                ...t,
                refunded: Object.fromEntries(
                  t.sale.lines.map((l) => [
                    l.id,
                    (t.refunded[l.id] || 0) + (a.selected[l.id] || 0),
                  ]),
                ),
              }
            : t,
        ),
        refunds: [
          {
            id: uid(),
            transactionId: a.id,
            total,
            lines: a.selected,
            reason: a.reason,
            allocations: a.cash
              ? [{ method: "cash", amount: total }]
              : refundAllocations(tx, total, s.refunds),
          },
          ...s.refunds,
        ],
        audit: [log("استرجاع", a.reason, "مدير"), ...s.audit],
      };
    }
    case "reset":
      return seed();
  }
}
const record = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);
const integer = (v: unknown, min=0, max=Number.MAX_SAFE_INTEGER): v is number => typeof v==='number' && Number.isSafeInteger(v) && v>=min && v<=max;
const string = (v: unknown): v is string => typeof v==='string';
const date = (v: unknown) => string(v) && Number.isFinite(Date.parse(v));
const unique = (values: string[]) => new Set(values).size===values.length;
function isDiscount(d: unknown) {return d===undefined || record(d) && (d.kind==='fixed' || d.kind==='percent') && typeof d.value==='number' && Number.isFinite(d.value) && d.value>0 && d.value <= (d.kind==='percent'?100:999999999);}
export function isSale(v: unknown): v is Sale {
  if(!record(v) || !string(v.id) || !v.id || !Array.isArray(v.lines) || !Array.isArray(v.ageRecords)) return false;
  return v.lines.every((l: unknown)=>record(l) && string(l.id) && !!l.id && products.some(p=>p.id===l.productId) && integer(l.quantity,1,999) && isDiscount(l.discount) && (l.note===undefined || string(l.note)) && (l.verified===undefined || typeof l.verified==='boolean') && (l.priceOverride===undefined || integer(l.priceOverride,1,999999999)) && (l.scaleWeight===undefined || typeof l.scaleWeight==='number'&&Number.isFinite(l.scaleWeight)&&l.scaleWeight>0&&l.scaleWeight<=999))
    && unique(v.lines.map((l:Line)=>l.id)) && isDiscount(v.discount)
    && (v.coupon===undefined || ['WELCOME10','DESSERT5'].includes(v.coupon))
    && (v.customer===undefined || string(v.customer)) && ['takeaway','dinein'].includes(v.service)
    && string(v.note) && typeof v.reward==='boolean' && v.ageRecords.every(string) && date(v.createdAt);
}
function isCustomer(v: unknown): v is Customer {
  return record(v) && string(v.id) && !!v.id && string(v.name) && !!v.name.trim() && string(v.phone) && /^07\d{9}$/.test(normalizePhone(v.phone)) && string(v.card) && string(v.tier) && integer(v.points,0,999999999);
}
export function validPayments(value: unknown): value is Payment[] {
  return Array.isArray(value) && value.every(p => record(p) && string(p.id) && ['cash','card','contactless'].includes(p.method) && integer(p.amount,1) && integer(p.tendered,p.amount) && integer(p.change) && p.tendered-p.amount===p.change && (p.method==='cash' || p.change===0)) && unique(value.map(p=>p.id));
}
function validPricing(p: unknown, sale: Sale, total: number) {
  if(!record(p) || !Array.isArray(p.rows) || p.rows.length!==sale.lines.length || !unique(p.rows.map((r:any)=>r?.id)))return false;
  const rowKeys=['gross','itemDiscount','promo','basketDiscount','reward','net','tax','total','taxRate'];
  if(!p.rows.every((r:unknown)=>record(r) && sale.lines.some(l=>l.id===r.id) && rowKeys.every(k=>integer(r[k])) && typeof r.eligible==='boolean' && r.net+r.tax===r.total))return false;
  return ['subtotal','itemDiscount','promotions','basketDiscount','reward','taxable','tax','total','count'].every(k=>integer(p[k])) && p.total===total && p.rows.reduce((sum:number,r:{total:number})=>sum+r.total,0)===total;
}
export function checkoutError(s: State): string | undefined {
  if(!s.sale.lines.length) return 'السلة فارغة';
  if(s.sale.lines.some(l=>productById(l.productId).age && !l.verified)) return 'تحقق من عمر العميل للأصناف المقيدة';
  if(s.sale.coupon) {const error=couponError(s.sale.coupon,s.sale);if(error)return error;}
  if(s.sale.reward) {
    const customer=s.customers.find(c=>c.id===s.sale.customer);
    if(!customer || customer.points<500) return 'رصيد الولاء لا يكفي. ألغِ المكافأة أو اختر عميلاً آخر.';
    if(price(s.sale).reward!==5000) return 'المكافأة تتطلب أصنافاً مؤهلة بقيمة ٥٬٠٠٠ د.ع بعد الخصومات. ألغِ المكافأة أو أضف أصنافاً.';
  }
}
function reverseLoyalty(customers: Customer[], tx: Transaction, before: number, after: number, full: boolean) {
  const earned = Math.floor(tx.total/1000);
  const reclaimedBefore = tx.total ? Math.floor(earned*before/tx.total) : 0;
  const reclaimedAfter = tx.total ? Math.floor(earned*after/tx.total) : 0;
  const restored = full && price(tx.sale).reward>0 ? 500 : 0;
  return customers.map(c=>c.id===tx.sale.customer ? {...c,points:Math.min(999999999,Math.max(0,c.points-(reclaimedAfter-reclaimedBefore)+restored))} : c);
}
export function validState(v: unknown): v is State {
  if(!record(v) || !isSale(v.sale) || !Array.isArray(v.held) || !v.held.every(isSale) || !Array.isArray(v.customers) || !v.customers.every(isCustomer) || !Array.isArray(v.transactions) || !Array.isArray(v.refunds) || !Array.isArray(v.audit) || !integer(v.next,1)) return false;
  if(v.previous!==undefined && !isSale(v.previous)) return false;
  if(!v.transactions.every((t: unknown)=>record(t) && isSale(t.sale) && validPayments(t.payments) && integer(t.total) && t.payments.reduce((sum:number,p:Payment)=>sum+p.amount,0)===t.total && ['completed','void'].includes(t.status) && record(t.refunded) && Object.entries(t.refunded).every(([id,q])=>t.sale.lines.some((l:Line)=>l.id===id && integer(q,0,l.quantity))) && (t.receipt===undefined || string(t.receipt)) && (t.pricing===undefined || validPricing(t.pricing,t.sale,t.total)))) return false;
  if(!v.refunds.every((r: unknown)=>record(r) && string(r.id) && string(r.transactionId) && v.transactions.some((t:Transaction)=>t.sale.id===r.transactionId) && integer(r.total) && string(r.reason) && record(r.lines) && Object.values(r.lines).every(q=>integer(q)) && Array.isArray(r.allocations) && r.allocations.every((a:unknown)=>record(a) && ['cash','card','contactless'].includes(a.method) && integer(a.amount)) && r.allocations.reduce((sum:number,a:{amount:number})=>sum+a.amount,0)===r.total)) return false;
  if(!v.audit.every((a: unknown)=>record(a) && string(a.id) && string(a.action) && string(a.reason) && string(a.cashier) && date(a.at) && (a.manager===undefined || string(a.manager)))) return false;
  const saleIds=[v.sale.id,...v.held.map((s:Sale)=>s.id),...v.transactions.map((t:Transaction)=>t.sale.id)];
  return unique(saleIds) && saleIds.every(id=>/^\d+$/.test(id) && Number(id)<v.next) && unique(v.customers.map((c:Customer)=>c.id));
}
let recoveryNotice = '';
export const getRecoveryNotice = () => recoveryNotice;
export function loadState(): State {
  try {
    const raw = localStorage.getItem("mizan-pos-v1");
    if (raw) {
      const s = JSON.parse(raw);
      if (validState(s)) return s;
      throw new Error('Invalid saved state');
    }
  } catch {
    recoveryNotice='تعذر تحميل البيانات المحفوظة. بدأت نسخة تجريبية جديدة؛ احتُفظ بالبيانات الأصلية للاستعادة إن أمكن.';
    try {const raw=localStorage.getItem('mizan-pos-v1');if(raw && !localStorage.getItem('mizan-pos-recovery-v1'))localStorage.setItem('mizan-pos-recovery-v1',raw);}catch{}
  }
  return seed();
}
