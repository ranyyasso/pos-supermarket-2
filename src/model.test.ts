import { describe, it, expect } from "vitest";
import {
  newSale,
  price,
  cashPayment,
  couponError,
  discountConflict,
  legacyPrice,
  seed,
  reducer,
  refundValue,
  refundAllocations,
  ean13CheckDigit,
  type Transaction,
} from "./model";
const sale = () => ({
  ...newSale(1),
  lines: [{ id: "a", productId: "p1", quantity: 2 }],
});
describe("IQD pricing", () => {
  it("calculates the EAN-13 check digit used by scale labels",()=>{
    expect(ean13CheckDigit('201234501250')).toBe(9);
    expect(ean13CheckDigit('bad')).toBe(-1);
  });
  it("calculates subtotal and tax as integer IQD", () => {
    const t = price(sale());
    expect(t.subtotal).toBe(16000);
    expect(t.tax).toBe(1600);
    expect(t.total).toBe(17600);
  });
  it("uses only configured wholesale prices at their minimum quantity", () => {
    const settings = {wholesaleEnabled:true,wholesale:{p1:{price:7000,minimum:2}}};
    const wholesale = price({...sale(),service:'dinein'},settings);
    expect(wholesale.rows[0].gross).toBe(14000);
    expect(wholesale.wholesaleSaving).toBe(2000);
    expect(wholesale.total).toBe(15400);
    expect(price({...sale(),service:'dinein',lines:[{id:'a',productId:'p1',quantity:1}]},settings).subtotal).toBe(8000);
    expect(price({...sale(),service:'dinein'},{...settings,wholesaleEnabled:false}).subtotal).toBe(16000);
    expect(price({...sale(),service:'dinein'}, {...settings,wholesale:{}}).subtotal).toBe(16000);
  });
  it("prevents combining item and basket discounts, retaining historical calculations", () => {
    const s = sale();
    s.lines = [
      {
        ...s.lines[0],
        discount: { kind: "percent", value: 10 },
      } as (typeof s.lines)[0],
    ];
    const t = price({ ...s, discount: { kind: "percent", value: 10 } });
    expect(t.total).toBe(15840);
    expect(discountConflict({...s,discount:{kind:"percent",value:10}})).toBeDefined();
    expect(legacyPrice({...s,discount:{kind:"percent",value:10}}).total).toBe(14256);
  });
  it("automatically applies cola pairs and reverses when quantity drops", () => {
    const s = {
      ...newSale(2),
      lines: [{ id: "b", productId: "p10", quantity: 3 }],
    };
    expect(price(s).promotions).toBe(2000);
    expect(
      price({ ...s, lines: [{ ...s.lines[0], quantity: 1 }] }).promotions,
    ).toBe(0);
  });
  it("allows discounts on kids supermarket supplies", () => {
    const t = price({
      ...newSale(3),
      discount: { kind: "percent" as const, value: 50 },
      lines: [{ id: "a", productId: "p11", quantity: 1 }],
    });
    expect(t.basketDiscount).toBe(2500);
    expect(t.total).toBe(2750);
  });
  it("checks coupon eligibility and stacking", () => {
    expect(couponError("BAD", sale())).toBeTruthy();
    expect(couponError("EXPIRED", sale())).toContain("انتهت");
    expect(couponError("DESSERT5", sale())).toBeTruthy();
    expect(couponError("WELCOME10", sale())).toBeUndefined();
    expect(
      couponError("WELCOME10", {
        ...sale(),
        discount: { kind: "fixed", value: 5 },
      }),
    ).toBeTruthy();
  });
  it("caps excessive discounts at eligible value", () => {
    expect(
      price({ ...sale(), discount: { kind: "fixed", value: 999999 } }).total,
    ).toBe(0);
  });
  it("allocates rounding without losing dinars", () => {
    const s = {
      ...sale(),
      lines: [...sale().lines, { id: "b", productId: "p3", quantity: 1 }],
      discount: { kind: "fixed" as const, value: 101 },
    };
    const t = price(s);
    expect(t.rows.reduce((a, r) => a + r.basketDiscount, 0)).toBe(101);
    expect(t.rows.reduce((a, r) => a + r.total, 0)).toBe(t.total);
  });
});
describe("payments and transactions", () => {
  it("rejects insufficient tender and invalid amounts", () => {
    expect(() => cashPayment(10000, 5000)).toThrow();
    expect(() => cashPayment(10000, NaN)).toThrow();
    expect(() => cashPayment(10000, -1)).toThrow();
  });
  it("calculates change only on the outstanding amount", () => {
    expect(cashPayment(5000, 10000, true)).toMatchObject({
      amount: 5000,
      change: 5000,
    });
    expect(cashPayment(10000, 4000, true)).toMatchObject({
      amount: 4000,
      change: 0,
    });
  });
  it("holds and recalls the complete sale", () => {
    const s = seed(),
      held = reducer(s, { type: "hold" });
    expect(held.sale.lines).toHaveLength(0);
    expect(held.held[0]).toEqual(s.sale);
    expect(reducer(held, { type: "recall", id: s.sale.id }).sale).toEqual(
      s.sale,
    );
  });
  it("refuses incomplete and duplicate sale completion", () => {
    const s = seed(),
      total = price(s.sale).total;
    expect(
      reducer(s, { type: "complete", payments: [cashPayment(total, 1, true)] })
        .transactions,
    ).toHaveLength(0);
    const done = reducer(s, {
      type: "complete",
      payments: [cashPayment(total, total)],
    });
    expect(done.transactions).toHaveLength(1);
    expect(
      reducer(done, {
        type: "complete",
        payments: done.transactions[0].payments,
      }).transactions,
    ).toHaveLength(1);
  });
  it("preserves exact totals across incremental refunds", () => {
    const s = sale(),
      total = price(s).total;
    let tx: Transaction = {
      sale: s,
      total,
      payments: [cashPayment(total, total)],
      status: "completed",
      refunded: {},
    };
    const first = refundValue(tx, { a: 1 });
    tx = { ...tx, refunded: { a: 1 } };
    expect(first + refundValue(tx, { a: 1 })).toBe(total);
    expect(() => refundValue(tx, { a: 2 })).toThrow();
  });
  it("prevents repeat void and refunds on a void", () => {
    let s = seed();
    const total = price(s.sale).total;
    s = reducer(s, { type: "complete", payments: [cashPayment(total, total)] });
    s = reducer(s, { type: "void", id: "553", reason: "test" });
    expect(s.refunds).toHaveLength(1);
    expect(
      reducer(s, { type: "void", id: "553", reason: "test" }).refunds,
    ).toHaveLength(1);
    expect(() => refundValue(s.transactions[0], { a: 1 })).toThrow();
  });
  it("allocates refunds within each original payment cap", () => {
    const tx: Transaction = {
      sale: sale(),
      total: 17600,
      payments: [
        cashPayment(17600, 5000, true),
        { id: "c", method: "card", amount: 12600, tendered: 12600, change: 0 },
      ],
      status: "completed",
      refunded: {},
    };
    expect(refundAllocations(tx, 8800, [])).toEqual([
      { method: "cash", amount: 5000 },
      { method: "card", amount: 3800 },
    ]);
  });
});
it('deletes only the selected held sale without touching active basket or transactions',()=>{
 const state=reducer(seed(),{type:'hold'});const result=reducer(state,{type:'deleteHeld',id:state.held[0].id});
 expect(result.held).toHaveLength(0);expect(result.sale).toBe(state.sale);expect(result.transactions).toBe(state.transactions);expect(result.audit[0].action).toBe('حذف بيع معلق');expect(reducer(result,{type:'deleteHeld',id:'missing'})).toBe(result);
});
