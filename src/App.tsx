import { useEffect, useReducer, useRef, useState, type ReactNode } from "react";
import { Dialog } from "radix-ui";
import { ReceiptPreview } from "./ReceiptPreview";
import { PrinterSettings } from "./PrinterSettings";
import { buildDailyReport, dailyReportCsv } from "./reports";
import { loadPrinterSettings, thermalPrintDocument, productLabelDocument, salePrintReceipt, refundPrintReceipt, type PrintReceipt, type PrinterSettings as PrintSettings } from "./printing";
import {
  Search,
  ScanBarcode,
  ChevronLeft,
  Plus,
  Minus,
  Trash2,
  Undo2,
  Pause,
  FolderOpen,
  UserRound,
  ShieldCheck,
  Wifi,
  UtensilsCrossed,
  ShoppingBag,
  Percent,
  Ticket,
  Wallet,
  CreditCard,
  Smartphone,
  Split,
  Printer,
  Mail,
  MessageSquare,
  X,
  Check,
  ArrowRight,
  LockKeyhole,
  History,
  RotateCcw,
  ReceiptText,
  Banknote,
  CircleHelp,
  Coffee,
  BarChart3,
  Download,
  Settings as SettingsIcon,
} from "lucide-react";
import {
  categories,
  products,
  productById,
  money,
  price,
  uid,
  reducer,
  loadState,
  couponError,
  cashPayment,
  refundValue,
  refundAllocations,
  checkoutError,
  validPayments,
  normalizeDigits,
  normalizePhone,
  getRecoveryNotice,
  hydrateRegisteredProducts,
  registerProduct,
  updateRegisteredProduct,
  deleteRegisteredProduct,
  hydrateInventory,
  inventoryMovements,
  changeInventory,
  findBarcode,
  type Sale,
  type Line,
  type Product,
  type Payment,
  type Customer,
  type Transaction,
  type Discount,
} from "./model";
type Modal =
  | null
  | "customer"
  | "discount"
  | "coupon"
  | "price"
  | "newProduct"
  | "products"
  | "inventory"
  | "reports"
  | "age"
  | "quantity"
  | "hold"
  | "recall"
  | "cancel"
  | "payment"
  | "receipt"
  | "printer"
  | "settings"
  | "history"
  | "refund"
  | "drawer"
  | "confirm"
  | "help";
type Workspace = "products" | "inventory" | "history" | "reports" | "printer";
const workspaceOrder: Workspace[] = ["products", "inventory", "history", "reports", "printer"];
const workspaceTabs: {id: Workspace; label: string; icon: typeof ShoppingBag}[] = [
  {id:"products",label:"الأصناف",icon:ShoppingBag},
  {id:"inventory",label:"المخزون والاستلام",icon:FolderOpen},
  {id:"history",label:"المعاملات",icon:History},
  {id:"reports",label:"تقارير اليوم",icon:BarChart3},
  {id:"printer",label:"الطابعة",icon:Printer},
];
hydrateRegisteredProducts();
hydrateInventory();
type NewProductDraft = {barcode:string;scaleCode:string;name:string;category:string;price:string;cost:string;supplier:string;stock:string;minStock:string;unit:"piece"|"kg"|"g"|"l"|"ml";tax:string;expiry:string};
const emptyNewProduct = (barcode = ""): NewProductDraft => ({barcode,scaleCode:"",name:"",category:"starters",price:"",cost:"",supplier:"",stock:"0",minStock:"0",unit:"piece",tax:"10",expiry:""});
const methods = {
  cash: "نقداً",
  card: "بطاقة مصرفية",
  contactless: "دفع لاتلامسي",
};
const amountText = (value: number) => new Intl.NumberFormat('ar-IQ',{maximumFractionDigits:0}).format(value);
function savedPayment() {
  try {
    const s = loadState(),
      p = JSON.parse(localStorage.getItem("mizan-payment-v1") || "null");
    return p?.saleId === s.sale.id && validPayments(p.payments) && p.payments.reduce((sum:number,p:Payment)=>sum+p.amount,0)<price(s.sale).total
      ? (p.payments as Payment[])
      : [];
  } catch {
    return [];
  }
}
const Stamp = ({ children }: { children: ReactNode }) => (
  <span className="stamp">{children}</span>
);
function Btn({
  children,
  onClick,
  variant = "",
  disabled = false,
  label,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: string;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`btn ${variant}`}
    >
      {children}
    </button>
  );
}
function Numpad({
  value,
  onChange,
}: {
  value: string;
  onChange: (s: string) => void;
}) {
  return (
    <div className="numpad" dir="ltr">
      {["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "⌫"].map(
        (key) => (
          <button
            key={key}
            onClick={() =>
              onChange(
                key === "C"
                  ? ""
                  : key === "⌫"
                    ? value.slice(0, -1)
                    : (value === "0" ? "" : value) + key,
              )
            }
          >
            {key}
          </button>
        ),
      )}
    </div>
  );
}
function Field({
  label,
  value,
  onChange,
  placeholder = "",
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(normalizeDigits(e.target.value))}
        maxLength={240}
      />
    </label>
  );
}
export function App() {
  const [printerSettings, setPrinterSettings] = useState(loadPrinterSettings);
  const [printDocument, setPrintDocument] = useState("");
  const drawerPrintRef = useRef<Transaction | null>(null);
  function previewPrint(receipt: PrintReceipt, settings: PrintSettings = printerSettings, drawerTx?: Transaction) {
    if (!settings.enabled) {
      setToast("الطباعة الحرارية غير مفعلة في الإعدادات");
      return false;
    }
    drawerPrintRef.current = drawerTx?.payments.some(payment => payment.method === 'cash') && settings.drawerKick ? drawerTx : null;
    setPrintDocument(thermalPrintDocument(receipt, settings));
    return true;
  }
  function previewProductLabel(product: Product) {
    if(!printerSettings.enabled){setToast("الطباعة الحرارية غير مفعلة في الإعدادات");return;}
    try{setPrintDocument(productLabelDocument(product,printerSettings));}catch{setToast("تعذر إنشاء ملصق الباركود");}
  }
  const [printerReturn, setPrinterReturn] = useState<"settings" | "receipt" | null>(null);
  const [storageWarning, setStorageWarning] = useState("");
  const [, setCatalogVersion] = useState(0);
  const [newProduct, setNewProduct] = useState<NewProductDraft>(() => emptyNewProduct());
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [inventoryProductId, setInventoryProductId] = useState(products[0].id);
  const [receiveQuantity, setReceiveQuantity] = useState("");
  const [receiveSupplier, setReceiveSupplier] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [confirmation,setConfirmation]=useState<{title:string;reason:boolean;run:(reason:string)=>void}|null>(null);
  function ask(title:string,run:(reason:string)=>void,reason=false){setConfirmation({title,run,reason});open('confirm');}
  const [state, dispatch] = useReducer(reducer, undefined, loadState),
    [category, setCategory] = useState("all"),
    [search, setSearch] = useState(""),
    [modal, setModal] = useState<Modal>(() =>
      savedPayment().length ? "payment" : null,
    );
  const [selected, setSelected] = useState<string | null>(null),
    [toast, setToast] = useState(""),
    [error, setError] = useState(""),
    [input, setInput] = useState(""),
    [aux, setAux] = useState("");
  const [discountKind, setDiscountKind] = useState<"percent" | "fixed">(
      "percent",
    ),
    [discountTarget, setDiscountTarget] = useState("basket"),
    [pendingProduct, setPendingProduct] = useState<Product | null>(null),
    [checkedProduct, setCheckedProduct] = useState<Product | null>(null);
  const [checkedScale, setCheckedScale] = useState<{priceOverride?:number;scaleWeight?:number}|null>(null);
  const [customerQuery, setCustomerQuery] = useState(""),
    [newCustomer, setNewCustomer] = useState(false),
    [payments, setPayments] = useState<Payment[]>(savedPayment),
    [method, setMethod] = useState<Payment["method"]>("cash"),
    [split, setSplit] = useState(() => savedPayment().length > 0),
    [processing, setProcessing] = useState(false),
    [payResult, setPayResult] = useState("");
  const [receiptId, setReceiptId] = useState(""),
    [receiptChoice, setReceiptChoice] = useState("print"),
    [receiptPhase, setReceiptPhase] = useState(false),
    [approval, setApproval] = useState<{
      title: string;
      run: () => void;
    } | null>(null),
    [pin, setPin] = useState(""),
    [attempts, setAttempts] = useState(0),
    [lockedUntil, setLockedUntil] = useState(0),
    [now, setNow] = useState(Date.now());
  const [historyQuery, setHistoryQuery] = useState(""),
    [returnTx, setReturnTx] = useState<Transaction | null>(null),
    [returns, setReturns] = useState<Record<string, number>>({}),
    [refundCash, setRefundCash] = useState(false),
    [historyTab, setHistoryTab] = useState<"sales" | "audit" | "refunds">(
      "sales",
    ),
    [drawerOpen, setDrawerOpen] = useState(false);
  const busyRef = useRef(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const onPrintRequest = (event: MessageEvent) => {
      const previewFrame = document.querySelector<HTMLIFrameElement>('iframe[title="معاينة الإيصال الحراري"]');
      if (event.source !== previewFrame?.contentWindow || event.data?.type !== 'mizan-print-request') return;
      const tx = drawerPrintRef.current;
      if (!tx) return;
      drawerPrintRef.current = null;
      setDrawerOpen(true);
      dispatch({type:'audit', action:'محاكاة نبضة درج النقد', reason:`طلب طباعة إيصال نقدي ${tx.sale.id}`});
      announce('تمت محاكاة نبضة درج النقد؛ تحقق من الطابعة والدرج فعلياً');
    };
    window.addEventListener('message', onPrintRequest);
    return () => window.removeEventListener('message', onPrintRequest);
  }, []);
  const current = state.sale,
    totals = price(current),
    customer = state.customers.find((c) => c.id === current.customer),
    paid = payments.reduce((a, p) => a + p.amount, 0),
    remaining = Math.max(0, totals.total - paid),
    selectedLine = current.lines.find((l) => l.id === selected),
    locked = now < lockedUntil;
  useEffect(() => {
    if(getRecoveryNotice())setStorageWarning(getRecoveryNotice());
    try {
      localStorage.setItem("mizan-pos-v1", JSON.stringify(state));
    } catch {
      setStorageWarning("تعذر حفظ البيانات محلياً؛ أبقِ الصفحة مفتوحة ولا تعِد تحميلها حتى تنتهي التجربة.");
    }
  }, [state]);
  useEffect(() => {
    try {
      localStorage.setItem(
        "mizan-payment-v1",
        JSON.stringify({
          saleId: current.id,
          payments: modal === "payment" ? payments : [],
        }),
      );
    } catch {setStorageWarning("تعذر حفظ الدفعات الجزئية؛ لا تعِد تحميل الصفحة أثناء الدفع.");}
  }, [payments, current.id, modal]);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 4500);
      return () => clearTimeout(t);
    }
  }, [toast]);
  useEffect(() => {
    if (!modal && !approval) barcodeInputRef.current?.focus({ preventScroll: true });
  }, [modal, approval]);
  useEffect(() => {
    let buffer = "",
      last = 0;
    function scan(e: KeyboardEvent) {
      if (modal || approval || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
        return;
      if (e.key.length === 1) barcodeInputRef.current?.focus({ preventScroll: true });
      if (e.key === "Enter" && buffer.length >= 4) {
        e.preventDefault();
        const match = findBarcode(buffer);
        if (match) addProduct(match.product,false,match);
        else openNewProduct(buffer);
        buffer = "";
        setSearch("");
      } else if (e.key.length === 1) {
        const time = Date.now();
        buffer = time - last > 120 ? e.key : buffer + e.key;
        last = time;
        e.preventDefault();
        setSearch(buffer);
      }
    }
    window.addEventListener("keydown", scan);
    return () => window.removeEventListener("keydown", scan);
  }, [modal, approval, current]);
  const update = (sale: Sale) => dispatch({ type: "sale", sale }),
    announce = (s: string) => setToast(s);
  function open(m: Modal) {
    setError("");
    setInput("");
    setAux("");
    setModal(m);
    if(m==='customer'){setNewCustomer(false);setNewCustomerPhone('');setCustomerQuery('');}
  }
  function openNewProduct(barcode = "") {
    setEditingProductId(null);
    setNewProduct(emptyNewProduct(normalizeDigits(barcode).replace(/\D/g, "")));
    open("newProduct");
  }
  function openEditProduct(product: Product) {
    setEditingProductId(product.id);
    setNewProduct({barcode:product.barcode,scaleCode:product.scaleCode||"",name:product.name,category:product.category,price:String(product.price),cost:product.cost === undefined ? "" : String(product.cost),supplier:product.supplier || "",stock:String(product.stock),minStock:String(product.minStock || 0),unit:product.unit || "piece",tax:String(product.tax),expiry:product.expiry || ""});
    open("newProduct");
  }
  function saveNewProduct() {
    const barcode = normalizeDigits(newProduct.barcode).replace(/\s/g, "");
    const scaleCode=normalizeDigits(newProduct.scaleCode).replace(/\D/g,"");
    const priceValue = Number(normalizeDigits(newProduct.price));
    const costValue = newProduct.cost ? Number(normalizeDigits(newProduct.cost)) : undefined;
    const stockValue = Number(normalizeDigits(newProduct.stock));
    const minStockValue = Number(normalizeDigits(newProduct.minStock));
    const taxValue = Number(normalizeDigits(newProduct.tax));
    if (!/^\d{4,32}$/.test(barcode)) {setError("أدخل باركوداً رقمياً من ٤ إلى ٣٢ رقماً");return;}
    if (products.some(p => p.barcode === barcode && p.id !== editingProductId)) {setError("الباركود مسجل مسبقاً");return;}
    if(scaleCode&& !/^\d{5}$/.test(scaleCode)){setError("رمز الميزان يجب أن يكون ٥ أرقام");return;}
    if(scaleCode&&products.some(p=>p.scaleCode===scaleCode&&p.id!==editingProductId)){setError("رمز الميزان مسجل مسبقاً");return;}
    if(scaleCode&&!['kg','g'].includes(newProduct.unit)){setError("رمز الميزان يتطلب وحدة وزن");return;}
    if (!newProduct.name.trim()) {setError("أدخل اسم الصنف");return;}
    if (!Number.isSafeInteger(priceValue) || priceValue < 0) {setError("أدخل سعر بيع صحيحاً");return;}
    if (costValue !== undefined && (!Number.isSafeInteger(costValue) || costValue < 0)) {setError("أدخل تكلفة صحيحة");return;}
    if (!Number.isSafeInteger(stockValue) || stockValue < 0 || !Number.isSafeInteger(minStockValue) || minStockValue < 0) {setError("أدخل مخزوناً صحيحاً");return;}
    if (!Number.isFinite(taxValue) || taxValue < 0 || taxValue > 100) {setError("أدخل ضريبة من ٠ إلى ١٠٠");return;}
    approve(`${editingProductId ? "تعديل" : "تسجيل"} صنف · ${newProduct.name.trim()}`, () => {
      try {
        const categoryInfo = categories.find(c => c.id === newProduct.category)!;
        const existing = editingProductId ? products.find(p => p.id === editingProductId) : undefined;
        const product: Product = {id:existing?.id || `custom-${uid()}`,custom:true,barcode,scaleCode:scaleCode||undefined,name:newProduct.name.trim(),category:newProduct.category,price:priceValue,cost:costValue,supplier:newProduct.supplier.trim(),stock:existing?.stock ?? stockValue,minStock:minStockValue,unit:newProduct.unit,tax:taxValue,expiry:newProduct.expiry || undefined,tone:categoryInfo.tone,discountable:true,available:existing?.available !== false};
        if (existing) {updateRegisteredProduct(product);if(stockValue!==existing.stock)changeInventory([{productId:product.id,quantity:stockValue-existing.stock}],"adjust","تعديل يدوي من إدارة الأصناف");} else registerProduct(product);
        setCatalogVersion(v => v + 1);
        setCategory(product.category);
        setSearch("");
        setModal(null);
        announce(existing ? "تم تحديث الصنف" : "تم تسجيل الصنف ويمكن مسح باركوده الآن");
      } catch (e) {setError(e instanceof Error ? e.message : "تعذر حفظ الصنف");}
    });
  }
  function receiveStock() {
    const quantity=Number(normalizeDigits(receiveQuantity));
    const product=products.find(p=>p.id===inventoryProductId);
    if(!product){setError("اختر صنفاً");return;}
    if(!Number.isSafeInteger(quantity)||quantity<=0||quantity>999999){setError("أدخل كمية استلام صحيحة");return;}
    if(!receiveSupplier.trim()){setError("أدخل اسم المورّد أو مرجع الاستلام");return;}
    approve(`استلام مخزون · ${product.name} · ${quantity}`,()=>{
      try{changeInventory([{productId:product.id,quantity}],"receive",`استلام ${new Date().toLocaleDateString('ar-IQ')}`,receiveSupplier);setCatalogVersion(v=>v+1);setReceiveQuantity("");setModal("inventory");announce("تم استلام المخزون وتسجيل الحركة");}
      catch(e){setError(e instanceof Error?e.message:"تعذر تحديث المخزون");}
    });
  }
  function close() {
    if (processing || approval || modal === "receipt") return;
    if (modal === "payment" && payments.length) {
      setError("أكمل المبلغ المتبقي قبل مغادرة الدفع");
      return;
    }
    setModal(null);
    setError("");
  }
  function approve(title: string, run: () => void) {
    setApproval({ title, run });
    setPin("");
    setError("");
  }
  function approvePin() {
    if (locked) return;
    if (pin !== "2468") {
      const n = attempts + 1;
      setAttempts(n);
      setPin("");
      setError("رمز المدير غير صحيح");
      if (n >= 3) {
        setLockedUntil(Date.now() + 30000);
        setAttempts(0);
      }
      return;
    }
    dispatch({
      type: "audit",
      action: approval!.title,
      reason: aux || "موافقة على العملية",
      manager: "المدير",
    });
    const run = approval!.run;
    setApproval(null);
    setPin("");
    setAttempts(0);
    setError("");
    run();
  }
  function addProduct(p: Product, verified = false, scan?: {priceOverride?:number;scaleWeight?:number}) {
    if (p.available === false) {
      announce("الصنف غير متوفر");
      return;
    }
    if (p.age && !verified) {
      setPendingProduct(p);
      open("age");
      return;
    }
    const old = current.lines.find(
      (l) => l.productId === p.id && !l.discount && !l.note && !l.priceOverride,
    );
    const basketQuantity=current.lines.filter(l=>l.productId===p.id).reduce((sum,l)=>sum+(l.scaleWeight||l.quantity),0);
    const adding=scan?.scaleWeight||1;
    if(basketQuantity+adding>p.stock){announce("الكمية المطلوبة أكبر من المخزون المتاح");return;}
    if(old && old.quantity>=999){announce("الحد الأقصى للصنف ٩٩٩. عدّل الكمية من السلة.");return;}
    update({
      ...current,
      lines: old && !scan?.priceOverride
        ? current.lines.map((l) =>
            l.id === old.id ? { ...l, quantity: l.quantity + 1 } : l,
          )
        : [
            ...current.lines,
            { id: uid(), productId: p.id, quantity: 1, verified,priceOverride:scan?.priceOverride,scaleWeight:scan?.scaleWeight,note:scan?.scaleWeight?`وزن ${scan.scaleWeight} كغ`:undefined },
          ],
      ageRecords: verified
        ? [
            ...current.ageRecords,
            `${p.id}:سارة حسن:${new Date().toISOString()}`,
          ]
        : current.ageRecords,
    });
    if (verified)
      dispatch({ type: "audit", action: "التحقق من العمر", reason: p.name });
    setSearch("");
  }
  function quantity(line: Line, n: number) {
    if(line.priceOverride && n!==1){announce("أعد مسح ملصق الميزان لتغيير الكمية");return;}
    if (n <= 0) {
      openQuantity(line, "0");
      return;
    }
    if (!Number.isSafeInteger(n) || n > 999) {
      announce("الكمية من ١ إلى ٩٩٩");
      return;
    }
    const product=productById(line.productId), otherQuantity=current.lines.filter(l=>l.productId===line.productId&&l.id!==line.id).reduce((sum,l)=>sum+l.quantity,0);
    if(otherQuantity+n>product.stock){announce("الكمية المطلوبة أكبر من المخزون المتاح");return;}
    update({
      ...current,
      lines: current.lines.map((l) =>
        l.id === line.id ? { ...l, quantity: n } : l,
      ),
    });
  }
  function openQuantity(line: Line, val = String(line.quantity)) {
    open("quantity");
    setSelected(line.id);
    setInput(val);
    setAux(line.note || "");
  }
  function remove(id: string) {
    update({ ...current, lines: current.lines.filter((l) => l.id !== id) });
    setSelected(null);
    announce("تم حذف الصنف");
  }
  function startPayment(isSplit = false) {
    const problem=checkoutError(state);
    if(problem){announce(problem);return;}
    if (totals.total === 0) {
      try{changeInventory(current.lines.map(l=>({productId:l.productId,quantity:-(l.scaleWeight||l.quantity)})),"sale",current.id);setCatalogVersion(v=>v+1);}catch(e){announce(e instanceof Error?e.message:"تعذر تحديث المخزون");return;}
      dispatch({ type: "complete", payments: [] });
      setReceiptId(current.id);
      setReceiptChoice(printerSettings.enabled ? "print" : "none");
      setReceiptPhase(false);
      open("receipt");
      return;
    }
    setPayments([]);
    setSplit(isSplit);
    setMethod("cash");
    setPayResult("");
    open("payment");
    setInput(String(totals.total));
  }
  function commitPayment(p: Payment) {
    const next = [...payments, p];
    setPayments(next);
    setPayResult("");
    if (next.reduce((a, p) => a + p.amount, 0) === totals.total) {
      const id = current.id;
      try{changeInventory(current.lines.map(l=>({productId:l.productId,quantity:-(l.scaleWeight||l.quantity)})),"sale",id);setCatalogVersion(v=>v+1);}catch(e){setPayResult(e instanceof Error?e.message:"تعذر تحديث المخزون");return;}
      dispatch({ type: "complete", payments: next });
      setReceiptId(id);
      setReceiptChoice(printerSettings.enabled ? "print" : "none");
      setReceiptPhase(false);
      setInput("");
      setModal("receipt");
      announce("تم الدفع بنجاح");
    } else {
      setInput(String(totals.total - next.reduce((a, p) => a + p.amount, 0)));
      announce("تم تسجيل الدفعة الجزئية");
    }
  }
  function payCash() {
    if(busyRef.current)return;
    busyRef.current=true;
    try {
      commitPayment(cashPayment(remaining, Number(input), split));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {queueMicrotask(()=>{busyRef.current=false;});}
  }
  function electronic(result: string) {
    if (busyRef.current) return;
    const amount = Number(input);
    if (
      !Number.isSafeInteger(amount) ||
      amount <= 0 ||
      amount > remaining ||
      (!split && amount !== remaining)
    ) {
      setError("أدخل مبلغاً صحيحاً ضمن المتبقي");
      return;
    }
    busyRef.current = true;
    setProcessing(true);
    setError("");
    setPayResult("جارٍ الاتصال بجهاز الدفع…");
    setTimeout(() => {
      busyRef.current = false;
      setProcessing(false);
      if (result === "approved")
        commitPayment({
          id: uid(),
          method,
          amount,
          tendered: amount,
          change: 0,
        });
      else
        setPayResult(
          result === "declined"
            ? "تم رفض البطاقة. جرّب وسيلة أخرى."
            : result === "timeout"
              ? "انتهت مهلة الاتصال. يمكنك المحاولة مجدداً."
              : "تم إلغاء محاولة الدفع",
        );
    }, 900);
  }
  function applyDiscount() {
    const v = Number(input);
    if (
      !Number.isFinite(v) || (discountKind === 'fixed' && !Number.isSafeInteger(v)) ||
      v <= 0 ||
      (discountKind === "percent" && v > 100)
    ) {
      setError("أدخل خصماً صالحاً");
      return;
    }
    const line = current.lines.find((l) => l.id === discountTarget),
      base = line
        ? productById(line.productId).price * line.quantity
        : totals.rows.filter((r) => r.eligible).reduce((sum,r) => sum+r.net+r.basketDiscount+r.reward,0);
    if(base<=0){setError("لا توجد أصناف مؤهلة للخصم");return;}
    if (v > base && discountKind === "fixed") {
      setError("الخصم أكبر من قيمة الأصناف");
      return;
    }
    if (line && !productById(line.productId).discountable) {
      setError("هذا الصنف غير قابل للخصم");
      return;
    }
    if (discountTarget === "basket" && current.coupon) {
      setError("احذف الكوبون أولاً لتطبيق خصم السلة");
      return;
    }
    const d: Discount = { kind: discountKind, value: v };
    const run = () => {
      update(
        line
          ? {
              ...current,
              lines: current.lines.map((l) =>
                l.id === line.id ? { ...l, discount: d } : l,
              ),
            }
          : { ...current, discount: d },
      );
      setModal(null);
      announce("تم تطبيق الخصم");
    };
    if ((discountKind === "percent" ? v : (100 * v) / (base || 1)) > 10)
      approve(
        `خصم ${money(discountKind === "fixed" ? v : Math.round((base * v) / 100))}`,
        run,
      );
    else run();
  }
  function saveReceipt() {
    if (receiptChoice === "print") {
      const tx = state.transactions.find(t => t.sale.id === receiptId);
      if (!tx) {
        setError("لم يُعثر على الإيصال في سجل المعاملات.");
        return;
      }
      previewPrint(salePrintReceipt(tx, printerSettings), printerSettings, tx);
    }
    if (
      receiptChoice === "email" &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)
    ) {
      setError("أدخل بريداً إلكترونياً صحيحاً");
      return;
    }
    if (receiptChoice === "sms" && !/^(07\d{9}|\+9647\d{9})$/.test(input)) {
      setError("أدخل رقماً عراقياً مثل 07701234567");
      return;
    }
    dispatch({
      type: "receipt",
      id: receiptId,
      method: receiptChoice === "print" ? "print-preview (unconfirmed)" : receiptChoice + (input ? `: ${input}` : ""),
    });
    setReceiptPhase(true);
    setError("");
  }
  const filtered = products.filter(
    (p) =>
      p.available !== false &&
      (!!search.trim() || category === "all" || p.category === category) &&
      (!search ||
        p.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()) ||
        p.barcode.includes(search) ||
        p.id.toLowerCase() === search.toLowerCase()),
  );
  const shown =
    category === "all" && !search ? filtered.slice(0, 15) : filtered;
  const categoriesPerPage = 14;
  const visibleCategories = categories.slice(0, categoriesPerPage);
  const report = buildDailyReport(state, new Date(now));
  function exportReport() {
    const url=URL.createObjectURL(new Blob([dailyReportCsv(report)],{type:'text/csv;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download=`mizan-report-${report.date}.csv`;link.click();URL.revokeObjectURL(url);
    announce('تم تجهيز ملف تقرير اليوم');
  }
  const titles: Record<Exclude<Modal, null>, string> = {
    customer: "العميل وبرنامج الولاء",
    discount: "تطبيق خصم",
    coupon: "العروض والكوبونات",
    price: "التحقق من السعر",
    newProduct: "تسجيل صنف جديد",
    products: "إدارة الأصناف",
    inventory: "المخزون وحركات الأصناف",
    reports: "تقارير اليوم",
    age: "التحقق من العمر",
    quantity: "تعديل الصنف",
    hold: "تعليق البيع",
    recall: "المبيعات المعلقة",
    cancel: "إلغاء البيع الحالي",
    payment: "إتمام الدفع",
    receipt: "إيصال البيع",
    printer: "إعدادات الطابعة الحرارية",
    settings: "الإعدادات والإدارة",
    history: "سجل المعاملات",
    refund: "استرجاع وإعادة المبلغ",
    drawer: "درج النقد",
    help: "دليل نقطة البيع",
    confirm: "تأكيد العملية",
  };
  const transaction = state.transactions.find((t) => t.sale.id === receiptId);
  const workspace = modal && workspaceOrder.includes(modal as Workspace) ? modal as Workspace : null;
  function switchWorkspace(next: Workspace) {
    if (next === "inventory") { setReceiveQuantity(""); setReceiveSupplier(""); }
    if (next === "history") setHistoryTab("sales");
    if (next !== "printer") setPrinterReturn(null);
    open(next);
  }
  function leaveWorkspace() {
    if (workspace === "printer" && printerReturn) { open(printerReturn); setPrinterReturn(null); return; }
    setModal(null);
  }
  return (
    <div className="pos-shell" dir="rtl">
      <main className="pos-main">
        <nav className="category-rail" aria-label="فئات المنتجات">
          <div className="rail-matrix">
            <div className="category-list">
              {visibleCategories.map((c) => (
                <button
                  key={c.id}
                  className={`category tone-${c.tone} ${category === c.id ? "active" : ""}`}
                  aria-pressed={category === c.id}
                  onClick={() => {
                    setCategory(c.id);
                    setSearch("");
                  }}
                >
                  <span>{c.name}</span>
                </button>
              ))}
              {Array.from({length: Math.max(0, categoriesPerPage - visibleCategories.length)}, (_, index) => <button className="category category-placeholder" aria-label="فئة غير مسماة" key={`category-placeholder-${index}`} type="button" />)}
            </div>
            <div className="rail-tools" aria-label="إجراءات نقطة البيع">
              <div className={`rail-tool-cell ${visibleCategories[0]?.id === category ? "active" : ""}`}>
                <Btn label="البحث عن منتج أو باركود" onClick={() => barcodeInputRef.current?.focus()}><Search size={20}/></Btn>
                <input
                  className="scanner-input"
                  ref={barcodeInputRef}
                  autoFocus
                  inputMode="search"
                  aria-label="البحث عن منتج أو باركود"
                  value={search}
                  onChange={(e) => setSearch(normalizeDigits(e.target.value).trimStart())}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter" || !search.trim()) return;
                    const barcodeMatch=findBarcode(search);
                    const p = barcodeMatch?.product || filtered[0];
                    if (p) addProduct(p,false,barcodeMatch || undefined);
                    else if (/^\d{4,32}$/.test(search.trim())) openNewProduct(search.trim());
                    else announce("لم يتم العثور على الصنف");
                    if (p) setSearch("");
                  }}
                />
              </div>
              <div className={`rail-tool-cell ${visibleCategories[1]?.id === category ? "active" : ""}`}><Btn label="المعاملات" onClick={() => {open("history");setHistoryTab("sales");}}><History size={20}/></Btn></div>
              <div className={`rail-tool-cell ${visibleCategories[2]?.id === category ? "active" : ""}`}><Btn label="استرجاع" onClick={() => {open("history");setHistoryTab("sales");}}><RotateCcw size={20}/></Btn></div>
              <div className={`rail-tool-cell ${visibleCategories[3]?.id === category ? "active" : ""}`}><Btn label="درج النقد" onClick={() => open("drawer")}><Banknote size={20}/></Btn></div>
              <div className={`rail-tool-cell ${visibleCategories[4]?.id === category ? "active" : ""}`}><Btn label="المساعدة" onClick={() => open("help")}><CircleHelp size={20}/></Btn></div>
              <div className={`rail-tool-cell ${visibleCategories[5]?.id === category ? "active" : ""}`}><Btn label="الإعدادات والإدارة" onClick={() => open("settings")}><SettingsIcon size={20}/></Btn></div>
              <div className="rail-tool-cell"><Btn label="سجل العمليات والاعتمادات" onClick={() => {open("history");setHistoryTab("audit");}}><ShieldCheck size={20}/></Btn></div>
              <div className="rail-tool-cell"><Btn label="إعادة بيانات التجربة" onClick={() => ask("سيتم حذف بيانات هذه النسخة التجريبية فقط. متابعة؟",()=>approve("إعادة بيانات التجربة", () => {dispatch({ type: "reset" });setModal(null);announce("تمت إعادة بيانات التجربة");}))}><RotateCcw size={20}/></Btn></div>
              <div className="rail-tool-cell" aria-hidden="true" />
              <div className="rail-tool-cell" aria-hidden="true" />
              <div className="rail-tool-cell" aria-hidden="true" />
              <div className="rail-tool-cell" aria-hidden="true" />
              <div className="rail-tool-cell" aria-hidden="true" />
              <div className="rail-tool-cell rail-page-cell" aria-hidden="true" />
            </div>
          </div>
        </nav>
        <section className="catalog" aria-label="المنتجات">
          <div className="section-heading">
            <div>
              <h1>{categories.find((c) => c.id === category)?.name}</h1>
            </div>
            <span className="item-count">{shown.length} صنف</span>
          </div>
          <div className="products-scroll">
            <div className="product-grid">
              {shown.map((p) => {
                return (
                  <button
                    key={p.id}
                    className={`product-tile tone-${p.tone}`}
                    aria-label={`إضافة ${p.name}`}
                    onClick={() => addProduct(p)}
                  >
                    <span className="product-name">{p.name}</span>
                  </button>
                );
              })}
            </div>
            {!shown.length && (
              <div className="empty">
                <Search />
                <h3>لا توجد نتائج</h3>
                <p>جرّب اسم الصنف أو رقم الباركود</p>
              </div>
            )}
          </div>
          <footer className="catalog-footer">
            <Btn label="التحقق من السعر" onClick={() => {setCheckedProduct(null);setCheckedScale(null);open("price");}}><ScanBarcode size={20}/></Btn>
            <Btn label="العروض والكوبونات" onClick={() => open("coupon")}><Ticket size={20}/></Btn>
            <Btn label="تعليق" disabled={!current.lines.length} onClick={() => {open("hold");setInput(current.note);}}><Pause size={20}/></Btn>
            <Btn label="استدعاء" onClick={() => open("recall")}><Undo2 size={20}/></Btn>
          </footer>
        </section>
        <aside className="basket" aria-label="سلة البيع">
          <div className="order-header">
            <div>
              <span className="eyebrow">السلة</span>
              <h2 dir="ltr">
                #{current.id}
              </h2>
            </div>
          </div>
          <div className="service-tabs" role="group" aria-label="نوع البيع">
            <button
              aria-pressed={current.service === "takeaway"}
              className={current.service === "takeaway" ? "active" : ""}
              onClick={() => update({ ...current, service: "takeaway" })}
            >
              مفرد
            </button>
            <button
              aria-pressed={current.service === "dinein"}
              className={current.service === "dinein" ? "active" : ""}
              onClick={() => update({ ...current, service: "dinein" })}
            >
              جملة
            </button>
          </div>
          <button
            className="customer-bar"
            onClick={() => {
              setNewCustomer(false);
              setCustomerQuery("");
              open("customer");
            }}
          >
            <UserRound size={18} />
            <span>
              {customer ? customer.name : "إضافة عميل / بطاقة ولاء"}
              {customer && (
                <small>
                  {customer.points} نقطة · {customer.tier}
                </small>
              )}
            </span>
            <Plus size={17} />
          </button>
          <div className="basket-lines" role="region" aria-label="أصناف السلة" tabIndex={0}>
            {!current.lines.length ? (
              <div className="empty">
                <ShoppingBag size={32} />
                <h3>السلة فارغة</h3>
              </div>
            ) : (
              current.lines.map((l) => {
                const p = productById(l.productId),
                  row = totals.rows.find((r) => r.id === l.id)!;
                return (
                  <div
                    className={`basket-line ${selected === l.id ? "selected" : ""}`}
                    key={l.id}
                  >
                    <div className="line-main">
                      <button
                        className="line-name"
                        onClick={() =>
                          setSelected(selected === l.id ? null : l.id)
                        }
                      >
                        <span className={`line-color tone-${p.tone}`} />
                        <b className="line-quantity">{l.quantity}</b>
                        <span>
                          {p.name}
                          {p.age && <ShieldCheck size={12} />}
                        </span>
                      </button>
                      <div className="line-summary">
                        <strong>{amountText(row.net)}</strong>
                        <button
                          className="line-remove"
                          aria-label={`حذف ${p.name} من السلة`}
                          onClick={() => remove(l.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    {(row.itemDiscount > 0 || row.promo > 0) && (
                      <div className="line-saving">
                        توفير {money(row.itemDiscount + row.promo)}
                      </div>
                    )}
                    {l.note && <small className="muted">{l.note}</small>}
                    <div className="line-controls">
                      <div className="stepper">
                        <button
                          aria-label={`تقليل ${p.name}`}
                          onClick={() => quantity(l, l.quantity - 1)}
                        >
                          <Minus size={14} />
                        </button>
                        <button
                          aria-label={`تغيير كمية ${p.name}`}
                          onClick={() => openQuantity(l)}
                        >
                          {l.quantity}
                        </button>
                        <button
                          aria-label={`زيادة ${p.name}`}
                          onClick={() => quantity(l, l.quantity + 1)}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button
                        className="line-edit"
                        aria-label={`خصم ${p.name}`}
                        onClick={() => {
                          open("discount");
                          setDiscountTarget(l.id);
                        }}
                      >
                        <Percent size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="checkout">
            {(totals.itemDiscount > 0 || totals.promotions > 0 || totals.basketDiscount > 0 || totals.reward > 0) && <div className="totals">
              {totals.itemDiscount > 0 && (
                <div className="saving">
                  <span>خصم الأصناف</span>
                  <span>− {money(totals.itemDiscount)}</span>
                </div>
              )}
              {totals.promotions > 0 && (
                <div className="saving">
                  <span>العروض التلقائية</span>
                  <span>− {money(totals.promotions)}</span>
                </div>
              )}
              {totals.basketDiscount > 0 && (
                <div className="saving">
                  <button
                    onClick={() =>
                      update({
                        ...current,
                        discount: undefined,
                        coupon: undefined,
                      })
                    }
                  >
                    خصم السلة <X size={12} />
                  </button>
                  <span>− {money(totals.basketDiscount)}</span>
                </div>
              )}
              {totals.reward > 0 && (
                <div className="saving">
                  <span>مكافأة الولاء</span>
                  <span>− {money(totals.reward)}</span>
                </div>
              )}
            </div>}
            <div className="grand-total">
              <span>الإجمالي</span>
              <strong data-testid="grand-total"><span>{amountText(totals.total)}</span> <small>د.ع.</small></strong>
            </div>
            <div className="checkout-secondary">
              <Btn
                disabled={!current.lines.length}
                onClick={() => {
                  open("discount");
                  setDiscountTarget("basket");
                }}
              >
                خصم
              </Btn>
              <Btn
                disabled={!current.lines.length}
                onClick={() => startPayment(true)}
              >
                تقسيم الدفع
              </Btn>
            </div>
            <Btn
              variant="pay"
              disabled={!current.lines.length}
              onClick={() => startPayment()}
            >
              الدفع
            </Btn>
          </div>
        </aside>
      </main>
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          {toast}
        </div>
      )}
      {storageWarning && <div className="storage-warning" role="alert">{storageWarning}</div>}
      <Dialog.Root
        open={modal !== null || approval !== null}
        onOpenChange={(v) => {
          if (!v) {if(printDocument) setPrintDocument(""); else close();}
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className={`dialog-overlay ${workspace ? "workspace-overlay" : ""}`} />
          <Dialog.Content
            className={`dialog-content ${workspace && !approval && !printDocument ? "workspace-shell" : ""} ${printDocument ? "thermal-dialog" : modal === "payment" && !approval ? "payment-dialog" : modal === "newProduct" ? "management-dialog" : ""}`}
            dir="rtl"
            onEscapeKeyDown={(e) => {
              if (
                approval ||
                modal === "receipt" ||
                processing ||
                (modal === "payment" && payments.length)
              )
                e.preventDefault();
            }}
            onPointerDownOutside={(e) => {
              if (
                approval ||
                modal === "receipt" ||
                processing ||
                (modal === "payment" && payments.length)
              )
                e.preventDefault();
            }}
          >
            <div className="dialog-header">
              <div>
                <Dialog.Title>
                  {printDocument ? "معاينة الطباعة الحرارية" : approval ? "موافقة المدير" : modal ? titles[modal] : ""}
                </Dialog.Title>
              </div>
              {!processing && modal !== "receipt" && (
                <Btn
                  label={workspace && !approval && !printDocument ? "العودة إلى شاشة البيع" : "إغلاق"}
                  onClick={() => (printDocument ? setPrintDocument("") : approval ? setApproval(null) : workspace ? leaveWorkspace() : close())}
                >
                  {workspace && !approval && !printDocument ? <><ArrowRight size={20}/><span>البيع</span></> : <X size={20} />}
                </Btn>
              )}
            </div>
            {workspace && !approval && !printDocument && (
              <nav className="workspace-tabs" aria-label="أقسام الإدارة">
                {workspaceTabs.map(({id,label,icon:Icon}) => <button key={id} type="button" className={workspace===id ? "active" : ""} aria-current={workspace===id ? "page" : undefined} onClick={()=>switchWorkspace(id)}><Icon size={19}/><span>{label}</span></button>)}
              </nav>
            )}
            <div className="dialog-body">
              {printDocument && <div className="thermal-preview"><Btn variant="full" onClick={() => setPrintDocument("")}>رجوع من معاينة الطباعة</Btn><iframe title="معاينة الإيصال الحراري" srcDoc={printDocument}/></div>}
              <div className="dialog-regular" hidden={!!printDocument}>
              {modal==='confirm'&&confirmation&&!approval&&<><p>{confirmation.title}</p>{confirmation.reason&&<Field label="السبب" value={aux} onChange={setAux}/>}<Btn variant="primary full" disabled={confirmation.reason&&!aux.trim()} onClick={()=>confirmation.run(aux)}>تأكيد المتابعة</Btn><Btn variant="full" onClick={()=>setModal(null)}>رجوع</Btn></>}
              {approval ? (
                <>
                  <div className="approval-icon">
                    <ShieldCheck size={35} />
                  </div>
                  <p>أدخل رمز المدير لاعتماد هذه العملية</p>
                  <input
                    className="pin-input"
                    aria-label="رمز المدير"
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(normalizeDigits(e.target.value))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") approvePin();
                    }}
                    autoFocus
                  />
                  <Numpad value={pin} onChange={(v) => setPin(v.slice(0, 4))} />
                  {locked && (
                    <p role="status">
                      المحاولة التالية بعد{" "}
                      {Math.ceil((lockedUntil - now) / 1000)} ثانية
                    </p>
                  )}
                  <Btn
                    variant="primary full"
                    disabled={locked || pin.length !== 4}
                    onClick={approvePin}
                  >
                    اعتماد العملية
                  </Btn>
                </>
              ) : (
                <>
                  {modal === "newProduct" && (
                    <>
                      <p>{editingProductId ? "عدّل بيانات الصنف ثم احفظ التغييرات." : "امسح باركود الصنف أو أدخله، ثم أكمل البيانات."} يتطلب الحفظ موافقة المدير.</p>
                      <div className="new-product-grid">
                        <label>الباركود<input autoFocus inputMode="numeric" value={newProduct.barcode} onChange={e=>setNewProduct(v=>({...v,barcode:normalizeDigits(e.target.value).replace(/\D/g,'')}))}/></label>
                        <label>رمز الميزان (٥ أرقام)<input inputMode="numeric" placeholder="مثال: 12345" value={newProduct.scaleCode} onChange={e=>setNewProduct(v=>({...v,scaleCode:normalizeDigits(e.target.value).replace(/\D/g,'').slice(0,5)}))}/></label>
                        {newProduct.barcode&&products.some(p=>p.barcode===newProduct.barcode&&p.id!==editingProductId)&&<div className="duplicate-product new-product-wide" role="alert"><strong>هذا الباركود مسجل بالفعل</strong><span>{products.find(p=>p.barcode===newProduct.barcode)!.name} · {money(products.find(p=>p.barcode===newProduct.barcode)!.price)}</span></div>}
                        <label>اسم الصنف<input maxLength={120} value={newProduct.name} onChange={e=>setNewProduct(v=>({...v,name:e.target.value}))}/></label>
                        <label>الفئة<select value={newProduct.category} onChange={e=>setNewProduct(v=>({...v,category:e.target.value}))}>{categories.filter(c=>c.id!=="all").map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
                        <label>الوحدة<select value={newProduct.unit} onChange={e=>setNewProduct(v=>({...v,unit:e.target.value as NewProductDraft['unit']}))}><option value="piece">قطعة</option><option value="kg">كيلوغرام</option><option value="g">غرام</option><option value="l">لتر</option><option value="ml">ملليلتر</option></select></label>
                        <label>سعر البيع<input inputMode="numeric" value={newProduct.price} onChange={e=>setNewProduct(v=>({...v,price:normalizeDigits(e.target.value).replace(/\D/g,'')}))}/></label>
                        <label>التكلفة<input inputMode="numeric" value={newProduct.cost} onChange={e=>setNewProduct(v=>({...v,cost:normalizeDigits(e.target.value).replace(/\D/g,'')}))}/></label>
                        <label>المخزون الابتدائي<input inputMode="numeric" value={newProduct.stock} onChange={e=>setNewProduct(v=>({...v,stock:normalizeDigits(e.target.value).replace(/\D/g,'')}))}/></label>
                        <label>حد المخزون المنخفض<input inputMode="numeric" value={newProduct.minStock} onChange={e=>setNewProduct(v=>({...v,minStock:normalizeDigits(e.target.value).replace(/\D/g,'')}))}/></label>
                        <label>الضريبة %<input inputMode="decimal" value={newProduct.tax} onChange={e=>setNewProduct(v=>({...v,tax:normalizeDigits(e.target.value).replace(/[^\d.]/g,'')}))}/></label>
                        <label>تاريخ الانتهاء<input type="date" value={newProduct.expiry} onChange={e=>setNewProduct(v=>({...v,expiry:e.target.value}))}/></label>
                        <label className="new-product-wide">المورّد<input maxLength={120} value={newProduct.supplier} onChange={e=>setNewProduct(v=>({...v,supplier:e.target.value}))}/></label>
                      </div>
                      <Btn variant="primary full" onClick={saveNewProduct}>{editingProductId ? "حفظ التعديلات" : "حفظ الصنف"} · موافقة المدير</Btn>
                    </>
                  )}
                  {modal === "products" && (
                    <>
                      <div className="product-manager-summary"><span>{products.length} صنف</span><span>{products.filter(p=>p.custom).length} مسجل محلياً</span><span>{products.filter(p=>p.stock <= (p.minStock || 0)).length} منخفض المخزون</span></div>
                      <Btn variant="primary full" onClick={()=>openNewProduct()}>تسجيل صنف جديد</Btn>
                      <div className="managed-products">
                        {products.map(product=>{
                          const low=product.stock <= (product.minStock || 0);
                          const expiring=!!product.expiry && new Date(product.expiry+'T00:00:00').getTime() <= Date.now()+30*86400000;
                          const used=current.lines.some(l=>l.productId===product.id)||state.transactions.some(t=>t.sale.lines.some(l=>l.productId===product.id));
                          return <article className={`managed-product ${product.available===false?'disabled':''}`} key={product.id}>
                            <div><strong>{product.name}</strong><small>{product.barcode} · {money(product.price)}</small><div className="product-flags">{low&&<span>مخزون منخفض</span>}{expiring&&<span>انتهاء قريب</span>}{product.available===false&&<span>موقوف</span>}{!product.custom&&<span>صنف تجريبي</span>}</div></div>
                            <div className="managed-product-actions"><Btn disabled={!printerSettings.enabled} onClick={()=>previewProductLabel(product)}>ملصق</Btn>{product.custom&&<><Btn onClick={()=>openEditProduct(product)}>تعديل</Btn><Btn onClick={()=>approve(`${product.available===false?'تفعيل':'إيقاف'} الصنف · ${product.name}`,()=>{updateRegisteredProduct({...product,available:product.available===false});setCatalogVersion(v=>v+1);setModal('products');announce(product.available===false?'تم تفعيل الصنف':'تم إيقاف الصنف');})}>{product.available===false?'تفعيل':'إيقاف'}</Btn><Btn variant="danger" disabled={used} onClick={()=>approve(`حذف الصنف · ${product.name}`,()=>{deleteRegisteredProduct(product.id);setCatalogVersion(v=>v+1);setModal('products');announce('تم حذف الصنف');})}>حذف</Btn></>}</div>
                          </article>;
                        })}
                      </div>
                      <p className="muted">لا يمكن حذف صنف مستخدم في سلة أو معاملة؛ أوقفه بدلاً من ذلك.</p>
                    </>
                  )}
                  {modal === "inventory" && (
                    <>
                      <div className="inventory-receive">
                        <label>الصنف<select value={inventoryProductId} onChange={e=>setInventoryProductId(e.target.value)}>{products.filter(p=>p.available!==false).map(p=><option key={p.id} value={p.id}>{p.name} · {p.stock}</option>)}</select></label>
                        <label>الكمية المستلمة<input inputMode="numeric" value={receiveQuantity} onChange={e=>setReceiveQuantity(normalizeDigits(e.target.value).replace(/\D/g,''))}/></label>
                        <label>المورّد / مرجع الاستلام<input value={receiveSupplier} onChange={e=>setReceiveSupplier(e.target.value)} maxLength={120}/></label>
                        <Btn variant="primary" onClick={receiveStock}>استلام وإضافة للمخزون</Btn>
                      </div>
                      <h3 className="inventory-heading">حالة المخزون</h3>
                      <div className="inventory-stock-list">{products.map(p=><div key={p.id}><span>{p.name}</span><strong className={p.stock<=(p.minStock||0)?'stock-low':''}>{p.stock}</strong></div>)}</div>
                      <h3 className="inventory-heading">آخر الحركات</h3>
                      <div className="inventory-movements">{inventoryMovements().map(m=><div key={m.id}><span><strong>{productById(m.productId)?.name || m.productId}</strong><small>{({sale:'بيع',refund:'استرجاع',void:'إلغاء معاملة',receive:'استلام',adjust:'تسوية'} as const)[m.type]} · {m.reference}{m.supplier?` · ${m.supplier}`:''}</small></span><b className={m.delta>0?'movement-in':'movement-out'}>{m.delta>0?'+':''}{m.delta}</b><small>الرصيد {m.balance}</small></div>)}{!inventoryMovements().length&&<p className="muted">لا توجد حركات مخزون بعد.</p>}</div>
                    </>
                  )}
                  {modal === "quantity" && selectedLine && (
                    <>
                      <h3>{productById(selectedLine.productId).name}</h3>
                      <Field label="الكمية" value={input} onChange={setInput} />
                      <Numpad value={input} onChange={setInput} />
                      <Field
                        label="ملاحظة على الصنف"
                        value={aux}
                        onChange={setAux}
                      />
                      <Btn
                        variant={input === "0" ? "danger full" : "primary full"}
                        onClick={() => {
                          const n = Number(input);
                          if (input === "0") {
                            remove(selectedLine.id);
                            setModal(null);
                          } else if (Number.isInteger(n) && n > 0 && n <= 999) {
                            update({
                              ...current,
                              lines: current.lines.map((l) =>
                                l.id === selectedLine.id
                                  ? { ...l, quantity: n, note: aux }
                                  : l,
                              ),
                            });
                            setModal(null);
                          } else setError("أدخل كمية من ١ إلى ٩٩٩");
                        }}
                      >
                        {input === "0" ? "تأكيد حذف الصنف" : "حفظ التعديل"}
                      </Btn>
                    </>
                  )}
                  {modal === "price" && (
                    <>
                      <Field
                        label="اسم الصنف أو الباركود"
                        value={input}
                        onChange={(v) => {
                          setInput(v);
                          const match=findBarcode(v);setCheckedProduct(match?.product||null);setCheckedScale(match);
                        }}
                        placeholder="100001"
                      />
                      {checkedProduct ? (
                        <div
                          className={`price-result tone-${checkedProduct.tone}`}
                        >
                          <ScanBarcode size={32} />
                          <h2>{checkedProduct.name}</h2>
                          <strong>{money(checkedScale?.priceOverride ?? checkedProduct.price)}</strong>
                          {checkedScale?.scaleWeight&&<p>وزن الملصق: {checkedScale.scaleWeight} كغ</p>}
                          <p>ضريبة ١٠٪ · متوفر</p>
                          {checkedProduct.id === "p10" && (
                            <p>عرض: عبوتان بسعر واحدة</p>
                          )}
                          <Btn
                            onClick={() => {
                              setCheckedProduct(null);
                              setCheckedScale(null);
                              setInput("");
                            }}
                          >
                            فحص صنف آخر
                          </Btn>
                        </div>
                      ) : (
                        <div className="choice-list">
                          {products
                            .filter(
                              (p) =>
                                input &&
                                (p.name.includes(input) ||
                                  p.barcode.includes(input)),
                            )
                            .map((p) => (
                              <button
                                key={p.id}
                                onClick={() => {setCheckedProduct(p);setCheckedScale(null);}}
                              >
                                <span>{p.name}</span>
                                <strong>{money(p.price)}</strong>
                              </button>
                            ))}
                          {input &&
                            !products.some(
                              (p) =>
                                p.name.includes(input) ||
                                p.barcode.includes(input),
                            ) && <><p>الباركود غير معروف</p>{/^\d{4,32}$/.test(input)&&<Btn variant="full" onClick={()=>openNewProduct(input)}>تسجيل هذا الباركود كصنف جديد</Btn>}</>}
                        </div>
                      )}
                      <p className="muted">
                        فحص السعر لا يضيف الصنف إلى السلة.
                      </p>
                    </>
                  )}
                  {modal === "age" && pendingProduct && (
                    <>
                      <div className="approval-icon">
                        <ShieldCheck size={36} />
                      </div>
                      <h3>{pendingProduct.name}</h3>
                      <p>
                        الحد الأدنى المحدد: {pendingProduct.age} سنة. افحص هوية
                        العميل قبل متابعة البيع.
                      </p>
                      <Btn
                        variant="primary full"
                        onClick={() => {
                          addProduct(pendingProduct, true);
                          setModal(null);
                        }}
                      >
                        تم التحقق من الهوية
                      </Btn>
                      <Btn
                        variant="full"
                        onClick={() =>
                          approve("تجاوز التحقق من العمر", () => {
                            addProduct(pendingProduct, true);
                            setModal(null);
                          })
                        }
                      >
                        طلب موافقة المدير
                      </Btn>
                      <Btn
                        variant="danger full"
                        onClick={() => {
                          dispatch({
                            type: "audit",
                            action: "رفض بيع مقيد",
                            reason: pendingProduct.name,
                          });
                          setModal(null);
                          announce("تم رفض بيع الصنف");
                        }}
                      >
                        رفض البيع
                      </Btn>
                    </>
                  )}
                  {modal === "discount" && (
                    <>
                      <label className="field">
                        <span>نطاق الخصم</span>
                        <select
                          value={discountTarget}
                          onChange={(e) => setDiscountTarget(e.target.value)}
                        >
                          <option value="basket">السلة بالكامل</option>
                          {current.lines.map((l) => (
                            <option key={l.id} value={l.id}>
                              {productById(l.productId).name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="segment">
                        <button
                          className={discountKind === "percent" ? "active" : ""}
                          onClick={() => setDiscountKind("percent")}
                        >
                          نسبة مئوية %
                        </button>
                        <button
                          className={discountKind === "fixed" ? "active" : ""}
                          onClick={() => setDiscountKind("fixed")}
                        >
                          مبلغ ثابت · د.ع
                        </button>
                      </div>
                      <Field
                        label="قيمة الخصم"
                        value={input}
                        onChange={setInput}
                      />
                      <Numpad value={input} onChange={setInput} />
                      <p className="muted">
                        الخصم فوق ١٠٪ يتطلب موافقة المدير.
                      </p>
                      <Btn variant="primary full" onClick={applyDiscount}>
                        تطبيق الخصم
                      </Btn>
                      <Btn
                        variant="full"
                        onClick={() => {
                          update(
                            discountTarget === "basket"
                              ? {
                                  ...current,
                                  discount: undefined,
                                  coupon: undefined,
                                }
                              : {
                                  ...current,
                                  lines: current.lines.map((l) =>
                                    l.id === discountTarget
                                      ? { ...l, discount: undefined }
                                      : l,
                                  ),
                                },
                          );
                          setModal(null);
                        }}
                      >
                        إزالة الخصم
                      </Btn>
                    </>
                  )}
                  {modal === "coupon" && (
                    <>
                      <div className="promo-card">
                        <Ticket />
                        <div>
                          <h3>عبوتا عصير بسعر واحدة</h3>
                          <p>يُطبّق تلقائياً · JUICE2</p>
                        </div>
                        <Stamp>نشط</Stamp>
                      </div>
                      <div className="promo-card">
                        <Percent />
                        <div>
                          <h3>خصم ترحيبي ١٠٪</h3>
                          <p>WELCOME10 · الأصناف المؤهلة فقط</p>
                        </div>
                      </div>
                      <div className="promo-card">
                        <Coffee />
                        <div>
                          <h3>٥٬٠٠٠ د.ع على الحلويات</h3>
                          <p>DESSERT5 · عند شراء حلويات بـ ٢٠٬٠٠٠ د.ع</p>
                        </div>
                      </div>
                      <Field
                        label="رمز الكوبون"
                        value={input}
                        onChange={(v) => setInput(v.trim().toUpperCase())}
                        placeholder="WELCOME10"
                      />
                      <Btn
                        variant="primary full"
                        onClick={() => {
                          const e = couponError(input, current);
                          if (e) setError(e);
                          else {
                            update({ ...current, coupon: input });
                            setModal(null);
                            announce("تم تطبيق الكوبون");
                          }
                        }}
                      >
                        تطبيق الكوبون
                      </Btn>
                      {current.coupon && (
                        <Btn
                          variant="full"
                          onClick={() => {
                            update({ ...current, coupon: undefined });
                            setModal(null);
                          }}
                        >
                          إزالة {current.coupon}
                        </Btn>
                      )}
                    </>
                  )}
                  {modal === "customer" && (
                    <>
                      {customer && (
                        <div className="customer-profile">
                          <span className="avatar">{customer.name[0]}</span>
                          <div>
                            <h3>{customer.name}</h3>
                            <p>
                              {customer.tier} · {customer.points} نقطة
                            </p>
                          </div>
                          <Btn
                            onClick={() => {
                              update({
                                ...current,
                                customer: undefined,
                                reward: false,
                              });
                              announce("تم فصل العميل");
                            }}
                          >
                            فصل
                          </Btn>
                        </div>
                      )}
                      {customer && (
                        <>
                          <Btn
                            variant="full"
                            disabled={
                              !current.reward && (customer.points < 500 || totals.rows.filter(r=>r.eligible).reduce((sum,r)=>sum+r.net,0)<5000)
                            }
                            onClick={() => {
                              if (current.reward)
                                update({ ...current, reward: false });
                              else ask("استبدال ٥٠٠ نقطة بخصم ٥٬٠٠٠ د.ع؟",()=>{update({...current,reward:true});setModal('customer')});
                            }}
                          >
                            {current.reward
                              ? "إلغاء المكافأة"
                              : "استبدال ٥٠٠ نقطة · خصم ٥٬٠٠٠ د.ع"}
                          </Btn>
                          <div className="flex gap-2">
                            <input
                              aria-label="رصيد النقاط الجديد"
                              placeholder="رصيد النقاط الجديد"
                              value={aux}
                              onChange={(e) => setAux(normalizeDigits(e.target.value))}
                            />
                            <Btn
                              onClick={() => {
                                const n = Number(aux);
                                if (!aux.trim() || !Number.isSafeInteger(n) || n < 0 || n>999999999) {
                                  setError("أدخل رصيداً صالحاً");
                                  return;
                                }
                                approve("تعديل رصيد الولاء", () =>
                                  dispatch({
                                    type: "customer",
                                    customer: { ...customer, points: n },
                                  }),
                                );
                              }}
                            >
                              تعديل النقاط
                            </Btn>
                          </div>
                        </>
                      )}
                      <Field
                        label="بحث بالاسم أو الهاتف أو بطاقة الولاء"
                        value={customerQuery}
                        onChange={setCustomerQuery}
                      />
                      <div className="choice-list">
                        {state.customers
                          .filter((c) =>
                            [c.name, c.phone, c.card].some((v) =>
                              v.includes(customerQuery),
                            ),
                          )
                          .map((c) => (
                            <button
                              key={c.id}
                              onClick={() => {
                                update({
                                  ...current,
                                  customer: c.id,
                                  reward: false,
                                });
                                setModal(null);
                                announce(`تم إرفاق ${c.name}`);
                              }}
                            >
                              <span>
                                {c.name}
                                <small dir="ltr">
                                  {c.phone} · {c.card}
                                </small>
                              </span>
                              <Stamp>{c.points} نقطة</Stamp>
                            </button>
                          ))}
                      </div>
                      <Btn
                        variant="full"
                        onClick={() => setNewCustomer(!newCustomer)}
                      >
                        <Plus size={17} /> عميل جديد
                      </Btn>
                      {newCustomer && (
                        <>
                          <Field
                            label="اسم العميل"
                            value={input}
                            onChange={setInput}
                          />
                          <Field
                            label="رقم الهاتف"
                            value={newCustomerPhone}
                            onChange={setNewCustomerPhone}
                            placeholder="07701234567"
                          />
                          <Btn
                            variant="primary full"
                            onClick={() => {
                              if (
                                !input.trim() ||
                                !/^07\d{9}$/.test(normalizePhone(newCustomerPhone))
                              ) {
                                setError("أدخل الاسم ورقم هاتف عراقياً صحيحاً");
                                return;
                              }
                              if(state.customers.some(c=>normalizePhone(c.phone)===normalizePhone(newCustomerPhone))){setError("رقم الهاتف مسجل. ابحث عن العميل لإرفاقه.");return;}
                              const c: Customer = {
                                id: uid(),
                                name: input.trim(),
                                phone: normalizePhone(newCustomerPhone),
                                points: 0,
                                tier: "جديد",
                                card: String(Date.now()),
                              };
                              dispatch({ type: "customer", customer: c });
                              update({
                                ...current,
                                customer: c.id,
                                reward: false,
                              });
                              setModal(null);
                            }}
                          >
                            حفظ وإرفاق العميل
                          </Btn>
                        </>
                      )}
                    </>
                  )}
                  {modal === "hold" && (
                    <>
                      <p>
                        سيتم حفظ {totals.count} أصناف بقيمة{" "}
                        {money(totals.total)}.
                      </p>
                      <Field
                        label="اسم أو ملاحظة للطلب"
                        value={input}
                        onChange={setInput}
                      />
                      <Btn
                        variant="primary full"
                        onClick={() => {
                          dispatch({
                            type: "sale",
                            sale: { ...current, note: input },
                          });
                          dispatch({ type: "hold" });
                          setModal(null);
                          announce("تم تعليق البيع");
                        }}
                      >
                        <Pause size={18} /> تعليق البيع
                      </Btn>
                    </>
                  )}
                  {modal === "recall" && (
                    <>
                      {!state.held.length ? (
                        <div className="empty">
                          <FolderOpen />
                          <h3>لا توجد مبيعات معلقة</h3>
                        </div>
                      ) : (
                        <>
                          <Field
                            label="بحث بالرقم أو العميل أو الملاحظة"
                            value={input}
                            onChange={setInput}
                          />
                          <div className="choice-list">
                            {state.held
                              .filter((s) =>
                                [
                                  s.id,
                                  s.note,
                                  state.customers.find(
                                    (c) => c.id === s.customer,
                                  )?.name || "",
                                ].some((v) => v.includes(input)),
                              )
                              .map((s) => (
                                <button
                                  key={s.id}
                                  onClick={() => {
                                    const recall=()=>{dispatch({type:'recall',id:s.id});setModal(null);announce('تم استدعاء البيع')};
                                    if(current.lines.length)ask('سيتم تعليق السلة الحالية واستدعاء الطلب المحدد. متابعة؟',recall);else recall();
                                  }}
                                >
                                  <span>
                                    #{s.id} · {s.note || "طلب معلق"}
                                    <small>
                                      {price(s).count} أصناف ·{" "}
                                      {new Date(s.createdAt).toLocaleTimeString(
                                        "ar-IQ",
                                      )}
                                    </small>
                                  </span>
                                  <strong>{money(price(s).total)}</strong>
                                </button>
                              ))}
                          </div>
                        </>
                      )}
                    </>
                  )}
                  {modal === "cancel" && (
                    <>
                      <p>
                        إلغاء الطلب #{current.id} بقيمة {money(totals.total)}.
                      </p>
                      <Field
                        label="سبب الإلغاء"
                        value={aux}
                        onChange={setAux}
                      />
                      <Btn
                        variant="danger full"
                        disabled={!aux.trim()}
                        onClick={() => {
                          const run = () => {
                            dispatch({ type: "cancel", reason: aux });
                            setModal(null);
                            announce("تم إلغاء البيع");
                          };
                          if (
                            current.ageRecords.length ||
                            current.discount ||
                            current.coupon ||
                            current.reward ||
                            current.lines.some((l) => l.discount)
                          )
                            approve("إلغاء بيع حساس", run);
                          else run();
                        }}
                      >
                        تأكيد إلغاء البيع
                      </Btn>
                    </>
                  )}
                  {modal === "payment" && (
                    <>
                      <div className="payment-summary">
                        <span>
                          {split ? "المتبقي للدفع" : "المبلغ المطلوب"}
                        </span>
                        <strong>{money(remaining)}</strong>
                        {paid > 0 && <small>المدفوع {money(paid)}</small>}
                      </div>
                      <div className="payment-layout">
                        <div>
                          <div className="payment-methods">
                            {(["cash", "card", "contactless"] as const).map(
                              (m) => (
                                <button
                                  key={m}
                                  disabled={processing}
                                  className={method === m ? "active" : ""}
                                  onClick={() => {
                                    setMethod(m);
                                    setPayResult("");
                                    setError("");
                                    setInput(String(remaining));
                                  }}
                                >
                                  {m === "cash" ? (
                                    <Banknote />
                                  ) : m === "card" ? (
                                    <CreditCard />
                                  ) : (
                                    <Smartphone />
                                  )}
                                  {methods[m]}
                                </button>
                              ),
                            )}
                          </div>
                          <label className="check-row">
                            <input
                              type="checkbox"
                              checked={split}
                              disabled={payments.length > 0 || processing}
                              onChange={(e) => setSplit(e.target.checked)}
                            />{" "}
                            تقسيم المبلغ بين عدة وسائل
                          </label>
                          {payments.map((p) => (
                            <div className="payment-record" key={p.id}>
                              <Check size={15} />
                              {methods[p.method]}
                              <strong>{money(p.amount)}</strong>
                            </div>
                          ))}
                          <p className="muted">
                            الدفع محاكاة محلية. لا تُدخل بيانات بطاقة حقيقية.
                          </p>
                          {payResult && (
                            <p role="status" className="payment-result">
                              {payResult}
                            </p>
                          )}
                        </div>
                        <div>
                          <Field
                            label={
                              method === "cash"
                                ? "المبلغ المستلم نقداً"
                                : "مبلغ الدفعة"
                            }
                            value={input}
                            onChange={(v) => {
                              if (!processing) setInput(v);
                            }}
                          />
                          <Numpad
                            value={input}
                            onChange={(v) => {
                              if (!processing) setInput(v);
                            }}
                          />
                          {method === "cash" ? (
                            <>
                              <div className="quick-cash">
                                {[remaining, 25000, 50000, 100000]
                                  .filter((v, i, a) => a.indexOf(v) === i)
                                  .map((v) => (
                                    <button
                                      key={v}
                                      onClick={() => setInput(String(v))}
                                    >
                                      {v === remaining
                                        ? "المبلغ بالضبط"
                                        : money(v)}
                                    </button>
                                  ))}
                              </div>
                              <div className="change-due">
                                <span>
                                  {Number(input) >= remaining
                                    ? "الباقي للعميل"
                                    : "المتبقي"}
                                </span>
                                <strong>
                                  {money(
                                    Math.abs((Number.isFinite(Number(input)) ? Number(input) : 0) - remaining),
                                  )}
                                </strong>
                              </div>
                              <Btn variant="pay full" onClick={payCash}>
                                <Check size={20} />{" "}
                                {split
                                  ? "تسجيل الدفعة النقدية"
                                  : "تأكيد الدفع النقدي"}
                              </Btn>
                            </>
                          ) : (
                            <>
                              <Btn
                                variant="pay full"
                                disabled={processing}
                                onClick={() => electronic("approved")}
                              >
                                {processing
                                  ? "جارٍ المعالجة…"
                                  : "محاكاة موافقة الدفع"}
                              </Btn>
                              <div className="flex gap-2">
                                <Btn
                                  disabled={processing}
                                  onClick={() => electronic("declined")}
                                >
                                  رفض
                                </Btn>
                                <Btn
                                  disabled={processing}
                                  onClick={() => electronic("timeout")}
                                >
                                  انتهاء المهلة
                                </Btn>
                                <Btn
                                  disabled={processing}
                                  onClick={() => electronic("cancelled")}
                                >
                                  إلغاء المحاولة
                                </Btn>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                  {modal === "receipt" && (
                    <>
                      <div className="success-mark">
                        <Check size={35} />
                      </div>
                      <div className="receipt-summary">
                        <h2>{money(transaction?.total || 0)}</h2>
                        <p>الطلب #{receiptId} · تمت العملية</p>
                        {transaction?.payments.some((p) => p.change > 0) && (
                          <strong>
                            الباقي للعميل:{" "}
                            {money(
                              transaction.payments.reduce(
                                (s, p) => s + p.change,
                                0,
                              ),
                            )}
                          </strong>
                        )}
                      </div>
                      {drawerOpen && (
                        <div className="drawer-banner">
                          <Banknote /> تمت محاكاة نبضة درج النقد
                          <Btn
                            onClick={() => {
                              setDrawerOpen(false);
                              dispatch({
                                type: "audit",
                                action: "إغلاق درج النقد",
                                reason: "تأكيد الكاشير",
                              });
                            }}
                          >
                            تأكيد الإغلاق
                          </Btn>
                        </div>
                      )}
                      {!receiptPhase ? (
                        <>
                          <p>كيف يرغب العميل باستلام الإيصال؟</p>
                          <div className="receipt-options">
                            {[
                              ...(printerSettings.enabled ? [{ id: "print", name: "طباعة", icon: Printer }] : []),
                              {
                                id: "email",
                                name: "بريد إلكتروني",
                                icon: Mail,
                              },
                              {
                                id: "sms",
                                name: "رسالة SMS",
                                icon: MessageSquare,
                              },
                              { id: "none", name: "بدون إيصال", icon: X },
                            ].map((o) => (
                              <button
                                className={
                                  receiptChoice === o.id ? "active" : ""
                                }
                                key={o.id}
                                onClick={() => {
                                  setReceiptChoice(o.id);
                                  setInput("");
                                  setError("");
                                }}
                              >
                                <o.icon size={22} />
                                {o.name}
                              </button>
                            ))}
                          </div>
                          {["email", "sms"].includes(receiptChoice) && (
                            <Field
                              label={
                                receiptChoice === "email"
                                  ? "البريد الإلكتروني"
                                  : "رقم الهاتف"
                              }
                              value={input}
                              onChange={setInput}
                            />
                          )}
                          <Btn variant="primary full" onClick={saveReceipt}>
                            {receiptChoice === "print" ? "معاينة وطباعة الإيصال" : receiptChoice === "none" ? "تأكيد بدون إيصال" : "محاكاة إرسال الإيصال"}
                          </Btn>
                          {receiptChoice === "print" && <Btn variant="full" onClick={() => {setPrinterReturn("receipt"); open("printer");}}><Printer size={18}/> إعدادات الطابعة الحرارية</Btn>}
                        </>
                      ) : (
                        <>
                          <p className="receipt-done">
                            {receiptChoice === "print"
                              ? "فُتحت معاينة الإيصال. المتصفح لا يؤكد خروج الورق؛ تحقق من الطابعة."
                              : receiptChoice === "none"
                                ? "تم إتمام البيع بدون إيصال"
                                : "تمت محاكاة إرسال الإيصال"}
                          </p>
                          {receiptChoice === "print" && <Btn variant="full" onClick={saveReceipt}>إعادة فتح معاينة الطباعة</Btn>}
                          <Btn
                            variant="primary full"
                            onClick={() => {
                              setModal(null);
                              setPayments([]);
                              setDrawerOpen(false);
                            }}
                          >
                            بدء طلب جديد
                          </Btn>
                        </>
                      )}
                    </>
                  )}
                  {modal === "reports" && (
                    <section className="reports-panel" aria-label="ملخص تقارير اليوم">
                      <div className="report-summary">
                        <article><span>صافي المبيعات</span><strong>{money(report.netSales)}</strong></article>
                        <article><span>المبيعات المكتملة</span><strong>{report.completedCount}</strong></article>
                        <article><span>الاسترجاعات</span><strong>{money(report.refundTotal)}</strong><small>{report.refundCount} عمليات</small></article>
                        <article><span>الربح التقديري</span><strong>{money(report.estimatedProfit)}</strong><small>قبل المصاريف التشغيلية</small></article>
                        <article><span>المعاملات الملغاة</span><strong>{report.voidCount}</strong></article>
                      </div>
                      <div className="report-columns">
                        <section><h3>صافي طرق الدفع</h3><dl className="report-list"><div><dt>نقداً</dt><dd>{money(report.paymentTotals.cash)}</dd></div><div><dt>بطاقة مصرفية</dt><dd>{money(report.paymentTotals.card)}</dd></div><div><dt>دفع لاتلامسي</dt><dd>{money(report.paymentTotals.contactless)}</dd></div></dl></section>
                        <section><h3>الأصناف الأكثر مبيعاً</h3><div className="report-scroll">{report.bestSellers.length ? report.bestSellers.map((item,index)=><div className="report-row" key={item.productId}><span><b>{index+1}</b>{item.name}</span><span>{Number(item.quantity.toFixed(3))} · {money(item.revenue)}</span></div>) : <p className="empty-report">لا توجد مبيعات مكتملة اليوم</p>}</div></section>
                        <section><h3>المخزون المنخفض</h3><div className="report-scroll">{report.lowStock.length ? report.lowStock.map(item=><div className="report-row" key={item.productId}><span>{item.name}</span><span>{item.stock} / {item.minimum}</span></div>) : <p className="empty-report">لا توجد أصناف تحت الحد الأدنى</p>}</div></section>
                      </div>
                      <p className="report-note">الأرقام تخص معاملات اليوم المحفوظة في هذا المتصفح. صافي المبيعات وطرق الدفع يطرحان الاسترجاعات ولا يحتسبان المعاملات الملغاة. الربح تقديري من سعر البيع قبل الضريبة ناقص تكلفة الصنف، ولا يشمل المصاريف التشغيلية.</p>
                      <div className="report-actions"><Btn variant="primary" onClick={exportReport}><Download size={18}/> تصدير CSV</Btn><Btn onClick={() => open("settings")}>رجوع</Btn></div>
                    </section>
                  )}
                  {modal === "settings" && (
                    <div className="choice-list">
                      <button onClick={() => {setPrinterReturn("settings");open("printer");}}><Printer /> إعدادات الطابعة الحرارية <ChevronLeft /></button>
                      <button onClick={() => open("reports")}><BarChart3 /> تقارير اليوم <ChevronLeft /></button>
                      <button onClick={() => open("products")}><ShoppingBag /> إدارة الأصناف <ChevronLeft /></button>
                      <button onClick={() => {setReceiveQuantity("");setReceiveSupplier("");open("inventory");}}><FolderOpen /> المخزون والاستلام <ChevronLeft /></button>
                      <button onClick={() => openNewProduct()}><ScanBarcode /> تسجيل صنف جديد <ChevronLeft /></button>
                    </div>
                  )}
                  {modal === "printer" && <PrinterSettings value={printerSettings} onSave={setPrinterSettings} onPreview={previewPrint}/>} 
                  {modal === "drawer" && (
                    <>
                      <div className="approval-icon">
                        <Banknote size={40} />
                      </div>
                      <h3>
                        {drawerOpen
                          ? "درج النقد مفتوح"
                          : "فتح درج النقد يدوياً"}
                      </h3>
                      {!drawerOpen ? (
                        <>
                          <Field
                            label="سبب فتح الدرج"
                            value={aux}
                            onChange={setAux}
                          />
                          <Btn
                            variant="primary full"
                            disabled={!aux.trim()}
                            onClick={() =>
                              approve("فتح درج النقد يدوياً", () => {
                                setDrawerOpen(true);
                                dispatch({
                                  type: "audit",
                                  action: "فتح درج يدوي",
                                  reason: aux,
                                  manager: "المدير",
                                });
                              })
                            }
                          >
                            طلب فتح الدرج
                          </Btn>
                        </>
                      ) : (
                        <Btn
                          variant="primary full"
                          onClick={() => {
                            dispatch({
                              type: "audit",
                              action: "إغلاق درج النقد",
                              reason: "تأكيد الكاشير",
                            });
                            setDrawerOpen(false);
                            setModal(null);
                            announce("تم تأكيد إغلاق الدرج");
                          }}
                        >
                          تأكيد إغلاق الدرج
                        </Btn>
                      )}
                    </>
                  )}
                  {modal === "history" && (
                    <>
                      <div className="segment">
                        {(["sales", "refunds", "audit"] as const).map((v) => (
                          <button
                            key={v}
                            className={historyTab === v ? "active" : ""}
                            onClick={() => setHistoryTab(v)}
                          >
                            {v === "sales"
                              ? "المبيعات"
                              : v === "refunds"
                                ? "الاسترجاع"
                                : "سجل العمليات"}
                          </button>
                        ))}
                      </div>
                      <Field
                        label={historyTab === 'audit' ? 'بحث في سجل العمليات' : 'بحث برقم الإيصال'}
                        value={historyQuery}
                        onChange={setHistoryQuery}
                      />
                      {historyTab === "sales" ? (
                        <div className="transaction-list">
                          {state.transactions
                            .filter((t) => t.sale.id.includes(historyQuery))
                            .map((t) => (
                              <div className="transaction-card" key={t.sale.id}>
                                <div className="flex justify-between">
                                  <strong>#{t.sale.id}</strong>
                                  <strong>{money(t.total)}</strong>
                                </div>
                                <p>
                                  {t.status === "void"
                                    ? "ملغاة"
                                    : Object.values(t.refunded).some(
                                          (v) => v > 0,
                                        )
                                      ? "بها أصناف مسترجعة"
                                      : "مكتملة"}{" "}
                                  ·{" "}
                                  {t.payments
                                    .map((p) => methods[p.method])
                                    .join(" + ")}
                                </p>
                                <div className="flex gap-2">
                                  <Btn
                                    disabled={t.status === "void"}
                                    onClick={() => {
                                      setReturnTx(t);
                                      setReturns({});
                                      setRefundCash(false);
                                      open("refund");
                                    }}
                                  >
                                    استرجاع
                                  </Btn>
                                  <Btn
                                    disabled={
                                      t.status === "void" ||
                                      Object.values(t.refunded).some(
                                        (v) => v > 0,
                                      )
                                    }
                                    onClick={() => {
                                      ask("سبب إلغاء المعاملة المكتملة",(reason)=>approve(
                                        `إلغاء المعاملة #${t.sale.id} · ${money(t.total)}`,
                                        () => {
                                          try{changeInventory(t.sale.lines.map(l=>({productId:l.productId,quantity:(l.scaleWeight||l.quantity)*(1-(t.refunded[l.id]||0)/l.quantity)})).filter(c=>c.quantity>0),"void",t.sale.id);setCatalogVersion(v=>v+1);}catch(e){setError(e instanceof Error?e.message:"تعذر استعادة المخزون");return;}
                                          dispatch({
                                            type: "void",
                                            id: t.sale.id,
                                            reason,
                                          });
                                          announce(
                                            "تم الإلغاء وإنشاء إيصال عكسي",
                                          );
                                          setHistoryTab("refunds");
                                          setModal('history');
                                        },
                                      ),true);
                                    }}
                                  >
                                    إلغاء المعاملة
                                  </Btn>
                                  <Btn
                                    label="إعادة الإيصال"
                                    disabled={!printerSettings.enabled}
                                    onClick={() => {
                                      setReceiptId(t.sale.id);
                                      setReceiptPhase(false);
                                      setReceiptChoice(printerSettings.enabled ? "print" : "none");
                                      open("receipt");
                                    }}
                                  >
                                    <ReceiptText size={16} />
                                  </Btn>
                                </div>
                              </div>
                            ))}
                          {!state.transactions.length && (
                            <p className="empty">
                              لا توجد معاملات بعد. أكمل عملية بيع أولاً.
                            </p>
                          )}
                        </div>
                      ) : historyTab === "refunds" ? (
                        <div className="choice-list">
                          {state.refunds
                            .filter((r) =>
                              r.transactionId.includes(historyQuery),
                            )
                            .map((r) => (
                              <div className="transaction-card" key={r.id}>
                                <strong>إيصال عكسي · #{r.transactionId}</strong>
                                <p>{r.reason}</p>
                                <h3>{money(r.total)}</h3>
                                {r.allocations.map((a, i) => (
                                  <p key={i}>
                                    {methods[a.method as keyof typeof methods]}:{" "}
                                    {money(a.amount)}
                                  </p>
                                ))}
                                <Btn
                                  disabled={!printerSettings.enabled}
                                  onClick={() => {
                                    const tx = state.transactions.find(t => t.sale.id === r.transactionId);
                                    if(tx) previewPrint(refundPrintReceipt(r, tx));
                                    else announce("لم يُعثر على المعاملة الأصلية.");
                                  }}
                                >
                                  <Printer size={16} /> طباعة الإيصال
                                </Btn>
                              </div>
                            ))}
                          {!state.refunds.length && (
                            <p>لا توجد مبالغ مسترجعة</p>
                          )}
                        </div>
                      ) : (
                        <div className="audit-list">
                          {state.audit.filter(a=>[a.action,a.reason,a.cashier,a.manager||''].some(v=>v.includes(historyQuery))).map((a) => (
                            <div key={a.id}>
                              <strong>{a.action}</strong>
                              <p>{a.reason}</p>
                              <small>
                                {a.cashier} {a.manager && `· ${a.manager}`} ·{" "}
                                {new Date(a.at).toLocaleString("ar-IQ")}
                              </small>
                            </div>
                          ))}
                          {!state.audit.length && <p>لا توجد عمليات مسجلة</p>}
                          {state.audit.length>0 && !state.audit.some(a=>[a.action,a.reason,a.cashier,a.manager||''].some(v=>v.includes(historyQuery))) && <p>لا توجد عمليات مطابقة للبحث</p>}
                        </div>
                      )}
                    </>
                  )}
                  {modal === "refund" && returnTx && (
                    <>
                      <p>
                        المعاملة #{returnTx.sale.id} · اختر الكميات المطلوب
                        استرجاعها
                      </p>
                      {returnTx.sale.lines.map((l) => {
                        const max = l.quantity - (returnTx.refunded[l.id] || 0);
                        return (
                          <label className="refund-line" key={l.id}>
                            <span>
                              {productById(l.productId).name}
                              <small>المتاح للاسترجاع: {max}</small>
                            </span>
                            <input
                              type="number"
                              min="0"
                              max={max}
                              value={returns[l.id] || 0}
                              onChange={(e) =>
                                setReturns({
                                  ...returns,
                                  [l.id]: Math.max(
                                    0,
                                    Math.min(
                                      max,
                                      Math.floor(Number(e.target.value) || 0),
                                    ),
                                  ),
                                })
                              }
                            />
                          </label>
                        );
                      })}
                      <div className="grand-total">
                        <span>مبلغ الاسترجاع</span>
                        <strong>{money(refundValue(returnTx, returns))}</strong>
                      </div>
                      <div className="refund-allocation">
                        {(refundCash ? [{method:'cash',amount:refundValue(returnTx,returns)}] : refundAllocations(
                          returnTx,
                          refundValue(returnTx, returns),
                          state.refunds,
                        )).map((a) => (
                          <p key={a.method}>
                            {methods[a.method as keyof typeof methods]}:{" "}
                            {money(a.amount)}
                          </p>
                        ))}
                      </div>
                      <Field
                        label="سبب الاسترجاع"
                        value={aux}
                        onChange={setAux}
                      />
                      <label className="check-row">
                        <input
                          type="checkbox"
                          checked={refundCash}
                          onChange={(e) => setRefundCash(e.target.checked)}
                        />{" "}
                        تحويل كامل الاسترجاع إلى نقد · يتطلب المدير
                      </label>
                      <Btn
                        variant="danger full"
                        disabled={
                          !aux.trim() || !Object.values(returns).some(q=>q>0)
                        }
                        onClick={() =>
                          approve(
                            `${refundCash ? "استرجاع نقدي بديل" : "استرجاع إلى الوسيلة الأصلية"} · ${money(refundValue(returnTx, returns))}`,
                            () => {
                              try{changeInventory(Object.entries(returns).filter(([,q])=>q>0).map(([lineId,q])=>{const line=returnTx.sale.lines.find(l=>l.id===lineId)!;return {productId:line.productId,quantity:(line.scaleWeight||line.quantity)*(q/line.quantity)};}),"refund",returnTx.sale.id);setCatalogVersion(v=>v+1);}catch(e){setError(e instanceof Error?e.message:"تعذر استعادة المخزون");return;}
                              dispatch({
                                type: "refund",
                                id: returnTx.sale.id,
                                selected: returns,
                                reason: aux,
                                cash: refundCash,
                              });
                              setModal("history");
                              setHistoryTab("refunds");
                              announce("تم الاسترجاع وإنشاء إيصال");
                            },
                          )
                        }
                      >
                        اعتماد الاسترجاع
                      </Btn>
                    </>
                  )}
                  {modal === "help" && (
                    <div className="help">
                      <p>
                        نسخة محلية لتجربة واجهة نقطة البيع. الضرائب والعمر
                        إعدادات تجريبية قابلة للاستبدال.
                      </p>
                      <h3>رموز التجربة</h3>
                      <p>
                        رمز المدير: <b dir="ltr">2468</b>
                      </p>
                      <p>
                        باركود البسكويت: <b dir="ltr">100001</b>
                        <br />
                        باركود العصير: <b dir="ltr">100010</b>
                      </p>
                      <p>
                        بطاقة أحمد: <b dir="ltr">200001</b>
                      </p>
                      <p>
                        العروض: <b dir="ltr">WELCOME10 · DESSERT5 · JUICE2</b>
                      </p>
                      <h3>الدفع والأجهزة</h3>
                      <p>
                        المدفوعات والرسائل ودرج النقد محاكاة. طباعة الإيصالات من نافذة المتصفح عبر تعريف Windows. قارئ
                        الباركود الذي يعمل كلوحة مفاتيح مدعوم. البيانات محفوظة
                        في هذا المتصفح.
                      </p>
                    </div>
                  )}
                </>
              )}
              {modal === "receipt" && transaction && !approval && (
                <ReceiptPreview transaction={transaction} settings={printerSettings} />
              )}{" "}
              {modal === "payment" && paid > 0 && !processing && !approval && (
                <Btn
                  variant="danger full"
                  onClick={() =>
                    approve("عكس الدفعات الجزئية وإلغاء الدفع", () => {
                      dispatch({
                        type: "audit",
                        action: "عكس دفعات تجريبية",
                        reason: payments
                          .map((p) => `${methods[p.method]}: ${p.amount}`)
                          .join(" / "),
                        manager: "المدير",
                      });
                      setPayments([]);
                      setModal(null);
                      announce("تم عكس الدفعات التجريبية. السلة محفوظة.");
                    })
                  }
                >
                  إلغاء الدفع وعكس المبالغ · موافقة المدير
                </Btn>
              )}
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
