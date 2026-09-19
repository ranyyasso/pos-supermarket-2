import { BasketSellingOptions } from './BasketSellingOptions';
import { lineStockQuantity, lineQuantityText, lineUnit, lineName, manualItemProductId, unitLabels, validQuantity, roundQuantity, sellingOptionsError } from './model';
import { productEntryMode } from "./model";
import { PaginatedProductList } from "./PaginatedProductList";
import { NumberStepper } from "./NumberStepper";
import { ReceiptPreview } from "./ReceiptPreview";
import { loadFavorites, saveFavorites } from './favorites';
import { CategorySettings } from './CategorySettings';
import { OfferSettings } from './OfferSettings';
import { loadSalesSettings } from './salesSettings';
import { deleteCloudProduct, loadCloudCategories, loadCloudProducts, saveCloudFavorite, saveCloudProduct, saveCloudStock, supabaseConfigured } from './supabase';
import { categoryColor, categoryPalette } from "./categoryColors";
import { useEffect, useReducer, useRef, useState, type ReactNode } from "react";
import ReactPaginate from "react-paginate";
import { Dialog } from "radix-ui";
import { ReportDetails } from "./ReportDetails";

import { PrinterSettings } from "./PrinterSettings";
import { buildDailyReport, dailyReportCsv, localDay } from "./reports";
import { loadPrinterSettings, thermalPrintDocument, productLabelDocument, salePrintReceipt, refundPrintReceipt, type PrintReceipt, type PrinterSettings as PrintSettings } from "./printing";
import {
  Star,
  Search,
  ScanBarcode,
  ChevronLeft,
  ChevronRight,
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
  seed,
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
  | "manualItem"
  | "coupon"
  | "price"
  | "newProduct"
  | "products"
  | "inventory"
  | "reports"
  | "age"
  | "quantity"
  | "recall"
  | "cancel"
  | "payment"
  | "receipt"
  | "invoice"
  | "settings"
  | "audit"
  | "history"
  | "refund"
  | "drawer"
  | "confirm"
  | "help";
type Workspace = "products" | "inventory" | "history" | "reports" | "settings" | "audit" | "newProduct";
const workspaceOrder: Workspace[] = ["products", "inventory", "history", "reports", "settings", "audit", "newProduct"];
hydrateRegisteredProducts();
hydrateInventory();
type NewProductDraft = {barcode:string;scaleCode:string;name:string;category:string;price:string;cost:string;supplier:string;stock:string;minStock:string;unit:"piece"|"kg"|"g"|"l"|"ml";tax:string;packSize:string;packPrice:string;packBarcode:string;wholesalePrice:string;wholesaleMinimum:string};
const emptyNewProduct = (barcode = ""): NewProductDraft => ({barcode,scaleCode:"",name:"",category:"starters",price:"",cost:"",supplier:"",stock:"",minStock:"1",unit:"piece",tax:"10",packSize:"",packPrice:"",packBarcode:"",wholesalePrice:"",wholesaleMinimum:""});
const methods = {
  cash: "نقداً",
  card: "بطاقة مصرفية",
  contactless: "دفع لاتلامسي",
};
const amountText = (value: number) => new Intl.NumberFormat('en-US',{maximumFractionDigits:0}).format(value);
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
      {["1", "2", "3", "4", "5", "6", "7", "8", "9", "000", "0", "⌫"].map(
        (key) => (
          <button
            key={key}
            onClick={() =>
              onChange(
                key === "⌫"
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
  autoFocus = false,
  selectOnFocus = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  autoFocus?: boolean;
  selectOnFocus?: boolean;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type={type}
        autoFocus={autoFocus}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(normalizeDigits(e.target.value))}
        onFocus={(e) => { if (selectOnFocus) e.currentTarget.select(); }}
        maxLength={240}
      />
    </label>
  );
}
export function App() {

  const [printerSettings, setPrinterSettings] = useState(loadPrinterSettings);
  useEffect(() => { document.documentElement.dataset.theme = printerSettings.theme; }, [printerSettings.theme]);
  const [clock, setClock] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
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
  const [offersDirty,setOffersDirty] = useState(false);
  const [categoriesDirty,setCategoriesDirty] = useState(false);
  const printerSave = useRef<((done:()=>void)=>void) | null>(null);
  const categorySave = useRef<((done:()=>void)=>void) | null>(null);
  const offerSave = useRef<((done:()=>void)=>void) | null>(null);
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
  const [productMode,setProductMode] = useState<"barcode" | "manual">("barcode");
  const [draftMode,setDraftMode] = useState<"barcode" | "manual">("barcode");
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
  const [state, dispatch] = useReducer(reducer, undefined, seed),
    [category, setCategory] = useState("all"),
    [search, setSearch] = useState(""),
    [modal, setModalState] = useState<Modal>(null);
  useEffect(() => {
    if (!supabaseConfigured) return;
    let active = true;
    Promise.all([loadCloudCategories(),loadCloudProducts()]).then(([cloudCategories,result]) => {
      if (!active) return;
      categories.splice(1,categories.length-1,...cloudCategories.map(row=>({id:row.id,name:row.name,tone:'neutral' as const})));
      const internal = products.filter(product => product.untracked);
      products.splice(0, products.length, ...result.products, ...internal);
      setFavorites(result.favorites);
      setCatalogVersion(version => version + 1);
    }).catch(() => {
      if (active) setStorageWarning('تعذر الاتصال بـ Supabase. تحقق من تنفيذ ملفات الترحيل وسياسات الوصول.');
    });
    return () => {active = false;};
  }, []);
  const modalParents = useRef<Modal[]>([]);
  function setModal(target: Modal) {
    const parents = modalParents.current;
    if (target === modal) return;
    if (target === null && parents.length) {
      setModalState(parents.pop()!);
      return;
    }
    const ancestor = parents.lastIndexOf(target);
    if (ancestor >= 0) {
      modalParents.current = parents.slice(0, ancestor);
    } else if (target && !workspaceOrder.some(id => id !== "newProduct" && id === target) && modal) {
      // Payment completion replaces payment; ordinary popups retain their caller.
      if (!(modal === "payment" && target === "receipt")) parents.push(modal);
    } else {
      modalParents.current = [];
    }
    setModalState(target);
  }
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
  const [checkedScale, setCheckedScale] = useState<{priceOverride?:number;scaleWeight?:number;saleUnit?:'pack'}|null>(null);
  const [payments, setPayments] = useState<Payment[]>([]),
    [splitPayment, setSplitPayment] = useState(false),
    [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash"),
    [processing, setProcessing] = useState(false);
  const [receiptId, setReceiptId] = useState(""),
    [now, setNow] = useState(Date.now());
  const [selectingReturn,setSelectingReturn] = useState(false);
  const [historyQuery, setHistoryQuery] = useState(""),
    [historyPage, setHistoryPage] = useState(0),
    [historyPageSize, setHistoryPageSize] = useState(() => Math.max(4, Math.floor((window.innerHeight - 240) / 77))),
    [returnTx, setReturnTx] = useState<Transaction | null>(null),
    [returns, setReturns] = useState<Record<string, number>>({}),
    [historyTab, setHistoryTab] = useState<"sales" | "audit" | "refunds">(
      "sales",
    ),
    [drawerOpen, setDrawerOpen] = useState(false);
  useEffect(() => {
    const updatePageSize = () => setHistoryPageSize(Math.max(4, Math.floor((window.innerHeight - 240) / 77)));
    window.addEventListener("resize", updatePageSize);
    return () => window.removeEventListener("resize", updatePageSize);
  }, []);
  useEffect(() => { setHistoryPage(0); }, [historyQuery, historyTab, selectingReturn]);
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
    selectedLine = current.lines.find((l) => l.id === selected);
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
    if (!modal) barcodeInputRef.current?.focus({ preventScroll: true });
  }, [modal]);
  useEffect(() => {
    let buffer = "",
      last = 0;
    function scan(e: KeyboardEvent) {
      if (modal || e.ctrlKey || e.altKey || e.metaKey || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target instanceof HTMLElement && e.target.isContentEditable))
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
  }, [modal, current]);
  const update = (sale: Sale) => dispatch({ type: "sale", sale }),
    announce = (s: string) => setToast(s);
  function open(m: Modal) {
    setError("");
    setInput("");
    setAux("");
    setModal(m);
  }
  function openNewProduct(barcode = "") {
    setDraftMode(modal === "products" ? productMode : "barcode");
    setProductReturn(modal === "products" ? "products" : modal === "inventory" ? "inventory" : null);
    const draft = emptyNewProduct(normalizeDigits(barcode).replace(/\D/g, ""));
    if(modal === "inventory" && receiveCategory) draft.category=receiveCategory;
    productBaseline.current = JSON.stringify(draft);
    setEditingProductId(null);
    setNewProduct(draft);
    open("newProduct");
  }
  function openEditProduct(product: Product) {
    setDraftMode(productEntryMode(product));
    setProductReturn("products");
    setEditingProductId(product.id);
    setNewProduct({barcode:product.barcode,scaleCode:product.scaleCode||"",name:product.name,category:product.category,price:String(product.price),cost:product.cost === undefined ? "" : String(product.cost),supplier:product.supplier || "",stock:String(product.stock),minStock:String(Math.max(1, product.minStock || 1)),unit:product.unit || "piece",tax:String(product.tax),packSize:String(product.packSize||""),packPrice:String(product.packPrice||""),packBarcode:product.packBarcode||"",wholesalePrice:String(product.wholesalePrice||""),wholesaleMinimum:String(product.wholesaleMinimum||"")});
    productBaseline.current = JSON.stringify({barcode:product.barcode,scaleCode:product.scaleCode||"",name:product.name,category:product.category,price:String(product.price),cost:product.cost === undefined ? "" : String(product.cost),supplier:product.supplier || "",stock:String(product.stock),minStock:String(Math.max(1, product.minStock || 1)),unit:product.unit || "piece",tax:String(product.tax),packSize:String(product.packSize||""),packPrice:String(product.packPrice||""),packBarcode:product.packBarcode||"",wholesalePrice:String(product.wholesalePrice||""),wholesaleMinimum:String(product.wholesaleMinimum||"")});
    open("newProduct");
  }
  function saveNewProduct(addToBasket = false, done?:()=>void) {
    const barcode = normalizeDigits(newProduct.barcode).replace(/\s/g, "");
    const scaleCode=normalizeDigits(newProduct.scaleCode).replace(/\D/g,"");
    const priceValue = Number(normalizeDigits(newProduct.price));
    const costValue = newProduct.cost ? Number(normalizeDigits(newProduct.cost)) : undefined;
    const stockValue = Number(normalizeDigits(newProduct.stock));
    const minStockValue = Number(normalizeDigits(newProduct.minStock));
    const taxValue = Number(normalizeDigits(newProduct.tax));
    if (draftMode === "barcode" && !/^\d{4,32}$/.test(barcode)) {setError("أدخل باركوداً رقمياً من 4 إلى 32 رقماً");return;}
    if (barcode && products.some(p => p.barcode === barcode && p.id !== editingProductId)) {setError("الباركود مسجل مسبقاً");return;}
    if(scaleCode&& !/^\d{5}$/.test(scaleCode)){setError("رمز الميزان يجب أن يكون 5 أرقام");return;}
    if(scaleCode&&products.some(p=>p.scaleCode===scaleCode&&p.id!==editingProductId)){setError("رمز الميزان مسجل مسبقاً");return;}
    if(scaleCode&&!['kg','g'].includes(newProduct.unit)){setError("رمز الميزان يتطلب وحدة وزن");return;}
    if (!newProduct.name.trim()) {setError("أدخل اسم الصنف");return;}
    if (!newProduct.price.trim() || !Number.isSafeInteger(priceValue) || priceValue < 0) {setError("أدخل سعر بيع صحيحاً");return;}
    if (!newProduct.cost.trim() || costValue === undefined || !Number.isSafeInteger(costValue) || costValue < 0) {setError("أدخل سعر شراء صحيحاً");return;}
    if (productReturn !== "inventory" && !newProduct.stock.trim()) {setError("أدخل كمية المخزون");return;}
    if (!validQuantity(stockValue,newProduct.unit,0,999999)) {setError("أدخل مخزوناً صحيحاً");return;}
    if (!newProduct.minStock.trim() || !Number.isSafeInteger(minStockValue) || minStockValue < 1 || minStockValue > 999999) {setError("أدخل حداً أدنى للمخزون من 1 إلى 999999");return;}
    if (draftMode === "manual" && !categories.some(c=>c.id!=="all" && c.id===newProduct.category)) {setError("اختر الفئة");return;}
    if (!Number.isFinite(taxValue) || taxValue < 0 || taxValue > 100) {setError("أدخل ضريبة من 0 إلى 100");return;}
    if(addToBasket && stockValue<(newProduct.unit==='piece'?1:0.001)){setError('أدخل مخزوناً ابتدائياً موجباً للإضافة إلى السلة');return;}
    approve(`${editingProductId ? "تعديل" : "تسجيل"} صنف · ${newProduct.name.trim()}`, async () => {
      try {
        const categoryInfo = categories.find(c => c.id === newProduct.category)!;
        const existing = editingProductId ? products.find(p => p.id === editingProductId) : undefined;
        if(existing && (existing.unit||'piece')!==newProduct.unit && [current,...state.held].some(sale=>sale.lines.some(l=>l.productId===existing.id))){setError('أزل الصنف من السلة والمبيعات المعلقة قبل تغيير وحدته');return;}
        let product: Product = {id:existing?.id || `custom-${uid()}`,...existing,custom:existing ? existing.custom : true,edited:!!existing,entryMode:draftMode,barcode,scaleCode:scaleCode||undefined,name:newProduct.name.trim(),category:newProduct.category,price:priceValue,cost:costValue,supplier:newProduct.supplier.trim(),stock:stockValue,minStock:minStockValue,unit:newProduct.unit,packSize:newProduct.unit==="piece" && newProduct.packSize!==""?Number(newProduct.packSize):undefined,packPrice:newProduct.unit==="piece" && newProduct.packPrice!==""?Number(newProduct.packPrice):undefined,packBarcode:newProduct.unit==="piece" && newProduct.packBarcode?newProduct.packBarcode:undefined,wholesalePrice:newProduct.wholesalePrice!==""?Number(newProduct.wholesalePrice):undefined,wholesaleMinimum:newProduct.wholesaleMinimum!==""?Number(newProduct.wholesaleMinimum):undefined,tax:taxValue,tone:categoryInfo.tone,discountable:true,available:existing?.available !== false};
        const optionsError=sellingOptionsError(product); if(optionsError){setError(optionsError);return;}
        product = await saveCloudProduct(product, !existing);
        if (existing) {updateRegisteredProduct(product);} else registerProduct(product);
        setCatalogVersion(v => v + 1);
        setCategory(product.category);
        setSearch("");
        setModal(productReturn);
        if(productReturn === "inventory"){setInventoryProductId(product.id);setReceiveBarcode(product.barcode);setReceiveCost(newProduct.cost);setReceiveCategory(product.category);}
        if(addToBasket) addProduct(product);
        announce(existing ? "تم تحديث الصنف" : "تم تسجيل الصنف");
        done?.();
      } catch (e) {setError(e instanceof Error ? e.message : "تعذر حفظ الصنف");}
    });
  }
  async function removeManagedProduct(product: Product) {
    try {
      await deleteCloudProduct(product);
      deleteRegisteredProduct(product.id);
      setFavorites(current => current.filter(id => id !== product.id));
      setCatalogVersion(version => version + 1);
      setModal("products");
      announce("تم حذف الصنف");
    } catch (e) {setError(e instanceof Error ? e.message : "تعذر حذف الصنف");}
  }
  async function toggleManagedProduct(product: Product) {
    try {
      const next = {...product, available: product.available === false};
      const saved = await saveCloudProduct(next, false);
      updateRegisteredProduct(saved);
      setCatalogVersion(version => version + 1);
      setModal("products");
      announce(saved.available === false ? "تم إيقاف الصنف" : "تم تفعيل الصنف");
    } catch (e) {setError(e instanceof Error ? e.message : "تعذر تحديث الصنف");}
  }
  async function toggleFavorite(product: Product) {
    const favorite = !favorites.includes(product.id);
    try {
      await saveCloudFavorite(product.id, favorite);
      const next = favorite ? [...favorites, product.id] : favorites.filter(id => id !== product.id);
      saveFavorites(next);
      setFavorites(next);
    } catch (e) {setError(e instanceof Error ? e.message : "تعذر حفظ المفضلة");}
  }
  function syncCloudStocks(productIds: string[]) {
    const uniqueProducts = [...new Set(productIds)].map(id => products.find(product => product.id === id)).filter((product): product is Product => !!product && !product.untracked);
    void Promise.all(uniqueProducts.map(saveCloudStock)).catch(() => setStorageWarning("تم تحديث المخزون محلياً، لكن تعذر مزامنته مع Supabase."));
  }
  function lookupReceiving() {
    const barcode=normalizeDigits(receiveBarcode.trim());
    const found=products.find(p=>productEntryMode(p)==='barcode'&&p.barcode===barcode);
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
  function receiveStock(done?:()=>void) {
    const quantity=Number(normalizeDigits(receiveQuantity));
    const product=products.find(p=>p.id===inventoryProductId);
    if(!product || product.available===false){setError("ابحث عن الباركود أولاً لتحديد الصنف");return;}
    if(!receiveBarcode.trim() || normalizeDigits(receiveBarcode.trim())!==product.barcode){setError("ابحث عن الباركود أولاً لتحديد الصنف الصحيح");return;}
    if(!validQuantity(quantity,product.unit,0.001,999999)){setError("أدخل كمية استلام صحيحة");return;}
    if(!receiveCategory || product.category!==receiveCategory){setError("اختر الفئة المطابقة للصنف");return;}
    if(!receiveCost.trim() || !Number.isSafeInteger(Number(receiveCost)) || Number(receiveCost)<0){setError("أدخل سعر الشراء");return;}
    approve(`استلام مخزون · ${product.name} · ${quantity}`,()=>{
      try{receiveInventory(product.id,quantity,Number(receiveCost));syncCloudStocks([product.id]);setCatalogVersion(v=>v+1);resetReceiving();setModal("inventory");announce("تم استلام المخزون وتسجيل الحركة");done?.();}
      catch(e){setError(e instanceof Error?e.message:"تعذر تحديث المخزون");}
    });
  }
  function close() {
    if (modalParents.current.length && modal !== "newProduct" && modal !== "receipt") { setModal(null); setError(""); return; }
    if (processing || modal === "receipt") return;
    if (modal === "payment" && payments.length) {
      setError("أكمل المبلغ المتبقي قبل مغادرة الدفع");
      return;
    }
    navigate(modal === "confirm" ? confirmationReturn.current : modal === "newProduct" ? productReturn : modal === "settings" && printerReturn ? printerReturn : null);
  }
  function approve(title: string, run: () => void) {
    setError("");
    dispatch({type: "audit", action: title, reason: aux || "تنفيذ العملية"});
    run();
  }
  function addProduct(p: Product, verified = false, scan?: {priceOverride?:number;scaleWeight?:number;saleUnit?:'pack'}) {
    if (p.available === false) {
      announce("الصنف غير متوفر");
      return;
    }
    if (p.age && !verified) {
      setPendingProduct(p);
      open("age");
      return;
    }
    const saleUnit = scan?.saleUnit || p.unit || 'piece';
    const old = current.lines.find(
      (l) => l.productId === p.id && lineUnit(l)===saleUnit && !l.discount && !l.note && !l.priceOverride && (saleUnit!=='pack'||l.packSize===p.packSize && l.packPrice===p.packPrice),
    );
    const basketQuantity=current.lines.filter(l=>l.productId===p.id).reduce((sum,l)=>sum+lineStockQuantity(l),0);
    const adding=scan?.scaleWeight || (saleUnit==='pack' ? p.packSize! : saleUnit==='piece' ? 1 : Math.min(1,roundQuantity(p.stock-basketQuantity)));
    if(!adding || adding<=0){announce('الصنف غير متوفر');return;}
    const addedQuantity=scan?.scaleWeight || saleUnit==='pack' ? 1 : adding;
    const addedId=uid();
    if(roundQuantity(basketQuantity+adding)>p.stock){announce("الكمية المطلوبة أكبر من المخزون المتاح");return;}
    if(old && old.quantity+addedQuantity>999){announce("الحد الأقصى للصنف 999. عدّل الكمية من السلة.");return;}
    update({
      ...current,
      lines: old && !scan?.priceOverride
        ? current.lines.map((l) =>
            l.id === old.id ? { ...l, quantity: roundQuantity(l.quantity + addedQuantity) } : l,
          )
        : [
            ...current.lines,
            { id: addedId, productId: p.id, quantity: addedQuantity, verified,saleUnit,packSize:saleUnit==='pack'?p.packSize:undefined,packPrice:saleUnit==='pack'?p.packPrice:undefined,priceOverride:scan?.priceOverride,scaleWeight:scan?.scaleWeight },
          ],
      ageRecords: verified
        ? [
            ...current.ageRecords,
            `${p.id}:سارة حسن:${new Date().toISOString()}`,
          ]
        : current.ageRecords,
    });
    if(saleUnit!=='piece') setSelected(old && !scan?.priceOverride ? old.id : addedId);
    if (verified)
      dispatch({ type: "audit", action: "التحقق من العمر", reason: p.name });
    setSearch("");
  }
  function addManualItem() {
    const amount = Number(normalizeDigits(input));
    if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 999999999) {setError("أدخل مبلغاً صحيحاً أكبر من صفر");return;}
    update({...current,lines:[...current.lines,{id:uid(),productId:manualItemProductId,quantity:1,saleUnit:"piece",priceOverride:amount,manualName:aux.trim()||"صنف يدوي"}]});
    setModal(null);
    announce("تمت إضافة الصنف اليدوي");
  }
  function changeSellingLine(next:Line): string | undefined {
    if (next.wholesale && (current.coupon || current.discount || current.lines.some(l=>l.discount))) return 'أزل الخصم أو الكوبون أولاً لتطبيق سعر الجملة';
    const original=current.lines.find(l=>l.id===next.id);
    if(original?.priceOverride!==undefined && (next.quantity!==1 || next.saleUnit!==original.saleUnit)) return 'أعد مسح ملصق الميزان لتغيير الكمية';
    if(!validQuantity(next.quantity,lineUnit(next))) return 'أدخل كمية صالحة حتى 999';
    const product=productById(next.productId);
    const others=current.lines.filter(l=>l.productId===next.productId&&l.id!==next.id).reduce((sum,l)=>sum+lineStockQuantity(l),0);
    if(roundQuantity(others+lineStockQuantity(next))>product.stock) return 'الكمية المطلوبة أكبر من المخزون المتاح';
    update({...current,lines:current.lines.map(l=>l.id===next.id?next:l)});
  }
  function quantity(line:Line,n:number) {
    const message=changeSellingLine({...line,quantity:roundQuantity(n)}); if(message) announce(message);
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
      try{changeInventory(current.lines.filter(l=>!productById(l.productId).untracked).map(l=>({productId:l.productId,quantity:-lineStockQuantity(l)})),"sale",current.id);syncCloudStocks(current.lines.map(line=>line.productId));setCatalogVersion(v=>v+1);}catch(e){announce(e instanceof Error?e.message:"تعذر تحديث المخزون");return;}
      dispatch({ type: "complete", payments: [] });
      setReceiptId(current.id);
      open("receipt");
      return;
    }
    setPayments([]);
    setSplitPayment(split);
    setPaymentMethod("cash");
    open("payment");
    setInput(String(totals.total));
  }
  function commitPayment(p: Payment) {
    const next = [...payments, p];
    setPayments(next);
    if (next.reduce((a, p) => a + p.amount, 0) === totals.total) {
      const id = current.id;
      try{changeInventory(current.lines.filter(l=>!productById(l.productId).untracked).map(l=>({productId:l.productId,quantity:-lineStockQuantity(l)})),"sale",id);syncCloudStocks(current.lines.map(line=>line.productId));setCatalogVersion(v=>v+1);}catch(e){setError(e instanceof Error?e.message:"تعذر تحديث المخزون");return;}
      dispatch({ type: "complete", payments: next });
      setReceiptId(id);
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
  function payCard() {
    const amount = Number(input);
    if (!Number.isSafeInteger(amount) || amount <= 0 || amount > remaining || (!splitPayment && amount !== remaining)) {
      setError(splitPayment ? "أدخل مبلغاً صحيحاً ضمن المتبقي" : "يجب أن يساوي مبلغ البطاقة المبلغ المطلوب");
      return;
    }
    commitPayment({id:uid(),method:"card",amount,tendered:amount,change:0});
    setError("");
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
  function saveReceipt(choice: "print" | "none") {
    const finish = () => {
      dispatch({type: "receipt", id: receiptId, method: choice === "print" ? "print-request (unconfirmed)" : "none"});
      setModal(modal === "invoice" ? "invoice" : null);
      setPayments([]);
      setDrawerOpen(false);
      setError("");
    };
    if (choice === "none") { finish(); return; }
    if (!printerSettings.enabled) { setError("الطباعة الحرارية غير مفعلة في الإعدادات"); return; }
    const tx = state.transactions.find(t => t.sale.id === receiptId);
    if (!tx) { setError("لم يُعثر على الإيصال في سجل المعاملات."); return; }
    if (busyRef.current) return;
    busyRef.current = true;
    const frame = document.createElement("iframe");
    frame.title = "طباعة الإيصال";
    frame.setAttribute("aria-hidden", "true");
    frame.style.cssText = "position:fixed;left:-10000px;top:0;width:400px;height:600px;border:0;";
    frame.onload = async () => {
      try {
        const win = frame.contentWindow;
        if (!win) throw new Error();
        await win.document.fonts.ready;
        win.addEventListener("afterprint", () => setTimeout(() => frame.remove(), 0), {once:true});
        win.focus();
        win.print();
        if (modal !== "invoice" && printerSettings.drawerKick && tx.payments.some(p => p.method === "cash")) {
          dispatch({type:"audit", action:"محاكاة نبضة درج النقد", reason:`طلب طباعة إيصال نقدي ${tx.sale.id}`});
        }
        finish();
        setTimeout(() => frame.remove(), 300000);
      } catch {
        frame.remove();
        setError("تعذر فتح نافذة الطباعة. حاول مجدداً.");
      } finally { busyRef.current = false; }
    };
    try {
      frame.srcdoc = thermalPrintDocument(salePrintReceipt(tx, printerSettings), printerSettings);
      document.body.appendChild(frame);
    } catch {
      frame.remove();
      busyRef.current = false;
      setError("تعذر تجهيز الإيصال للطباعة. حاول مجدداً.");
    }
  }
  const filtered = products.filter(
    (p) =>
      !p.untracked &&
      p.available !== false &&
      (!!search.trim() || productEntryMode(p) === "manual") &&
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
    manualItem: "صنف يدوي",
    coupon: "العروض والكوبونات",
    price: "التحقق من السعر",
    newProduct: draftMode === "manual" ? (editingProductId ? "تعديل صنف يدوي" : "إضافة صنف يدوي") : (editingProductId ? "تعديل صنف باركود" : "إضافة صنف باركود"),
    products: "إدارة الأصناف",
    inventory: "المخزون",
    reports: "التقارير",
    age: "التحقق من العمر",
    quantity: "تعديل الصنف",
    recall: "المبيعات المعلقة",
    cancel: "إلغاء البيع الحالي",
    payment: "إتمام الدفع",
    receipt: "إيصال البيع",
    invoice: "عرض الفاتورة",
    settings: "الإعدادات",
    audit: "سجل العمليات",
    history: "سجل المعاملات",
    refund: "استرجاع وإعادة المبلغ",
    drawer: "درج النقد",
    help: "المساعدة",
    confirm: "تأكيد العملية",
  };
  const workspace = modal && modal !== "newProduct" && workspaceOrder.includes(modal as Workspace) && !(modal === "history" && selectingReturn) ? modal as Workspace : null;
  const receivingSnapshot = JSON.stringify([inventoryProductId,receiveBarcode,receiveCost,receiveQuantity,receiveCategory]);
  const dirty = printerDirty || offersDirty || categoriesDirty || (modal === "newProduct" && JSON.stringify(newProduct) !== productBaseline.current) || (modal === "inventory" && receivingSnapshot !== receivingBaseline.current);
  useEffect(() => {
    if (!dirty) return;
    const preventDraftLoss = (event: BeforeUnloadEvent) => {event.preventDefault(); event.returnValue = "";};
    window.addEventListener("beforeunload", preventDraftLoss);
    return () => window.removeEventListener("beforeunload", preventDraftLoss);
  }, [dirty]);
  function performNavigation(target: Modal) {
    setPendingNavigation(null); setPrinterDirty(false); setOffersDirty(false);setCategoriesDirty(false);
    if(!(modal === "newProduct" && target === "inventory")){resetReceiving();}
    if(target === "audit") setHistoryTab("audit");
    if(target === "history") setHistoryTab("sales");
    open(target);
  }
  function saveBeforeLeaving() {
    if(!pendingNavigation) return;
    const target=pendingNavigation.target;
    setPendingNavigation(null);
    if(modal==="newProduct") {saveNewProduct(!productReturn && !editingProductId,()=>performNavigation(target));return;}
    if(modal==="inventory") {receiveStock(()=>performNavigation(target));return;}
    const saves=[printerDirty?printerSave.current:null,categoriesDirty?categorySave.current:null,offersDirty?offerSave.current:null].filter((save):save is (done:()=>void)=>void=>!!save);
    const next=()=>{const save=saves.shift();if(save) save(next);else performNavigation(target);};
    next();
  }
  function navigate(target: Modal) {
    if(target === modal) return;
    performNavigation(target);
  }
  function leaveWorkspace() {navigate(modal === "newProduct" ? productReturn : modal === "settings" && printerReturn ? printerReturn : null);}
  const matchingProducts = products.filter(p => {
    const threshold = p.minStock || 0;
    const matchesStatus = productStatus === "all"
      || (productStatus === "available" && p.stock > threshold)
      || (productStatus === "low" && p.stock > 0 && p.stock <= threshold)
      || (productStatus === "empty" && p.stock <= 0);
    return !p.untracked && productEntryMode(p) === productMode
      && (p.name.includes(productQuery.trim()) || p.barcode.includes(normalizeDigits(productQuery.trim())))
      && (productMode === "barcode" || productCategory === "all" || p.category === productCategory)
      && matchesStatus;
  });
  const historyTransactions = state.transactions.filter(transaction => transaction.sale.id.includes(historyQuery) && (!selectingReturn || transaction.status !== "void" && transaction.sale.lines.some(line => (transaction.refunded[line.id] || 0) < line.quantity)));
  const historyPageCount = Math.max(1, Math.ceil(historyTransactions.length / historyPageSize));
  const historyCurrentPage = Math.min(historyPage, historyPageCount - 1);
  const historyOffset = historyCurrentPage * historyPageSize;
  const printDocumentForLayer = printDocument;
  const pendingNavigationForLayer = pendingNavigation;
  function renderDialog(modal: Modal, background = false) {
    const workspace = modal && modal !== "newProduct" && workspaceOrder.includes(modal as Workspace) && !(modal === "history" && selectingReturn) ? modal as Workspace : null;
    const printDocument = background ? "" : printDocumentForLayer;
    const pendingNavigation = background ? null : pendingNavigationForLayer;
    return (
      <Dialog.Root key={modal || "sale"} modal={!background}
        open={modal !== null}
        onOpenChange={(v) => {
          if (!v && !background) {if(pendingNavigation) setPendingNavigation(null); else if(printDocument) setPrintDocument(""); else close();}
        }}
      >
        <Dialog.Portal>
          {!background && <Dialog.Overlay className={`dialog-overlay ${workspace ? "workspace-overlay" : ""}`} />}
          <Dialog.Content
            style={background ? {pointerEvents:"none", zIndex:45} : undefined}
            inert={background || undefined}
            onOpenAutoFocus={event => {if(background) event.preventDefault();}}
            onCloseAutoFocus={event => event.preventDefault()}
            className={`dialog-content ${workspace && !printDocument && !pendingNavigation ? "workspace-shell" : ""} ${printDocument ? "thermal-dialog" : modal === "payment" ? "payment-dialog" : modal === "newProduct" ? "management-dialog" : modal === "history" && selectingReturn ? "history-picker-dialog" : ""}`}
            dir="rtl"
            onEscapeKeyDown={(e) => {
              if (
                modal === "receipt" ||
                processing ||
                (modal === "payment" && payments.length)
              )
                e.preventDefault();
            }}
            onPointerDownOutside={(e) => {
              if (
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
                  {pendingNavigation ? "حفظ التغييرات؟" : printDocument ? "معاينة الطباعة الحرارية" : modal === "history" && selectingReturn ? "اختر فاتورة للاسترجاع" : modal ? titles[modal] : ""}
                </Dialog.Title>
              </div>
              {!processing && (modal !== "receipt" || !!printDocument) && (
                <Btn
                  variant="dialog-close-square"
                  label={pendingNavigation ? "العودة إلى التحرير" : printDocument ? `العودة إلى ${modal === "products" ? "الأصناف" : modal === "settings" ? "الإعدادات" : modal === "history" ? "المعاملات" : "الإيصال"}` : workspace && !printDocument ? modal === "newProduct" && productReturn ? productReturn === "inventory" ? "العودة إلى الاستلام" : "العودة إلى الأصناف" : modal === "settings" && printerReturn ? "العودة إلى الإيصال" : "العودة إلى شاشة البيع" : "إغلاق"}
                  onClick={() => (pendingNavigation ? setPendingNavigation(null) : printDocument ? setPrintDocument("") : workspace ? leaveWorkspace() : close())}
                >
                  <X size={20} aria-hidden="true"/>
                </Btn>
              )}
            </div>
            <div className="dialog-body">
              {printDocument && <div className="thermal-preview">
                {labelProduct && <label className="label-copies">عدد الملصقات<NumberStepper  min="1" max="100" value={labelCopies} onValueChange={value =>{const copies=value;setLabelCopies(copies);if(Number.isInteger(Number(copies))&&Number(copies)>=1&&Number(copies)<=100)previewProductLabel(labelProduct,copies);}}/></label>}
                {labelProduct && (!Number.isInteger(Number(labelCopies)) || Number(labelCopies)<1 || Number(labelCopies)>100) ? <p role="alert">أدخل عدد الملصقات من 1 إلى 100</p> : <iframe title="معاينة الإيصال الحراري" srcDoc={printDocument}/>}
              </div>}
              {pendingNavigation && <section className="unsaved-guard" role="alert" aria-label="حفظ التغييرات؟"><div className="form-actions"><button type="button" autoFocus className="btn primary" onClick={saveBeforeLeaving}>نعم</button><Btn onClick={()=>performNavigation(pendingNavigation.target)}>لا</Btn></div></section>}
              <div className="dialog-regular" hidden={!!printDocument || !!pendingNavigation}>
              {modal === "manualItem" && <><Field label="اسم الصنف (اختياري)" value={aux} onChange={setAux} placeholder="صنف يدوي"/><Field label="المبلغ" value={input} onChange={value=>setInput(value.replace(/\D/g,""))}/><Numpad value={input} onChange={setInput}/><Btn variant="primary full" onClick={addManualItem}>إضافة للسلة</Btn></>}
              {modal==='confirm'&&confirmation&&<><p>{confirmation.title}</p>{confirmation.reason&&<Field label="السبب" value={aux} onChange={setAux}/>}<Btn variant="primary full" disabled={confirmation.reason&&!aux.trim()} onClick={()=>confirmation.run(aux)}>تأكيد المتابعة</Btn><Btn variant="dialog-close-square" label="رجوع" onClick={()=>open(confirmationReturn.current)}><X size={20} aria-hidden="true"/></Btn></>}
                <div className="dialog-regular">
                  {modal === "newProduct" && (
                    <>
<div className="new-product-grid">
                        {draftMode === "barcode" && <div className="barcode-field"><label>الباركود<span aria-hidden="true"> *</span><input aria-required="true" autoFocus={!newProduct.barcode} inputMode="numeric" value={newProduct.barcode} onChange={e=>setNewProduct(v=>({...v,barcode:normalizeDigits(e.target.value).replace(/\D/g,'')}))}/></label>
                        </div>}
                        {draftMode === "manual" && <label>الفئة *<select required aria-required="true" value={newProduct.category} onChange={e=>setNewProduct(v=>({...v,category:e.target.value}))}>{categories.filter(c=>c.id!=="all").map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>}
                        <label>اسم الصنف<span aria-hidden="true"> *</span><input aria-required="true" autoFocus={draftMode === "manual" || !!newProduct.barcode} maxLength={120} value={newProduct.name} onChange={e=>setNewProduct(v=>({...v,name:e.target.value}))}/></label>
                        {newProduct.barcode&&products.some(p=>p.barcode===newProduct.barcode&&p.id!==editingProductId)&&<div className="duplicate-product new-product-wide" role="alert"><strong>هذا الباركود مسجل بالفعل</strong><span>{products.find(p=>p.barcode===newProduct.barcode)!.name} · {money(products.find(p=>p.barcode===newProduct.barcode)!.price)}</span></div>}
                        {productReturn!=="inventory" && <label>{editingProductId ? "كمية المخزون" : "المخزون الابتدائي"} *<input required aria-required="true" inputMode="decimal" value={newProduct.stock} onChange={e=>setNewProduct(v=>({...v,stock:normalizeDigits(e.target.value).replace(/[^\d.]/g,'')}))}/></label>}
                        <label>الحد الأدنى للمخزون *<NumberStepper required aria-required="true" aria-label="الحد الأدنى للمخزون" min={1} max={999999} step={1} value={newProduct.minStock} onValueChange={value=>setNewProduct(v=>({...v,minStock:value}))}/></label>
                        <label>سعر البيع<span aria-hidden="true"> *</span><input aria-label="سعر البيع" aria-required="true" inputMode="numeric" value={newProduct.price} onChange={e=>setNewProduct(v=>({...v,price:normalizeDigits(e.target.value).replace(/\D/g,'')}))}/></label>
                        <label>سعر الشراء *<input required aria-required="true" aria-label="سعر الشراء" inputMode="numeric" value={newProduct.cost} onChange={e=>setNewProduct(v=>({...v,cost:normalizeDigits(e.target.value).replace(/\D/g,'')}))}/></label>
                      </div>
                      <div className="form-actions"><Btn variant="primary" onClick={()=>saveNewProduct(!productReturn && !editingProductId)}>{editingProductId ? "حفظ التعديلات" : !productReturn ? "حفظ وإضافة للسلة" : "حفظ الصنف"}</Btn><Btn onClick={() => navigate(productReturn)}>إلغاء</Btn>{editingProductId && products.find(product=>product.id===editingProductId)?.custom && <Btn variant="danger" disabled={current.lines.some(line=>line.productId===editingProductId)||state.transactions.some(transaction=>transaction.sale.lines.some(line=>line.productId===editingProductId))} onClick={()=>{const product=products.find(item=>item.id===editingProductId);if(product)void removeManagedProduct(product);}}>حذف الصنف</Btn>}</div>
                    </>
                  )}
                  {modal === "products" && (
                    <>

                      <div className="product-mode-tabs" role="tablist" aria-label="نوع الأصناف">{([{id:"barcode",label:"أصناف الباركود"},{id:"manual",label:"الأصناف اليدوية"}] as const).map(tab=><button type="button" role="tab" aria-selected={productMode===tab.id} className={`btn ${productMode===tab.id?"active":""}`} key={tab.id} onClick={()=>{setProductMode(tab.id);setProductQuery("");}}>{tab.label}</button>)}</div>
                      <div className="management-toolbar"><Field label={productMode === "manual" ? "بحث باسم الصنف" : "بحث عن صنف بالاسم أو الباركود"} value={productQuery} onChange={setProductQuery}/>{productMode === "manual" && <label>الفئة<select value={productCategory} onChange={e=>setProductCategory(e.target.value)}><option value="all">كل الفئات</option>{categories.filter(c=>c.id!=="all").map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>}<label>الحالة<select value={productStatus} onChange={e=>setProductStatus(e.target.value)}><option value="all">كل الأصناف</option><option value="available">متوفر</option><option value="low">منخفض</option><option value="empty">نفد</option></select></label><Btn variant="primary" onClick={()=>openNewProduct()}>إضافة</Btn></div>
                      <PaginatedProductList showBarcode={productMode === "barcode"} items={matchingProducts} filterKey={`${productMode}|${productQuery}|${productCategory}|${productStatus}`} renderItem={product=>{
                          const low=product.stock <= (product.minStock || 0);
                          return <tr className={`managed-product ${product.available===false?'disabled':''}`} key={product.id}>
                            <th scope="row"><strong>{product.name}</strong></th>
                            <td className="product-numeric">{money(product.price)}{product.unit && product.unit!=="piece" && <small> / {unitLabels[product.unit]}</small>}</td>
                            <td className="product-numeric">{product.stock}{product.unit && product.unit!=="piece" && <small> {unitLabels[product.unit]}</small>}</td>
                            <td><span className={`stock-status-badge ${product.stock<=0?'stock-empty':low?'stock-low':'stock-available'}`}>{product.stock<=0?'نفد':low?'منخفض':'متوفر'}</span></td>
                            {productMode === "barcode" && <td className="product-barcode"><bdi>{product.barcode}</bdi></td>}
                            <td>
                            <div className="managed-product-actions">{productMode === "manual" && <button className="btn favorite-toggle" aria-label={`${favorites.includes(product.id)?"إزالة من المفضلة":"إضافة إلى المفضلة"} · ${product.name}`} aria-pressed={favorites.includes(product.id)} onClick={()=>void toggleFavorite(product)}><Star size={20} fill={favorites.includes(product.id)?"currentColor":"none"}/></button>}<Btn onClick={()=>openEditProduct(product)}>تعديل</Btn>{product.custom&&<Btn onClick={()=>void toggleManagedProduct(product)}>{product.available===false?'تفعيل':'إيقاف'}</Btn>}</div>
                            </td></tr>;
                        }} />
                    </>
                  )}
                  {modal === "inventory" && (
                    <>
                      <div className="inventory-receive">
                        <label className="receiving-product">الفئة<select value={receiveCategory} onChange={e=>{setReceiveCategory(e.target.value);setInventoryProductId("");setReceiveCost("");setError("");}}><option value="">اختر الفئة</option>{categories.filter(c=>c.id!=="all").map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
                        <div className="receiving-search" onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();lookupReceiving();}}}><label>باركود<input autoFocus inputMode="numeric" value={receiveBarcode} onChange={e=>{setReceiveBarcode(normalizeDigits(e.target.value));setInventoryProductId("");setReceiveCost("");}}/></label><Btn onClick={lookupReceiving}>بحث</Btn></div>
                        {inventoryProductId && <div className="receiving-product receiving-match" role="status"><strong>{productById(inventoryProductId).name}</strong><small>المتوفر: {productById(inventoryProductId).stock}</small></div>}
                        <label>سعر القطعة<input inputMode="numeric" value={receiveCost} onChange={e=>setReceiveCost(normalizeDigits(e.target.value))}/></label><label>الكمية المستلمة<input inputMode="decimal" value={receiveQuantity} onChange={e=>setReceiveQuantity(normalizeDigits(e.target.value).replace(/[^\d.]/g,''))}/></label>
                        <div className="receiving-actions"><Btn variant="primary" onClick={()=>receiveStock()}>تأكيد الاستلام</Btn></div>
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
                          } else if (validQuantity(n,lineUnit(selectedLine))) {
                            const message=changeSellingLine({...selectedLine,quantity:n,note:aux});
                            if(message){setError(message);return;}
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
                        autoFocus
                        selectOnFocus
                        value={input}
                        onChange={(v) => {
                          setInput(v);
                          const match=findBarcode(v);setCheckedProduct(match?.product||null);setCheckedScale(match);
                        }}
                        placeholder="100001"
                      />
                        <div className="choice-list price-choice-list">
                          {(checkedProduct
                            ? [{product:checkedProduct,scan:checkedScale}]
                            : products.filter(
                              (p) => !p.untracked &&
                                input &&
                                (p.name.includes(input) ||
                                  p.barcode.includes(input)),
                            ).map(product=>({product,scan:null})))
                            .map(({product:p,scan}) => (
                              <div className="price-choice" key={p.id}>
                                <div className="price-choice-details">
                                  <span>{p.name}</span>
                                  <strong>{money(scan?.priceOverride ?? (scan?.saleUnit==='pack' ? p.packPrice! : p.price))}</strong>
                                </div>
                                <Btn variant="primary price-add" label={`إضافة ${p.name} إلى السلة`} onClick={() => {addProduct(p,false,scan||undefined);setModal(null);}}>إضافة للسلة</Btn>
                              </div>
                            ))}
                          {input &&
                            !checkedProduct &&
                            !products.some(
                              (p) =>
                                p.name.includes(input) ||
                                p.barcode.includes(input),
                            ) && <><p>الباركود غير معروف</p>{/^\d{4,32}$/.test(input)&&<Btn variant="full" onClick={()=>openNewProduct(input)}>تسجيل هذا الباركود كصنف جديد</Btn>}</>}
                        </div>
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
                        متابعة
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
                              {lineName(l)}
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
                                    dispatch({type:'recall',id:s.id});setModal(null);announce('تم استدعاء البيع');
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
                                <Btn variant="danger" label={`حذف البيع المعلق #${s.id}`} onClick={()=>{dispatch({type:'deleteHeld',id:s.id});announce('تم حذف البيع المعلق');}}>حذف</Btn>
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
                      <div className="payment-layout payment-cash-only">
                        <div className="payment-entry">
                          <div className="payment-methods payment-method-toggle" role="group" aria-label="طريقة الدفع">
                            <Btn variant={paymentMethod === "cash" ? "active" : ""} onClick={() => {setPaymentMethod("cash");setInput(String(remaining));}}>نقداً</Btn>
                            <Btn variant={paymentMethod === "card" ? "active" : ""} onClick={() => {setPaymentMethod("card");setInput(String(remaining));}}>بطاقة</Btn>
                          </div>
                          <Field
                            label={paymentMethod === "cash" ? "المبلغ المستلم" : "مبلغ البطاقة"}
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
                            <span>{paymentMethod === "cash" && Number(input) >= remaining ? "الباقي للعميل" : "المتبقي"}</span>
                            <strong>{money(paymentMethod === "cash" ? Math.abs((Number.isFinite(Number(input)) ? Number(input) : 0) - remaining) : Math.max(0, remaining - (Number.isFinite(Number(input)) ? Number(input) : 0)))}</strong>
                          </div>
                          <Btn variant="pay full" onClick={paymentMethod === "cash" ? payCash : payCard}>
                            {splitPayment && Number(input) < remaining ? "إضافة دفعة" : "دفع"}
                          </Btn>
                        </div>
                      </div>
                    </>
                  )}
                  {modal === "receipt" && (
                    <div className="receipt-actions">
                      <Btn variant="primary" disabled={!printerSettings.enabled} onClick={() => saveReceipt("print")}>طباعة</Btn>
                      <Btn onClick={() => saveReceipt("none")}>بدون طباعة</Btn>
                    </div>
                  )}
                  {modal === "invoice" && (() => {
                    const invoice = state.transactions.find(t => t.sale.id === receiptId);
                    return invoice ? <>
                      <Btn variant="primary full" disabled={!printerSettings.enabled} onClick={() => saveReceipt("print")}>طباعة</Btn>
                      <ReceiptPreview transaction={invoice} settings={printerSettings} />
                    </> : <p role="alert">لم يُعثر على الفاتورة.</p>;
                  })()}
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
                  {modal === "settings" && <PrinterSettings saveAction={printerSave} value={printerSettings} onSave={setPrinterSettings} onPreview={previewPrint} onDirtyChange={setPrinterDirty} categoriesContent={
                    <CategorySettings saveAction={categorySave} onSave={()=>setCatalogVersion(v=>v+1)} onDirtyChange={setCategoriesDirty} approve={approve}/>} offersContent={<OfferSettings autoSaveEnabled={!pendingNavigation} saveAction={offerSave} onDirtyChange={setOffersDirty} value={salesSettings} onSave={setSalesSettings} approve={approve}/>} demoContent={null}/>}
                  {modal === "drawer" && (
                    <div className="drawer-dialog-content">
                      {drawerOpen && <p role="status">تمت محاكاة فتح الدرج</p>}
                      {!drawerOpen ? (
                        <>
                          <label className="field"><span>سبب فتح الدرج</span><select value={aux} onChange={e=>setAux(e.target.value)}><option value="">اختر السبب</option>{printerSettings.drawerReasons.map(reason=><option key={reason} value={reason}>{reason}</option>)}</select></label>
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
                    </div>
                  )}
                  {(modal === "history" || modal === "audit") && (
                    <>
                      <Field
                        label={historyTab === 'audit' ? 'بحث في سجل العمليات' : 'بحث برقم الإيصال'}
                        value={historyQuery}
                        onChange={value => setHistoryQuery(historyTab === 'audit' ? value : value.replace(/\D/g, '').slice(0, 24))}
                      />
                      {historyTab === "sales" ? (<>
                        <div className="transaction-table-scroll">
                          <table className="transaction-table" dir="rtl">
                            <thead><tr><th scope="col">الفاتورة</th><th scope="col">الطريقة</th><th scope="col">المبلغ</th><th scope="col">الإجراء</th></tr></thead>
                            <tbody>
                          {historyTransactions
                            .slice(historyOffset, historyOffset + historyPageSize)
                            .map((t) => (
                              <tr key={t.sale.id}>
                                <th scope="row"><bdi>#{t.sale.id}</bdi></th>
                                <td>
                                  {t.payments
                                    .map((p) => methods[p.method])
                                    .join(" + ")}
                                </td>
                                <td className="transaction-amount">{money(t.total)}</td>
                                <td>
                                <div className="flex gap-2">
                                  <Btn onClick={() => { setReceiptId(t.sale.id); open("invoice"); }}>عرض الفاتورة</Btn>
                                  <Btn
                                    disabled={t.status === "void"}
                                    onClick={() => {
                                      setReturnTx(t);
                                      setReturns({});
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
                                          try{changeInventory(t.sale.lines.filter(l=>!productById(l.productId).untracked).map(l=>({productId:l.productId,quantity:lineStockQuantity(l)*(1-(t.refunded[l.id]||0)/l.quantity)})).filter(c=>c.quantity>0),"void",t.sale.id);syncCloudStocks(t.sale.lines.map(line=>line.productId));setCatalogVersion(v=>v+1);}catch(e){setError(e instanceof Error?e.message:"تعذر استعادة المخزون");return;}
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
                                      open("receipt");
                                    }}
                                  >
                                    <ReceiptText size={16} />
                                  </Btn></>}
                                </div>
                                </td>
                              </tr>
                            ))}
                          {!historyTransactions.length && (
                            <tr><td colSpan={5} className="empty">
                              {selectingReturn ? "لا توجد فواتير قابلة للاسترجاع مطابقة للبحث" : "لا توجد معاملات مطابقة"}
                            </td></tr>
                          )}
                            </tbody>
                          </table>
                        </div>
                        {historyTransactions.length > 0 && <div className="product-pagination-footer transaction-pagination-footer">
                          <span role="status">{`${historyOffset + 1}–${Math.min(historyOffset + historyPageSize, historyTransactions.length)} / ${historyTransactions.length}`}</span>
                          <nav aria-label="صفحات الفواتير" dir="rtl">
                            <ReactPaginate pageCount={historyPageCount} forcePage={historyCurrentPage} onPageChange={({selected}) => setHistoryPage(selected)} disableInitialCallback pageRangeDisplayed={3} marginPagesDisplayed={1} previousLabel={<ChevronRight size={20}/>} nextLabel={<ChevronLeft size={20}/>} previousAriaLabel="الصفحة السابقة" nextAriaLabel="الصفحة التالية" ariaLabelBuilder={page => `الصفحة ${page}`} containerClassName="product-pagination" activeClassName="active" disabledClassName="disabled" />
                          </nav>
                        </div>}</>
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
                      {returnTx.sale.lines.map((l) => {
                        const max = roundQuantity(l.quantity - (returnTx.refunded[l.id] || 0));
                        return (
                          <label className="refund-line" key={l.id}>
                            <span>
                              {lineName(l)}
                              <small>المتاح للاسترجاع: {lineQuantityText(l,max)}</small>
                            </span>
                            <NumberStepper

                              min="0"
                              max={max}
                              step={['piece','pack'].includes(lineUnit(l)) || l.scaleWeight ? 1 : 0.001}
                              value={returns[l.id] || 0}
                              onValueChange={value =>
                                setReturns({
                                  ...returns,
                                  [l.id]: Math.max(
                                    0,
                                    Math.min(
                                      max,
                                      ['piece','pack'].includes(lineUnit(l)) || l.scaleWeight ? Math.floor(Number(value)||0) : roundQuantity(Number(value)||0),
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
                        {refundAllocations(
                          returnTx,
                          refundValue(returnTx, returns),
                          state.refunds,
                        ).map((a) => (
                          <p key={a.method}>
                            {methods[a.method as keyof typeof methods]}:{" "}
                            {money(a.amount)}
                          </p>
                        ))}
                      </div>
                      <label className="field">
                        <span>سبب الاسترجاع</span>
                        <select value={aux} onChange={e=>setAux(e.target.value)}>
                          <option value="">اختر السبب</option>
                          {printerSettings.refundReasons.map(reason=><option key={reason} value={reason}>{reason}</option>)}
                        </select>
                      </label>
                      {!printerSettings.refundReasons.length && <p className="muted">أضف أسباب الاسترجاع من الإعدادات ← المتجر.</p>}
                      <Btn
                        variant="danger full"
                        disabled={
                          !printerSettings.refundReasons.includes(aux) || !Object.values(returns).some(q=>q>0)
                        }
                        onClick={() =>
                          approve(
                            `استرجاع إلى الوسيلة الأصلية · ${money(refundValue(returnTx, returns))}`,
                            () => {
                              try{changeInventory(Object.entries(returns).filter(([,q])=>q>0).map(([lineId,q])=>{const line=returnTx.sale.lines.find(l=>l.id===lineId)!;return line&&!productById(line.productId).untracked?{productId:line.productId,quantity:lineStockQuantity(line)*(q/line.quantity)}:null;}).filter((change):change is {productId:string;quantity:number}=>!!change),"refund",returnTx.sale.id);syncCloudStocks(returnTx.sale.lines.map(line=>line.productId));setCatalogVersion(v=>v+1);}catch(e){setError(e instanceof Error?e.message:"تعذر استعادة المخزون");return;}
                              dispatch({
                                type: "refund",
                                id: returnTx.sale.id,
                                selected: returns,
                                reason: aux,
                                cash: false,
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
                      <p>ابحث عن الصنف باسمه أو امسح الباركود، ثم راجع السلة واختر الدفع.</p><p>للاسترجاع اختر بدء استرجاع وحدد الفاتورة. إعدادات الأجهزة والمتجر والإيصال متاحة في الإعدادات.</p>
                      <p>قارئ الباركود الذي يعمل كلوحة مفاتيح مدعوم. الأصناف متزامنة مع Supabase عند توفر الاتصال.</p>
                    </div>
                  )}
                </div>{" "}
              {modal === "payment" && paid > 0 && !processing && (
                <Btn
                  variant="danger full"
                  onClick={() =>
                    approve("عكس الدفعات الجزئية وإلغاء الدفع", () => {
                      dispatch({
                        type: "audit",
                        action: "عكس دفعات",
                        reason: payments
                          .map((p) => `${methods[p.method]}: ${p.amount}`)
                          .join(" / "),
                      });
                      setPayments([]);
                      setModal(null);
                      announce("تم عكس الدفعات. السلة محفوظة.");
                    })
                  }
                >
                  إلغاء الدفع وعكس المبالغ
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
    );
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
            <time className="catalog-clock" dateTime={clock.toISOString()}>{clock.toLocaleTimeString("en-GB", {hour: "2-digit", minute: "2-digit", second: "2-digit"})}</time>
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
              <div className={`rail-tool-cell ${visibleCategories[2]?.id === category ? "active" : ""}`}><Btn label="بدء استرجاع" onClick={() => {setSelectingReturn(true);setHistoryQuery("");open("history");setHistoryTab("sales");}}><History size={20}/></Btn></div>
              <div className={`rail-tool-cell ${visibleCategories[3]?.id === category ? "active" : ""}`}><Btn label="درج النقد" onClick={() => open("drawer")}><Banknote size={20}/></Btn></div>
              <div className="rail-tool-cell"><Btn label="الإعدادات والإدارة" onClick={() => open("products")}><ShoppingBag size={20}/></Btn></div>
              <div className="rail-tool-cell"><Btn label="الإعدادات" onClick={() => {setPrinterReturn(null);open("settings");}}><SettingsIcon size={20}/></Btn></div>
              <div className="rail-tool-cell"><Btn label="المساعدة" onClick={() => open("help")}><CircleHelp size={20}/></Btn></div>
            </div>

                <Btn label="التقارير" onClick={() => open("reports")}><BarChart3 size={20}/></Btn>
                <Btn label="التحقق من السعر" onClick={() => {setCheckedProduct(null);setCheckedScale(null);open("price");}}><ScanBarcode size={20}/></Btn>
              </div>
        </section>
        <aside className="basket" aria-label="سلة البيع">
          <div className="order-header">
            <div>
              <h2 className="basket-title">السلة</h2>
            </div>
            <div className="basket-header-actions">
                <Btn label="حفظ في المبيعات المعلقة" disabled={!current.lines.length} onClick={() => {dispatch({type:"sale",sale:{...current,note:productById(current.lines[0]?.productId)?.name || "طلب معلق"}});dispatch({type:"hold"});announce("تم تعليق البيع");}}><Pause size={20}/></Btn>
                <Btn label="المبيعات المعلقة" onClick={() => open("recall")}><Undo2 size={20}/></Btn>
            </div>
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
                    <div className="line-main" onClick={() => setSelected(selected === l.id ? null : l.id)}>
                      <button
                        className="line-name"
                        aria-expanded={selected===l.id}
                        aria-controls={`selling-${l.id}`}
                      >
                        <b className="line-quantity">{l.scaleWeight || l.quantity}</b>
                        <span>
                          {lineName(l)}
                          {p.age && <ShieldCheck size={12} />}
                        </span>
                      </button>
                      <div className="line-summary">
                        <strong>{amountText(row.net)}</strong>
                        <button
                          className="line-remove"
                          aria-label={`حذف ${lineName(l)} من السلة`}
                          onClick={(event) => { event.stopPropagation(); remove(l.id); }}
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
                    {(l.saleUnit==='pack' || (l.saleUnit && l.saleUnit!=='piece') || row.wholesaleSaving>0) && <small className="selling-line-label">{lineQuantityText(l)}{row.wholesaleSaving>0?' · جملة':''}</small>}
                    {selected===l.id && !p.untracked && <BasketSellingOptions key={l.id} line={l} product={p} wholesale={row.wholesaleSaving>0} wholesalePrice={p.wholesalePrice ?? salesSettings.wholesale[p.id]?.price} onChange={changeSellingLine}/>}

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
              <Btn onClick={() => open("manualItem")}>صنف يدوي</Btn>
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
      {modalParents.current.map(parent => renderDialog(parent, true))}
      {renderDialog(modal)}
    </div>
  );
}


