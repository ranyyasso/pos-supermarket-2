export type WholesaleRule = { price: number; minimum: number };
export type StoreOffer = { id: string; name: string; code: string; kind: 'percent' | 'fixed'; value: number; minimumSpend: number; category: string; active: boolean };
export type SalesSettings = { wholesaleEnabled: boolean; wholesale: Record<string, WholesaleRule>; demoMode?: boolean; offers?: StoreOffer[] };
export const salesSettingsKey = 'mizan-sales-settings-v1';
export const defaultSalesSettings = (): SalesSettings => ({ wholesaleEnabled: false, wholesale: {}, demoMode: true, offers: [] });
export function validOffer(offer: StoreOffer): boolean {
  return !!offer && typeof offer.id === 'string' && !!offer.id && typeof offer.name === 'string' && !!offer.name.trim() && typeof offer.code === 'string' && (!offer.code || /^[A-Z0-9_-]{2,32}$/.test(offer.code)) && ['percent','fixed'].includes(offer.kind) && Number.isSafeInteger(offer.value) && offer.value > 0 && (offer.kind !== 'percent' || offer.value <= 100) && Number.isSafeInteger(offer.minimumSpend) && offer.minimumSpend >= 0 && typeof offer.category === 'string' && typeof offer.active === 'boolean';
}
export function validWholesaleRule(value: unknown): value is WholesaleRule {
  const rule = value as WholesaleRule | null;
  return !!rule && Number.isSafeInteger(rule.price) && rule.price >= 0 && Number.isSafeInteger(rule.minimum) && rule.minimum >= 1 && rule.minimum <= 999;
}
export function loadSalesSettings(): SalesSettings {
  try {
    const value = JSON.parse(localStorage.getItem(salesSettingsKey) || 'null');
    if (!value || typeof value.wholesaleEnabled !== 'boolean' || !value.wholesale || typeof value.wholesale !== 'object') return defaultSalesSettings();
    const wholesale: Record<string, WholesaleRule> = {};
    for (const [id, rule] of Object.entries(value.wholesale)) if (validWholesaleRule(rule)) wholesale[id] = rule;
    return { wholesaleEnabled: value.wholesaleEnabled, wholesale, demoMode: value.demoMode !== false, offers: Array.isArray(value.offers) ? value.offers.filter(validOffer) : [] };
  } catch { return defaultSalesSettings(); }
}
export function saveSalesSettings(settings: SalesSettings) {
  if (Object.values(settings.wholesale).some(rule => !validWholesaleRule(rule))) throw new Error('أدخل سعر جملة صحيحاً وحداً أدنى من 1 إلى 999');
  if ((settings.offers || []).some(offer => !validOffer(offer))) throw new Error('بيانات العرض غير صالحة');
  const codes = (settings.offers || []).map(o => o.code).filter(Boolean);
  if (new Set(codes).size !== codes.length || codes.some(code => ['WELCOME10','DESSERT5','JUICE2'].includes(code))) throw new Error('رمز الكوبون مكرر أو محجوز للتجربة');
  localStorage.setItem(salesSettingsKey, JSON.stringify(settings));
}
