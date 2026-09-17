import { loadFavorites, saveFavorites } from './favorites';
import { CategorySettings } from './CategorySettings';
import { OfferSettings } from './OfferSettings';
import { loadSalesSettings } from './salesSettings';
import { WholesaleSettings } from './WholesaleSettings';
import { categoryColor, categoryPalette } from "./categoryColors";
import { useEffect, useReducer, useRef, useState, type ReactNode } from "react";
import { Dialog } from "radix-ui";
import { ReportDetails } from "./ReportDetails";
import { ReceiptPreview } from "./ReceiptPreview";
import { PrinterSettings } from "./PrinterSettings";
import { buildDailyReport, dailyReportCsv, localDay } from "./reports";
import { loadPrinterSettings, thermalPrintDocument, productLabelDocument, salePrintReceipt, refundPrintReceipt, type PrintReceipt, type PrinterSettings as PrintSettings } from "./printing";
import {
  Star,
  Search,
  ScanBarcode,
  ChevronLeft,
  Plus,
  Minus,
  Trash2,
  Undo2,
  Pause,
  FolderOpen,
  ShieldCheck,
  Wifi,
  UtensilsCrossed,
  ShoppingBag,
  Percent,
  Ticket,
  Wallet,
  Printer,
  X,
  Check,
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
  discountConflict,
  cashPayment,
  refundValue,
  refundAllocations,
  checkoutError,
  normalizeDigits,
  getRecoveryNotice,
  hydrateRegisteredProducts,
  registerProduct,
  updateRegisteredProduct,
  deleteRegisteredProduct,
  hydrateInventory,
  changeInventory,
  receiveInventory,
  generateInternalBarcode,
  findBarcode,
  type Sale,
  type Line,
  type Product,
  type Payment,
  type Transaction,
  type Discount,
} from "./model";
type Modal =
  | null
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
  | "settings"
  | "audit"
  | "history"
  | "refund"
  | "drawer"
  | "confirm"
  | "help";
type Workspace = "products" | "inventory" | "history" | "reports" | "settings" | "audit" | "newProduct";
const workspaceOrder: Workspace[] = ["products", "inventory", "history", "reports", "settings", "audit", "newProduct"];
const workspaceTabs: {id: Workspace; label: string; icon: typeof ShoppingBag}[] = [
  {id:"products",label:"إدارة الأصناف",icon:ShoppingBag},
  {id:"inventory",label:"المخزون والاستلام",icon:FolderOpen},
  {id:"reports",label:"التقارير",icon:BarChart3},
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
const amountText = (value: number) => new Intl.NumberFormat('en-US',{maximumFractionDigits:0}).format(value);
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
  const [salesSettings, setSalesSettings] = useState(loadSalesSettings);
  const [printDocument, setPrintDocument] = useState("");
  const [labelProduct, setLabelProduct] = useState<Product | null>(null);
  const drawerPrintRef = useRef<Transaction | null>(null);
  function previewPrint(receipt: PrintReceipt, settings: PrintSettings = printerSettings, drawerTx?: Transaction) {
    if (!settings.enabled) {
      setToast("الطباعة الحرارية غير مفعلة في الإعدادات");
      return false;
    }
    drawerPrintRef.current = drawerTx?.payments.some(payment => payment.method === 'cash') && settings.drawerKick ? drawerTx : null;
    setLabelProduct(null);
    setPrintDocument(thermalPrintDocument(receipt, settings));
    return true;
  }
  function previewProductLabel(product: Product, copies = "1") {
    if(!printerSettings.enabled){setToast("الطباعة الحرارية غير مفعلة في الإعدادات");return;}
    try{const document = productLabelDocument(product,printerSettings,Number(copies));setLabelProduct(product);setLabelCopies(copies);setPrintDocument(document);}catch(e){setToast(e instanceof Error?e.message:"تعذر إنشاء ملصق الباركود");}
  }
  const [printerReturn, setPrinterReturn] = useState<"receipt" | null>(null);
  const [printerDirty, setPrinterDirty] = useState(false);
  const [wholesaleDirty,setWholesaleDirty] = useState(false);
  const [offersDirty,setOffersDirty] = useState(false);
  const [categoriesDirty,setCategoriesDirty] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<{target: Modal} | null>(null);
  const [productReturn, setProductReturn] = useState<"products" | "inventory" | null>(null);
  const [receiveBarcode,setReceiveBarcode] = useState("");
  const [receiveCost,setReceiveCost] = useState("");
  const receivingBaseline = useRef(JSON.stringify(["","","","",""]));
  const [labelCopies,setLabelCopies] = useState("1");
  const [reportFrom,setReportFrom] = useState(localDay(new Date()));
  const [reportTo,setReportTo] = useState(localDay(new Date()));
  const [reportView,setReportView] = useState("summary");
  const productBaseline = useRef(JSON.stringify(emptyNewProduct()));
  const [productQuery,setProductQuery] = useState("");
  const [productCategory,setProductCategory] = useState("all");
  const [productStatus,setProductStatus] = useState("all");
  const [receiveCategory,setReceiveCategory] = useState("");
  const [storageWarning, setStorageWarning] = useState("");
  const [, setCatalogVersion] = useState(0);
  const [newProduct, setNewProduct] = useState<NewProductDraft>(() => emptyNewProduct());
  const [favorites,setFavorites]=useState<string[]>(loadFavorites);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [inventoryProductId, setInventoryProductId] = useState("");
  const [receiveQuantity, setReceiveQuantity] = useState("");
  const [confirmation,setConfirmation]=useState<{title:string;reason:boolean;run:(reason:string)=>void}|null>(null);
  const confirmationReturn = useRef<Modal>(null);
  function ask(title:string,run:(reason:string)=>void,reason=false){confirmationReturn.current=modal;setConfirmation({title,run,reason});open('confirm');}
  const [state, dispatch] = useReducer(reducer, undefined, loadState),
    [category, setCategory] = useState("all"),
    [search, setSearch] = useState(""),
    [modal, setModal] = useState<Modal>(null);
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
  const [payments, setPayments] = useState<Payment[]>([]),
    [splitPayment, setSplitPayment] = useState(false),
    [processing, setProcessing] = useState(false);
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
  const [selectingReturn,setSelectingReturn] = useState(false);
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
      if (modal || approval || e.ctrlKey || e.altKey || e.metaKey || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target instanceof HTMLElement && e.target.isContentEditable))
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
    window.addEventListener("keydown", scan, true);
    return () => window.removeEventListener("keydown", scan, true);
  }, [modal, approval, current]);
  const update = (sale: Sale) => dispatch({ type: "sale", sale }),
    announce = (s: string) => setToast(s);
  function open(m: Modal) {
    setError("");
    setInput("");
    setAux("");
    setModal(m);
  }
  function openNewProduct(barcode = "") {
    setProductReturn(modal === "products" ? "products" : modal === "inventory" ? "inventory" : null);
    const draft = emptyNewProduct(normalizeDigits(barcode).replace(/\D/g, ""));
    if(modal === "inventory" && receiveCategory) draft.category=receiveCategory;
    productBaseline.current = JSON.stringify(draft);
    setEditingProductId(null);
    setNewProduct(draft);
    open("newProduct");
  }
  function openEditProduct(product: Product) {
    setProductReturn("products");
    setEditingProductId(product.id);
    setNewProduct({barcode:product.barcode,scaleCode:product.scaleCode||"",name:product.name,category:product.category,price:String(product.price),cost:product.cost === undefined ? "" : String(product.cost),supplier:product.supplier || "",stock:String(product.stock),minStock:String(product.minStock || 0),unit:product.unit || "piece",tax:String(product.tax),expiry:product.expiry || ""});
    productBaseline.current = JSON.stringify({barcode:product.barcode,scaleCode:product.scaleCode||"",name:product.name,category:product.category,price:String(product.price),cost:product.cost === undefined ? "" : String(product.cost),supplier:product.supplier || "",stock:String(product.stock),minStock:String(product.minStock || 0),unit:product.unit || "piece",tax:String(product.tax),expiry:product.expiry || ""});
    open("newProduct");
  }
  function saveNewProduct(addToBasket = false) {
    const barcode = normalizeDigits(newProduct.barcode).replace(/\s/g, "");
    const scaleCode=normalizeDigits(newProduct.scaleCode).replace(/\D/g,"");
    const priceValue = Number(normalizeDigits(newProduct.price));
    const costValue = newProduct.cost ? Number(normalizeDigits(newProduct.cost)) : undefined;
    const stockValue = Number(normalizeDigits(newProduct.stock));
    const minStockValue = Number(normalizeDigits(newProduct.minStock));
    const taxValue = Number(normalizeDigits(newProduct.tax));
    if (!/^\d{4,32}$/.test(barcode)) {setError("أدخل باركوداً رقمياً من 4 إلى 32 رقماً");return;}
    if (products.some(p => p.barcode === barcode && p.id !== editingProductId)) {setError("الباركود مسجل مسبقاً");return;}
    if(scaleCode&& !/^\d{5}$/.test(scaleCode)){setError("رمز الميزان يجب أن يكون 5 أرقام");return;}
    if(scaleCode&&products.some(p=>p.scaleCode===scaleCode&&p.id!==editingProductId)){setError("رمز الميزان مسجل مسبقاً");return;}
    if(scaleCode&&!['kg','g'].includes(newProduct.unit)){setError("رمز الميزان يتطلب وحدة وزن");return;}
    if (!newProduct.name.trim()) {setError("أدخل اسم الصنف");return;}
    if (!newProduct.price.trim() || !Number.isSafeInteger(priceValue) || priceValue < 0) {setError("أدخل سعر بيع صحيحاً");return;}
    if (costValue !== undefined && (!Number.isSafeInteger(costValue) || costValue < 0)) {setError("أدخل تكلفة صحيحة");return;}
    if (!Number.isSafeInteger(stockValue) || stockValue < 0 || !Number.isSafeInteger(minStockValue) || minStockValue < 0) {setError("أدخل مخزوناً صحيحاً");return;}
    if (!Number.isFinite(taxValue) || taxValue < 0 || taxValue > 100) {setError("أدخل ضريبة من 0 إلى 100");return;}
    if(addToBasket && stockValue<1){setError("أدخل مخزوناً ابتدائياً لا يقل عن 1 للإضافة إلى السلة");return;}
    approve(`${editingProductId ? "تعديل" : "تسجيل"} صنف · ${newProduct.name.trim()}`, () => {
      try {
        const categoryInfo = categories.find(c => c.id === newProduct.category)!;
        const existing = editingProductId ? products.find(p => p.id === editingProductId) : undefined;
        const product: Product = {id:existing?.id || `custom-${uid()}`,...existing,custom:existing ? existing.custom : true,edited:!!existing,barcode,scaleCode:scaleCode||undefined,name:newProduct.name.trim(),category:newProduct.category,price:priceValue,cost:costValue,supplier:newProduct.supplier.trim(),stock:stockValue,minStock:minStockValue,unit:newProduct.unit,tax:taxValue,expiry:newProduct.expiry || undefined,tone:categoryInfo.tone,discountable:true,available:existing?.available !== false};
        if (existing) {updateRegisteredProduct(product);} else registerProduct(product);
        setCatalogVersion(v => v + 1);
        setCategory(product.category);
        setSearch("");
        setModal(productReturn);
        if(productReturn === "inventory"){setInventoryProductId(product.id);setReceiveBarcode(product.barcode);setReceiveCost(newProduct.cost);setReceiveCategory(product.category);}
        if(addToBasket) addProduct(product);
        announce(existing ? "تم تحديث الصنف" : "تم تسجيل الصنف ويمكن مسح باركوده الآن");
      } catch (e) {setError(e instanceof Error ? e.message : "تعذر حفظ الصنف");}
    });
  }
  function lookupReceiving() {
    const barcode=normalizeDigits(receiveBarcode.trim());
    const found=products.find(p=>p.barcode===barcode);
    if(found){
      if(found.available===false){setInventoryProductId("");setError("الصنف موقوف");return;}
      if(receiveCategory && found.category!==receiveCategory){setInventoryProductId("");setReceiveCost("");setError("الباركود لا ينتمي إلى الفئة المحددة");return;}
      setInventoryProductId(found.id);setReceiveCategory(found.category);setReceiveCost(found.cost===undefined?"":String(found.cost));setError("");
    }else if(/^\d{4,32}$/.test(barcode)){setInventoryProductId("");openNewProduct(barcode);}
    else {setInventoryProductId("");setError("أدخل باركوداً رقمياً صحيحاً");}
  }
  function resetReceiving() {
    setReceiveQuantity("");setReceiveCategory("");setReceiveCost("");setReceiveBarcode("");setInventoryProductId("");
    receivingBaseline.current=JSON.stringify(["","","","",""]);
  }
  function receiveStock() {
    const quantity=Number(normalizeDigits(receiveQuantity));
    const product=products.find(p=>p.id===inventoryProductId);
    if(!product || product.available===false){setError("ابحث عن الباركود أولاً لتحديد الصنف");return;}
    if(!receiveBarcode.trim() || normalizeDigits(receiveBarcode.trim())!==product.barcode){setError("ابحث عن الباركود أولاً لتحديد الصنف الصحيح");return;}
    if(!Number.isSafeInteger(quantity)||quantity<=0||quantity>999999){setError("أدخل كمية استلام صحيحة");return;}
    if(!receiveCategory || product.category!==receiveCategory){setError("اختر الفئة المطابقة للصنف");return;}
    if(!receiveCost.trim() || !Number.isSafeInteger(Number(receiveCost)) || Number(receiveCost)<0){setError("أدخل سعر الشراء");return;}
    approve(`استلام مخزون · ${product.name} · ${quantity}`,()=>{
      try{receiveInventory(product.id,quantity,Number(receiveCost));setCatalogVersion(v=>v+1);resetReceiving();setModal("inventory");announce("تم استلام المخزون وتسجيل الحركة");}
      catch(e){setError(e instanceof Error?e.message:"تعذر تحديث المخزون");}
    });
  }
  function close() {
    if (processing || approval || modal === "receipt") return;
    if (modal === "payment" && payments.length) {
      setError("أكمل المبلغ المتبقي قبل مغادرة الدفع");
      return;
    }
    navigate(modal === "confirm" ? confirmationReturn.current : modal === "newProduct" ? productReturn : modal === "settings" && printerReturn ? printerReturn : null);
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
    if(old && old.quantity>=999){announce("الحد الأقصى للصنف 999. عدّل الكمية من السلة.");return;}
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
      announce("الكمية من 1 إلى 999");
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
  function startPayment(split = false) {
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
    setSplitPayment(split);
    open("payment");
    setInput(String(totals.total));
  }
  function commitPayment(p: Payment) {
    const next = [...payments, p];
    setPayments(next);
    if (next.reduce((a, p) => a + p.amount, 0) === totals.total) {
      const id = current.id;
      try{changeInventory(current.lines.map(l=>({productId:l.productId,quantity:-(l.scaleWeight||l.quantity)})),"sale",id);setCatalogVersion(v=>v+1);}catch(e){setError(e instanceof Error?e.message:"تعذر تحديث المخزون");return;}
      dispatch({ type: "complete", payments: next });
      setReceiptId(id);
      setReceiptChoice(printerSettings.enabled ? "print" : "none");
      setReceiptPhase(false);
      setSplitPayment(false);
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
      commitPayment(cashPayment(remaining, Number(input), splitPayment));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {queueMicrotask(()=>{busyRef.current=false;});}
  }
  function applyDiscount() {
    const candidate = discountTarget === "basket" ? {...current,discount:{kind:discountKind,value:1}} : {...current,lines:current.lines.map(l=>l.id===discountTarget?{...l,discount:{kind:discountKind,value:1}}:l)};
    const conflict = discountConflict(candidate); if (conflict) {setError(conflict);return;}
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
    dispatch({
      type: "receipt",
      id: receiptId,
      method: receiptChoice === "print" ? "print-preview (unconfirmed)" : "none",
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
    category === "all" && !search.trim() ? filtered.filter(p=>favorites.includes(p.id)) : filtered;
  const categoriesPerPage = 14;
  const visibleCategories = categories.slice(0, categoriesPerPage);
  const reportRangeValid = !!reportFrom && !!reportTo && reportFrom <= reportTo;
  const report = buildDailyReport(state, new Date(now),reportFrom,reportTo);
  function exportReport() {
    const url=URL.createObjectURL(new Blob([dailyReportCsv(report)],{type:'text/csv;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download=`mizan-report-${report.date}.csv`;link.click();URL.revokeObjectURL(url);
    announce('تم تجهيز ملف تقرير اليوم');
  }
  const titles: Record<Exclude<Modal, null>, string> = {
    discount: "تطبيق خصم",
    coupon: "العروض والكوبونات",
    price: "التحقق من السعر",
    newProduct: editingProductId ? "تعديل الصنف" : "تسجيل صنف جديد",
    products: "إدارة الأصناف",
    inventory: "المخزون",
    reports: "التقارير",
    age: "التحقق من العمر",
    quantity: "تعديل الصنف",
    hold: "المبيعات المعلقة",
    recall: "المبيعات المعلقة",
    cancel: "إلغاء البيع الحالي",
    payment: "إتمام الدفع",
    receipt: "إيصال البيع",
    settings: "الإعدادات",
    audit: "سجل العمليات",
    history: "سجل المعاملات",
    refund: "استرجاع وإعادة المبلغ",
    drawer: "درج النقد",
    help: "المساعدة",
    confirm: "تأكيد العملية",
  };
  const transaction = state.transactions.find((t) => t.sale.id === receiptId);
  const workspace = modal && workspaceOrder.includes(modal as Workspace) ? modal as Workspace : null;
  const management = !!workspace && !["history", "settings"].includes(workspace) && (workspace !== "newProduct" || productReturn !== null);
  const receivingSnapshot = JSON.stringify([inventoryProductId,receiveBarcode,receiveCost,receiveQuantity,receiveCategory]);
  const dirty = printerDirty || wholesaleDirty || offersDirty || categoriesDirty || (modal === "newProduct" && JSON.stringify(newProduct) !== productBaseline.current) || (modal === "inventory" && receivingSnapshot !== receivingBaseline.current);
  useEffect(() => {
    if (!dirty) return;
    const preventDraftLoss = (event: BeforeUnloadEvent) => {event.preventDefault(); event.returnValue = "";};
    window.addEventListener("beforeunload", preventDraftLoss);
    return () => window.removeEventListener("beforeunload", preventDraftLoss);
  }, [dirty]);
  function performNavigation(target: Modal) {
    setPendingNavigation(null); setPrinterDirty(false); setWholesaleDirty(false); setOffersDirty(false);setCategoriesDirty(false);
    if(!(modal === "newProduct" && target === "inventory")){resetReceiving();}
    if(target === "audit") setHistoryTab("audit");
    if(target === "history") setHistoryTab("sales");
    open(target);
  }
  function navigate(target: Modal) {
    if(target === modal) return;
    if(dirty) {setPendingNavigation({target}); return;}
    performNavigation(target);
  }
  function switchWorkspace(next: Workspace) {navigate(next);}
  function leaveWorkspace() {navigate(modal === "newProduct" ? productReturn : modal === "settings" && printerReturn ? printerReturn : null);}
  const matchingProducts = products.filter(p => (p.name.includes(productQuery.trim()) || p.barcode.includes(normalizeDigits(productQuery.trim()))) && (productCategory === "all" || p.category === productCategory) && (productStatus === "all" || (productStatus === "low" ? p.stock <= (p.minStock || 0) : p.available === false)));
  return (
    <div className="pos-shell" dir="rtl">
      <main className="pos-main">
        <nav className="category-rail" aria-label="فئات المنتجات">
          <div className="rail-matrix">
            <div className="category-list">
              {visibleCategories.map((c) => (
                <button
                  key={c.id}
                  style={{backgroundColor:categoryColor(c.id)}}
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
              {Array.from({length: Math.max(0, categoriesPerPage - visibleCategories.length)}, (_, index) => <button style={{backgroundColor:categoryPalette[visibleCategories.length+index]}} className="category category-placeholder" aria-label="فئة غير مسماة" key={`category-placeholder-${index}`} type="button" />)}
            </div>
          </div>
        </nav>
        <section className="catalog" aria-label="المنتجات">
          <div className="section-heading">
            <div>
              <h1>{categories.find((c) => c.id === category)?.name}</h1>
            </div>
          </div>
          <div className="products-scroll">
            <div className="product-grid">
              {shown.map((p) => {
                return (
                  <button
                    key={p.id}
                    className="product-tile"
                    style={{backgroundColor:categoryColor(p.category)}}
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
              <div className="catalog-footer">
            <div className="rail-tools" aria-label="إجراءات نقطة البيع">
              <div className="scanner-host">
                <input
                  className="scanner-input"
                  ref={barcodeInputRef}
                  autoFocus
                  inputMode="none"
                  autoComplete="off"
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
              <div className={`rail-tool-cell ${visibleCategories[1]?.id === category ? "active" : ""}`}><Btn label="المعاملات" onClick={() => {setSelectingReturn(false);open("history");setHistoryTab("sales");}}><History size={20}/></Btn></div>
              <div className={`rail-tool-cell ${visibleCategories[2]?.id === category ? "active" : ""}`}><Btn label="بدء استرجاع" onClick={() => {setSelectingReturn(true);setHistoryQuery("");open("history");setHistoryTab("sales");}}><Undo2 size={20}/></Btn></div>
              <div className={`rail-tool-cell ${visibleCategories[3]?.id === category ? "active" : ""}`}><Btn label="درج النقد" onClick={() => open("drawer")}><Banknote size={20}/></Btn></div>
              <div className="rail-tool-cell"><Btn label="الإعدادات والإدارة" onClick={() => open("products")}><ShoppingBag size={20}/></Btn></div>
              <div className="rail-tool-cell"><Btn label="الإعدادات" onClick={() => {setPrinterReturn(null);open("settings");}}><SettingsIcon size={20}/></Btn></div>
              <div className="rail-tool-cell"><Btn label="المساعدة" onClick={() => open("help")}><CircleHelp size={20}/></Btn></div>
            </div>

                <Btn label="التحقق من السعر" onClick={() => {setCheckedProduct(null);setCheckedScale(null);open("price");}}><ScanBarcode size={20}/></Btn>
              </div>
        </section>
        <aside className="basket" aria-label="سلة البيع">
          <div className="order-header">
            <div>
              <h2 className="basket-title">السلة</h2>
            </div>
            <div className="basket-header-actions">
                <Btn label="حفظ في المبيعات المعلقة" disabled={!current.lines.length} onClick={() => {open("hold");setInput(current.note);}}><Pause size={20}/></Btn>
                <Btn label="المبيعات المعلقة" onClick={() => open("recall")}><Undo2 size={20}/></Btn>
            </div>
          </div>
          <div className="service-tabs" role="group" aria-label="نوع البيع" hidden={!salesSettings.wholesaleEnabled}>
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
              onClick={() => {const next={...current,service:"dinein" as const};const conflict=discountConflict(next);if(conflict){announce(conflict);return;}update(next);}}
            >
              جملة
            </button>
          </div>
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
                        <b className="line-quantity">{l.quantity}</b>
                        <span className={`line-color tone-${p.tone}`} />
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
            {totals.savings.length > 0 && <div className="totals">{totals.savings.map((saving,index)=><div className="saving" key={index}><span>{saving.reason}</span><span>− {money(saving.amount)}</span></div>)}{current.coupon && <button className="btn" onClick={()=>update({...current,coupon:undefined})}>إزالة الكوبون</button>}</div>}
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
                تقسيم
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
          if (!v) {if(pendingNavigation) setPendingNavigation(null); else if(printDocument) setPrintDocument(""); else close();}
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className={`dialog-overlay ${workspace ? "workspace-overlay" : ""}`} />
          <Dialog.Content
            className={`dialog-content ${workspace && !approval && !printDocument ? `workspace-shell ${management ? "management-shell" : ""}` : ""} ${printDocument ? "thermal-dialog" : modal === "payment" && !approval ? "payment-dialog" : modal === "newProduct" ? "management-dialog" : ""}`}
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
                  {pendingNavigation ? "تغييرات غير محفوظة" : printDocument ? "معاينة الطباعة الحرارية" : approval ? "موافقة المدير" : modal === "history" && selectingReturn ? "اختر فاتورة للاسترجاع" : modal ? titles[modal] : ""}
                </Dialog.Title>
              </div>
              {!processing && (modal !== "receipt" || !!printDocument) && (
                <Btn
                  variant="dialog-close-square"
                  label={pendingNavigation ? "العودة إلى التحرير" : printDocument ? `العودة إلى ${modal === "products" ? "الأصناف" : modal === "settings" ? "الإعدادات" : modal === "history" ? "المعاملات" : "الإيصال"}` : workspace && !approval && !printDocument ? modal === "newProduct" && productReturn ? productReturn === "inventory" ? "العودة إلى الاستلام" : "العودة إلى الأصناف" : modal === "settings" && printerReturn ? "العودة إلى الإيصال" : "العودة إلى شاشة البيع" : "إغلاق"}
                  onClick={() => (pendingNavigation ? setPendingNavigation(null) : printDocument ? setPrintDocument("") : approval ? setApproval(null) : workspace ? leaveWorkspace() : close())}
                >
                  <X size={20} aria-hidden="true"/>
                </Btn>
              )}
            </div>
            {management && !approval && !printDocument && !pendingNavigation && (
              <nav className="workspace-tabs" aria-label="أقسام الإدارة">
                {workspaceTabs.map(({id,label,icon:Icon}) => <button key={id} type="button" className={(workspace === "newProduct" ? productReturn : workspace)===id ? "active" : ""} aria-current={(workspace === "newProduct" ? productReturn : workspace)===id ? "page" : undefined} onClick={()=>switchWorkspace(id)}><Icon size={19}/><span>{label}</span></button>)}
              </nav>
            )}
            <div className="dialog-body">
              {printDocument && <div className="thermal-preview">
                {labelProduct && <label className="label-copies">عدد الملصقات<input type="number" min="1" max="100" value={labelCopies} onChange={e=>{const copies=e.target.value;setLabelCopies(copies);if(Number.isInteger(Number(copies))&&Number(copies)>=1&&Number(copies)<=100)previewProductLabel(labelProduct,copies);}}/></label>}
                {labelProduct && (!Number.isInteger(Number(labelCopies)) || Number(labelCopies)<1 || Number(labelCopies)>100) ? <p role="alert">أدخل عدد الملصقات من 1 إلى 100</p> : <iframe title="معاينة الإيصال الحراري" srcDoc={printDocument}/>}
              </div>}
              {pendingNavigation && <section className="unsaved-guard" role="alert" aria-label="تغييرات غير محفوظة"><p>تجاهل التغييرات والمغادرة؟</p><div className="form-actions"><button type="button" autoFocus className="btn primary" onClick={() => setPendingNavigation(null)}>متابعة التحرير</button><Btn variant="danger" onClick={() => performNavigation(pendingNavigation.target)}>تجاهل التغييرات والمغادرة</Btn></div></section>}
              <div className="dialog-regular" hidden={!!printDocument || !!pendingNavigation}>
              {modal==='confirm'&&confirmation&&!approval&&<><p>{confirmation.title}</p>{confirmation.reason&&<Field label="السبب" value={aux} onChange={setAux}/>}<Btn variant="primary full" disabled={confirmation.reason&&!aux.trim()} onClick={()=>confirmation.run(aux)}>تأكيد المتابعة</Btn><Btn variant="dialog-close-square" label="رجوع" onClick={()=>open(confirmationReturn.current)}><X size={20} aria-hidden="true"/></Btn></>}
              {approval && (
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
              )}
                <div className="dialog-regular" hidden={!!approval}>
                  {modal === "newProduct" && (
                    <>
<div className="new-product-grid">
                        <div className="barcode-field"><label>الباركود<span aria-hidden="true"> *</span><input aria-required="true" autoFocus={!newProduct.barcode} inputMode="numeric" value={newProduct.barcode} onChange={e=>setNewProduct(v=>({...v,barcode:normalizeDigits(e.target.value).replace(/\D/g,'')}))}/></label>
                        {!newProduct.barcode && <Btn onClick={()=>{try{setNewProduct(v=>({...v,barcode:generateInternalBarcode()}));}catch(e){setError(String(e));}}}>توليد باركود داخلي</Btn>}</div>
                        <label>اسم الصنف<span aria-hidden="true"> *</span><input aria-required="true" autoFocus={!!newProduct.barcode} maxLength={120} value={newProduct.name} onChange={e=>setNewProduct(v=>({...v,name:e.target.value}))}/></label>
                        {newProduct.barcode&&products.some(p=>p.barcode===newProduct.barcode&&p.id!==editingProductId)&&<div className="duplicate-product new-product-wide" role="alert"><strong>هذا الباركود مسجل بالفعل</strong><span>{products.find(p=>p.barcode===newProduct.barcode)!.name} · {money(products.find(p=>p.barcode===newProduct.barcode)!.price)}</span></div>}
                        <label>الفئة<select value={newProduct.category} onChange={e=>setNewProduct(v=>({...v,category:e.target.value}))}>{categories.filter(c=>c.id!=="all").map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
                        <label>سعر البيع<span aria-hidden="true"> *</span><input aria-required="true" inputMode="numeric" value={newProduct.price} onChange={e=>setNewProduct(v=>({...v,price:normalizeDigits(e.target.value).replace(/\D/g,'')}))}/></label>
                        <label>سعر الشراء<input aria-label="التكلفة" inputMode="numeric" value={newProduct.cost} onChange={e=>setNewProduct(v=>({...v,cost:normalizeDigits(e.target.value).replace(/\D/g,'')}))}/></label>
<details className="disclosure new-product-wide"><summary>تفاصيل إضافية</summary><div className="new-product-grid">                        <label>الوحدة<select value={newProduct.unit} onChange={e=>setNewProduct(v=>({...v,unit:e.target.value as NewProductDraft['unit'],scaleCode:["kg","g"].includes(e.target.value)?v.scaleCode:""}))}><option value="piece">قطعة</option><option value="kg">كيلوغرام</option><option value="g">غرام</option><option value="l">لتر</option><option value="ml">ملليلتر</option></select></label>
                        {["kg","g"].includes(newProduct.unit) && <label>رمز الميزان (5 أرقام)<input inputMode="numeric" placeholder="مثال: 12345" value={newProduct.scaleCode} onChange={e=>setNewProduct(v=>({...v,scaleCode:normalizeDigits(e.target.value).replace(/\D/g,'').slice(0,5)}))}/></label>}
                        {productReturn!=="inventory" && <label>{editingProductId ? "كمية المخزون" : "المخزون الابتدائي"}<input inputMode="numeric" value={newProduct.stock} onChange={e=>setNewProduct(v=>({...v,stock:normalizeDigits(e.target.value).replace(/\D/g,'')}))}/></label>}

                        <label>تاريخ الانتهاء<input type="date" value={newProduct.expiry} onChange={e=>setNewProduct(v=>({...v,expiry:e.target.value}))}/></label>
                        <label className="new-product-wide">المورّد<input maxLength={120} value={newProduct.supplier} onChange={e=>setNewProduct(v=>({...v,supplier:e.target.value}))}/></label></div></details>
                      </div>
                      <div className="form-actions"><Btn variant="primary" onClick={()=>saveNewProduct(!productReturn && !editingProductId)}>{editingProductId ? "حفظ التعديلات" : !productReturn ? "حفظ وإضافة للسلة" : "حفظ الصنف"}</Btn><Btn onClick={() => navigate(productReturn)}>إلغاء</Btn></div>
                    </>
                  )}
                  {modal === "products" && (
                    <>

                      <div className="management-toolbar"><Field label="بحث عن صنف بالاسم أو الباركود" value={productQuery} onChange={setProductQuery}/><label>الفئة<select value={productCategory} onChange={e=>setProductCategory(e.target.value)}><option value="all">كل الفئات</option>{categories.filter(c=>c.id!=="all").map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>الحالة<select value={productStatus} onChange={e=>setProductStatus(e.target.value)}><option value="all">كل الأصناف</option><option value="low">مخزون منخفض</option><option value="disabled">موقوف</option></select></label><Btn variant="primary" onClick={()=>openNewProduct()}>تسجيل صنف جديد</Btn></div>
                      <div className="managed-products">
                        {matchingProducts.map(product=>{
                          const low=product.stock <= (product.minStock || 0);
                          const expiring=!!product.expiry && new Date(product.expiry+'T00:00:00').getTime() <= Date.now()+30*86400000;
                          const used=current.lines.some(l=>l.productId===product.id)||state.transactions.some(t=>t.sale.lines.some(l=>l.productId===product.id));
                          return <article className={`managed-product ${product.available===false?'disabled':''}`} key={product.id}>
                            <div><strong>{product.name}</strong><small>{product.barcode} · {money(product.price)}</small><div className="product-flags">{low&&<span>مخزون منخفض</span>}{expiring&&<span>انتهاء قريب</span>}{product.available===false&&<span>موقوف</span>}</div></div>
                            <div className="managed-product-actions"><button className="btn favorite-toggle" aria-label={`${favorites.includes(product.id)?"إزالة من المفضلة":"إضافة إلى المفضلة"} · ${product.name}`} aria-pressed={favorites.includes(product.id)} onClick={()=>{const next=favorites.includes(product.id)?favorites.filter(id=>id!==product.id):[...favorites,product.id];try{saveFavorites(next);setFavorites(next);}catch{setError("تعذر حفظ المفضلة");}}}><Star size={20} fill={favorites.includes(product.id)?"currentColor":"none"}/></button><Btn disabled={!printerSettings.enabled} onClick={()=>previewProductLabel(product)}>ملصق</Btn><Btn onClick={()=>openEditProduct(product)}>تعديل</Btn>{product.custom&&<><Btn onClick={()=>approve(`${product.available===false?'تفعيل':'إيقاف'} الصنف · ${product.name}`,()=>{updateRegisteredProduct({...product,available:product.available===false});setCatalogVersion(v=>v+1);setModal('products');announce(product.available===false?'تم تفعيل الصنف':'تم إيقاف الصنف');})}>{product.available===false?'تفعيل':'إيقاف'}</Btn><Btn variant="danger" disabled={used} onClick={()=>approve(`حذف الصنف · ${product.name}`,()=>{deleteRegisteredProduct(product.id);setCatalogVersion(v=>v+1);setModal('products');announce('تم حذف الصنف');})}>حذف</Btn></>}</div>
                          </article>;
                        })}
                      </div>
                      <p role="status">{!matchingProducts.length ? "لا توجد أصناف مطابقة" : `${matchingProducts.length} صنف`}</p>
                    </>
                  )}
                  {modal === "inventory" && (
                    <>
                      <div className="inventory-receive">
                        <label className="receiving-product">الفئة<select value={receiveCategory} onChange={e=>{setReceiveCategory(e.target.value);setInventoryProductId("");setReceiveCost("");setError("");}}><option value="">اختر الفئة</option>{categories.filter(c=>c.id!=="all").map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
                        <div className="receiving-search" onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();lookupReceiving();}}}><label>باركود<input autoFocus inputMode="numeric" value={receiveBarcode} onChange={e=>{setReceiveBarcode(normalizeDigits(e.target.value));setInventoryProductId("");setReceiveCost("");}}/></label><Btn onClick={lookupReceiving}>بحث</Btn></div>
                        {inventoryProductId && <div className="receiving-product receiving-match" role="status"><strong>{productById(inventoryProductId).name}</strong><small>المتوفر: {productById(inventoryProductId).stock}</small></div>}
                        <label>سعر القطعة<input inputMode="numeric" value={receiveCost} onChange={e=>setReceiveCost(normalizeDigits(e.target.value))}/></label><label>الكمية المستلمة<input inputMode="numeric" value={receiveQuantity} onChange={e=>setReceiveQuantity(normalizeDigits(e.target.value).replace(/\D/g,''))}/></label>
                        <div className="receiving-actions"><Btn variant="primary" onClick={receiveStock}>تأكيد الاستلام</Btn></div>
                      </div>
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
                          } else setError("أدخل كمية من 1 إلى 999");
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
                          <p>ضريبة 10٪ · متوفر</p>
                          {salesSettings.demoMode !== false && checkedProduct.id === "p10" && (
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
                        الخصم فوق 10% يتطلب موافقة المدير. اختر خصم السلة أو الأصناف؛ لا يجمع مع الجملة أو الكوبونات، ويوقف العروض التلقائية.
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
                      {salesSettings.demoMode !== false && <>
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
                          <h3>خصم ترحيبي 10٪</h3>
                          <p>WELCOME10 · الأصناف المؤهلة فقط</p>
                        </div>
                      </div>
                      <div className="promo-card">
                        <Coffee />
                        <div>
                          <h3>5,000 د.ع. على الحلويات</h3>
                          <p>DESSERT5 · عند شراء حلويات بـ 20,000 د.ع.</p>
                        </div>
                      </div>
                      </>}
                      {(salesSettings.offers || []).filter(o=>o.active).map(o=><div className="promo-card" key={o.id}><div><strong>{o.name}</strong><p>{o.code || 'تلقائي'} · {o.value}{o.kind==='percent'?'%':' د.ع.'}</p></div></div>)}
                      <Field
                        label="رمز الكوبون"
                        value={input}
                        onChange={(v) => setInput(v.trim().toUpperCase())}
                        placeholder="رمز الكوبون"
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
                  {modal === "hold" && (
                    <>
                      <p>
                        <strong>{productById(current.lines[0]?.productId)?.name}</strong><br/>
                        {totals.count} أصناف · {" "}
                        {money(totals.total)}.
                      </p>
                      <Btn
                        variant="primary full"
                        onClick={() => {
                          dispatch({
                            type: "sale",
                            sale: { ...current, note: productById(current.lines[0]?.productId)?.name || "طلب معلق" },
                          });
                          dispatch({ type: "hold" });
                          setModal(null);
                          announce("تم تعليق البيع");
                        }}
                      >
                        حفظ في المبيعات المعلقة
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
                          <div className="choice-list">
                            {state.held
                              .map((s) => (
                                <div className="held-sale-row" key={s.id}>
                                <button
                                  onClick={() => {
                                    const recall=()=>{dispatch({type:'recall',id:s.id});setModal(null);announce('تم استدعاء البيع')};
                                    if(current.lines.length)ask('سيتم تعليق السلة الحالية واستدعاء الطلب المحدد. متابعة؟',recall);else recall();
                                  }}
                                >
                                  <span>
                                    #{s.id} · {productById(s.lines[0]?.productId)?.name || s.note || "طلب معلق"}
                                    <small>
                                      {price(s).count} أصناف ·{" "}
                                      {new Date(s.createdAt).toLocaleTimeString(
                                        "en-GB",
                                      )}
                                    </small>
                                  </span>
                                  <strong>{money(price(s).total)}</strong>
                                </button>
                                <Btn variant="danger" label={`حذف البيع المعلق #${s.id}`} onClick={()=>ask(`حذف البيع المعلق #${s.id}؟`,()=>{dispatch({type:'deleteHeld',id:s.id});setModal('recall');announce('تم حذف البيع المعلق');})}>حذف</Btn>
                                </div>
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
                          المبلغ المطلوب
                        </span>
                        <strong>{money(remaining)}</strong>
                        {paid > 0 && <small>المدفوع {money(paid)}</small>}
                      </div>
                      <p className="muted">دفع تجريبي؛ لا يتم تحصيل أموال فعلية.</p><div className="payment-layout payment-cash-only">
                        <div className="payment-entry">
                          <Field
                            label="المبلغ المستلم"
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
                          <div className="change-due">
                            <span>{Number(input) >= remaining ? "الباقي للعميل" : "المتبقي"}</span>
                            <strong>{money(Math.abs((Number.isFinite(Number(input)) ? Number(input) : 0) - remaining))}</strong>
                          </div>
                          <Btn variant="pay full" onClick={payCash}>
                            {splitPayment && Number(input) < remaining ? "إضافة دفعة" : "دفع"}
                          </Btn>
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
                          <div className="receipt-options">
                            {[
                              ...(printerSettings.enabled ? [{ id: "print", name: "طباعة", icon: Printer }] : []),
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
                          <Btn variant="primary full" onClick={saveReceipt}>
                            {receiptChoice === "print" ? "معاينة وطباعة الإيصال" : "تأكيد بدون إيصال"}
                          </Btn>
                          {receiptChoice === "print" && <Btn variant="full" onClick={() => {setPrinterReturn("receipt"); open("settings");}}><Printer size={18}/> إعدادات الطابعة الحرارية</Btn>}
                        </>
                      ) : (
                        <>
                          <p className="receipt-done">
                            {receiptChoice === "print"
                              ? "فُتحت معاينة الإيصال. المتصفح لا يؤكد خروج الورق؛ تحقق من الطابعة."
                              : "تم إتمام البيع بدون إيصال"}
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
                    <section className="reports-panel" aria-label="تقارير الفترة المحددة">
                      <div className="management-toolbar"><label>من تاريخ<input type="date" value={reportFrom} onChange={e=>setReportFrom(e.target.value)}/></label><label>إلى تاريخ<input type="date" value={reportTo} onChange={e=>setReportTo(e.target.value)}/></label><label>التقرير<select value={reportView} onChange={e=>setReportView(e.target.value)}><option value="summary">الملخص</option><option value="sales">المبيعات</option><option value="refunds">الاسترجاعات</option><option value="products">ربحية الأصناف</option><option value="receiving">الاستلام</option><option value="movements">حركات المخزون</option></select></label></div>{!reportRangeValid&&<p role="alert">اختر فترة صحيحة: تاريخ البداية لا يتجاوز النهاية</p>}{["summary","products"].includes(reportView)&&report.missingCostLines>0&&<p role="status">{report.missingCostLines} سطر بلا تكلفة تاريخية؛ مستبعدة من الربح التقديري.</p>}{report.legacyDates&&<p className="muted">بعض السجلات القديمة بلا وقت تنفيذ؛ استُخدم تاريخ البيع كمرجع.</p>}<div hidden={reportView!=="summary"} className="report-summary">
                        <article><span>صافي المبيعات</span><strong>{money(report.netSales)}</strong></article>
                        <article><span>المبيعات المكتملة</span><strong>{report.completedCount}</strong></article>
                        <article><span>الاسترجاعات</span><strong>{money(report.refundTotal)}</strong><small>{report.refundCount} عمليات</small></article>
                        <article><span>الربح التقديري</span><strong>{money(report.estimatedProfit)}</strong><small>قبل المصاريف التشغيلية</small></article>

                      </div>
                      {reportView === "summary" && !report.completedCount && !report.refundCount && <p className="empty-report">لا توجد معاملات في الفترة المحددة</p>}
                      <div hidden={reportView!=="summary" || (!report.completedCount && !report.refundCount)} className="report-columns">
                        <section><h3>صافي طرق الدفع</h3><dl className="report-list"><div><dt>نقداً</dt><dd>{money(report.paymentTotals.cash)}</dd></div><div><dt>بطاقة مصرفية</dt><dd>{money(report.paymentTotals.card)}</dd></div><div><dt>دفع لاتلامسي</dt><dd>{money(report.paymentTotals.contactless)}</dd></div></dl></section>
                        <section><h3>الأصناف الأكثر مبيعاً</h3><div className="report-scroll">{report.bestSellers.length ? report.bestSellers.map((item,index)=><div className="report-row" key={item.productId}><span><b>{index+1}</b>{item.name}</span><span>{Number(item.quantity.toFixed(3))} · {money(item.revenue)}</span></div>) : <p className="empty-report">لا توجد مبيعات في الفترة المحددة</p>}</div></section>

                      </div>
                      {reportView === "sales" && report.voidCount > 0 && <p>المعاملات الملغاة: {report.voidCount} · مستبعدة من المبيعات</p>}
                      <ReportDetails report={report} view={reportView}/><p className="report-note">بيانات هذا المتصفح فقط.{reportView === "refunds" && " الاسترجاعات بتاريخ التنفيذ."}{reportView === "products" && " الربح تقديري قبل المصاريف التشغيلية."}</p>
                      <div className="report-actions"><Btn variant="primary" disabled={!reportRangeValid} onClick={exportReport}><Download size={18}/> تصدير CSV</Btn></div>
                    </section>
                  )}
                  {modal === "settings" && <PrinterSettings value={printerSettings} onSave={setPrinterSettings} onPreview={previewPrint} onDirtyChange={setPrinterDirty} storeContent={<>
                    <details className="disclosure"><summary>الفئات</summary><CategorySettings onSave={()=>setCatalogVersion(v=>v+1)} onDirtyChange={setCategoriesDirty} approve={approve}/></details>
                    <details className="disclosure"><summary>البيع بالجملة</summary><WholesaleSettings onDirtyChange={setWholesaleDirty} value={salesSettings} onSave={setSalesSettings} approve={approve}/></details>
                    <details className="disclosure"><summary>العروض ووضع التجربة</summary><OfferSettings onDirtyChange={setOffersDirty} value={salesSettings} onSave={setSalesSettings} approve={approve}/></details>
                    {salesSettings.demoMode !== false && <details className="demo-maintenance"><summary>صيانة النسخة التجريبية</summary><p>إعادة بيانات البيع التجريبية تتطلب تأكيداً وموافقة المدير.</p><Btn variant="danger" disabled={printerDirty || wholesaleDirty || offersDirty} onClick={() => ask("سيتم حذف بيانات هذه النسخة التجريبية فقط. متابعة؟",()=>approve("إعادة بيانات التجربة", () => {dispatch({ type: "reset" });setModal(null);announce("تمت إعادة بيانات التجربة");}))}>إعادة بيانات التجربة</Btn></details>}
                  </>}/>}
                  {modal === "drawer" && (
                    <>
                      {drawerOpen && <p role="status">تمت محاكاة فتح الدرج</p>}
                      {!drawerOpen ? (
                        <>
                          <label className="field">سبب فتح الدرج<select value={aux} onChange={e=>setAux(e.target.value)}><option value="">اختر السبب</option>{printerSettings.drawerReasons.map(reason=><option key={reason} value={reason}>{reason}</option>)}</select></label>
                          <Btn
                            variant="primary full"
                            disabled={!aux.trim()}
                            onClick={() =>
                              approve("فتح درج النقد يدوياً", () => {
                                if(!printerSettings.drawerReasons.includes(aux)){setError("اختر سبب فتح الدرج");return;}
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
                  {(modal === "history" || modal === "audit") && (
                    <>
                      <Field
                        label={historyTab === 'audit' ? 'بحث في سجل العمليات' : 'بحث برقم الإيصال'}
                        value={historyQuery}
                        onChange={setHistoryQuery}
                      />
                      {historyTab === "sales" ? (
                        <div className="transaction-list">
                          {state.transactions
                            .filter((t) => t.sale.id.includes(historyQuery) && (!selectingReturn || t.status!=="void" && t.sale.lines.some(l=>(t.refunded[l.id]||0)<l.quantity)))
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
                                  {!selectingReturn && <><Btn
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
                                  </Btn></>}
                                </div>
                              </div>
                            ))}
                          {!state.transactions.some(t=>t.sale.id.includes(historyQuery) && (!selectingReturn || t.status!=="void" && t.sale.lines.some(l=>(t.refunded[l.id]||0)<l.quantity))) && (
                            <p className="empty">
                              {selectingReturn ? "لا توجد فواتير قابلة للاسترجاع مطابقة للبحث" : "لا توجد معاملات مطابقة"}
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
                                {new Date(a.at).toLocaleString("en-GB")}
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
                              setSelectingReturn(false);setModal("history");
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
                      {salesSettings.demoMode !== false ? <><p>رمز المدير: <b dir="ltr">2468</b></p><details className="disclosure"><summary>رموز التجربة</summary><p>باركود البسكويت: 100001 · باركود العصير: 100010</p><p>WELCOME10 · DESSERT5 · JUICE2</p></details><p>المدفوعات ودرج النقد محاكاة. طباعة الإيصالات عبر نافذة المتصفح.</p></> : <><p>ابحث عن الصنف باسمه أو امسح الباركود، ثم راجع السلة واختر الدفع.</p><p>للاسترجاع اختر بدء استرجاع وحدد الفاتورة. إعدادات الأجهزة والمتجر والإيصال متاحة في الإعدادات.</p></>}
                      <p>قارئ الباركود الذي يعمل كلوحة مفاتيح مدعوم. البيانات محفوظة في هذا المتصفح.</p>
                    </div>
                  )}
                </div>
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
