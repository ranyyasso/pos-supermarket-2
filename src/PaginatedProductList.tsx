import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import ReactPaginate from 'react-paginate';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function PaginatedProductList<T>({items, filterKey, renderItem, showBarcode = true}: {items: T[]; filterKey: string; renderItem: (item: T) => ReactNode; showBarcode?: boolean}) {
  const root = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [capacity, setCapacity] = useState(8);
  useLayoutEffect(() => { setPage(0); }, [filterKey]);
  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const measure = () => {
      const top = element.getBoundingClientRect().top;
      const rows = element.querySelectorAll<HTMLElement>('.managed-product');
      const rowHeight = Math.max(72, ...Array.from(rows, row => row.getBoundingClientRect().height));
      const headerHeight = element.querySelector('thead')?.getBoundingClientRect().height || 48;
      const bottom = Math.min(window.innerHeight, element.closest('.dialog-content')?.getBoundingClientRect().bottom || window.innerHeight);
      setCapacity(Math.max(1, Math.floor((bottom - top - 88 - headerHeight) / rowHeight)));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    if (element.previousElementSibling) observer.observe(element.previousElementSibling);
    measure();
    window.addEventListener('resize', measure);
    return () => {observer.disconnect(); window.removeEventListener('resize', measure);};
  }, [items.length]);
  const pages = Math.max(1, Math.ceil(items.length / capacity));
  const current = Math.min(page, pages - 1);
  const offset = current * capacity;
  return <div ref={root} className="paginated-products">
    <div className="product-table-container"><table className="product-management-table" dir="rtl">
      <colgroup><col style={{width:showBarcode?'27%':'37%'}}/><col style={{width:'12%'}}/><col style={{width:'8%'}}/><col style={{width:showBarcode?'15%':'20%'}}/>{showBarcode && <col style={{width:'17%'}}/>}<col style={{width:'21%'}}/></colgroup>
      <thead><tr><th scope="col">اسم الصنف</th><th scope="col">السعر</th><th scope="col">الكمية</th><th scope="col">الحالة</th>{showBarcode && <th scope="col">الباركود</th>}<th scope="col">الإجراءات</th></tr></thead>
      <tbody>{items.slice(offset, offset + capacity).map(renderItem)}</tbody>
    </table></div>
    <div className="product-pagination-footer">
      <span role="status">{items.length ? `${offset + 1}–${Math.min(offset + capacity, items.length)} / ${items.length}` : 'لا توجد أصناف مطابقة'}</span>
      <nav aria-label="صفحات الأصناف" dir="rtl">
        <ReactPaginate pageCount={pages} forcePage={current} onPageChange={({selected}) => setPage(selected)} disableInitialCallback pageRangeDisplayed={3} marginPagesDisplayed={1} previousLabel={<ChevronRight size={20}/>} nextLabel={<ChevronLeft size={20}/>} previousAriaLabel="الصفحة السابقة" nextAriaLabel="الصفحة التالية" ariaLabelBuilder={n => `الصفحة ${n}`} containerClassName="product-pagination" activeClassName="active" disabledClassName="disabled" />
      </nav>
    </div>
  </div>;
}
