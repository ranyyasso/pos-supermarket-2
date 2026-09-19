import { lineName, lineQuantityText } from './model';
import { dateTime, money, legacyPrice, productById, type Transaction } from "./model";
import { printerDefaults, receiptNumber, type PrinterSettings } from './printing';
export function ReceiptPreview({ transaction, settings = printerDefaults }: { transaction: Transaction; settings?: PrinterSettings }) {
  const totals = transaction.pricing || legacyPrice(transaction.sale);
  return (
    <section className="receipt-paper" aria-label="معاينة الإيصال">
      <header>
        {settings.logoDataUrl && <img className="receipt-logo" src={settings.logoDataUrl} alt=""/>}
        <h3>{settings.merchant}</h3>
        <p>{settings.address}</p>
        {settings.phone && <p>الهاتف: {settings.phone}</p>}
        {settings.taxNumber && <p>الرقم الضريبي: {settings.taxNumber}</p>}
        <p>إيصال #{receiptNumber(transaction.sale.id, settings)}</p>
        <small>
          {dateTime(transaction.sale.createdAt)}
        </small>
      </header>
      <table>
        <thead>
          <tr>
            <th>الصنف</th>
            <th>العدد</th>
            <th>المبلغ</th>
          </tr>
        </thead>
        <tbody>
          {transaction.sale.lines.map((l) => (
            <tr key={l.id}>
              <td>{lineName(l)}</td>
              <td>{lineQuantityText(l)}</td>
              <td>{money(totals.rows.find((r) => r.id === l.id)!.net)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div>
        <span>المجموع قبل الخصم</span>
        <span>{money(totals.subtotal + (totals.wholesaleSaving || 0))}</span>
      </div>
      {totals.savings?.length ? totals.savings.map((saving,index)=><div key={index}><span>{saving.reason}</span><span>− {money(saving.amount)}</span></div>) : <div>
        <span>الخصومات والعروض</span>
        <span>
          {money(
            totals.itemDiscount +
              totals.promotions +
              totals.basketDiscount +
              totals.reward,
          )}
        </span>
      </div>}
      <div>
        <span>المبلغ الخاضع للضريبة</span>
        <span>{money(totals.taxable)}</span>
      </div>
      <div>
        <span>الضريبة</span>
        <span>{money(totals.tax)}</span>
      </div>
      <div className="receipt-total">
        <strong>الإجمالي</strong>
        <strong>{money(transaction.total)}</strong>
      </div>
      <footer>
        {transaction.status === "void" ? "معاملة ملغاة" : settings.footer}
      </footer>
    </section>
  );
}
