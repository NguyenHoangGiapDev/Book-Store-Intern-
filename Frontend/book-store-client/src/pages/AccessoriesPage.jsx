import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { getCategories } from "../services/categoryService.js";
import { fetchAllProducts, bookCategoryId, bookCategoryName } from "../utils/bookDisplay.js";
import { filterAccessories } from "../utils/accessoriesCatalog.js";
import ProductBookCard from "../components/catalog/ProductBookCard.jsx";

const ITEMS_PER_PAGE = 8;

const normalizeCategory = (raw) => {
  const id = raw?.id ?? raw?.Id;
  const name = raw?.name ?? raw?.Name ?? "";
  if (id == null || name === "") return null;
  return { id: Number(id), name };
};

export default function AccessoriesPage() {
  const [books, setBooks] = useState([]);
  const [apiCategories, setApiCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const categoryParam = searchParams.get("category");
  const [sortOption, setSortOption] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetchAllProducts()
      .then((combined) => setBooks(combined))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    getCategories().then((data) => {
      const list = Array.isArray(data) ? data.map(normalizeCategory).filter(Boolean) : [];
      setApiCategories(list);
    });
  }, []);

  const pool = useMemo(() => filterAccessories(books, apiCategories), [books, apiCategories]);

  const navCategories = useMemo(() => {
    const m = new Map();
    pool.forEach((b) => {
      const id = bookCategoryId(b);
      const name = bookCategoryName(b);
      if (id != null && name) m.set(Number(id), { id: Number(id), name });
    });
    return [...m.values()].sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }, [pool]);

  const countsByCategoryId = useMemo(() => {
    const m = new Map();
    pool.forEach((b) => {
      const id = bookCategoryId(b);
      if (id == null) return;
      m.set(Number(id), (m.get(Number(id)) || 0) + 1);
    });
    return m;
  }, [pool]);

  const activeCategoryId = useMemo(() => {
    if (!categoryParam) return null;
    const n = Number(categoryParam);
    if (!Number.isFinite(n)) return null;
    return navCategories.some((c) => c.id === n) ? n : null;
  }, [categoryParam, navCategories]);

  useEffect(() => {
    setCurrentPage(1);
    window.scrollTo(0, 0);
  }, [categoryParam, sortOption]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const setCategoryInUrl = (id) => {
    const next = new URLSearchParams(searchParams);
    if (id == null) next.delete("category");
    else next.set("category", String(id));
    setSearchParams(next);
  };

  const filtered = useMemo(() => {
    let r = [...pool];
    if (activeCategoryId != null) r = r.filter((b) => Number(bookCategoryId(b)) === activeCategoryId);
    if (sortOption === "price_asc") r.sort((a, b) => a.price - b.price);
    else if (sortOption === "price_desc") r.sort((a, b) => b.price - a.price);
    else if (sortOption === "stock") r.sort((a, b) => b.stockQuantity - a.stockQuantity);
    else r.sort((a, b) => b.id - a.id);
    return r;
  }, [pool, activeCategoryId, sortOption]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handlePageChange = (p) => { setCurrentPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); };

  return (
    <div className="books-page bg-light pb-4 pb-lg-5">
      <div className="container py-2">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item"><Link to="/" className="text-decoration-none text-dark fw-medium">Trang chủ</Link></li>
            <li className="breadcrumb-item active" aria-current="page">Phụ kiện</li>
          </ol>
        </nav>
      </div>

      <div className="container">

        <div className="books-toolbar card border-0 rounded-4 mb-3 mb-md-4">
          <div className="card-body p-3 px-4 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
            <div>
              <h4 className="fw-bold mb-1">PHỤ KIỆN</h4>
              <span className="text-muted small">{`${filtered.length} sản phẩm`}</span>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span className="text-nowrap fw-medium small">Sắp xếp:</span>
              <select className="form-select form-select-sm border-0 bg-light fw-medium rounded-pill" style={{ minWidth: 170, cursor: 'pointer' }} value={sortOption} onChange={(e)=>{setSortOption(e.target.value); setCurrentPage(1);}}>
                <option value="newest">Mới nhất</option>
                <option value="stock">Còn nhiều hàng</option>
                <option value="price_asc">Giá: Thấp → Cao</option>
                <option value="price_desc">Giá: Cao → Thấp</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="row g-4">{[...Array(8)].map((_,i)=>(<div key={i} className="col-xl-3 col-lg-4 col-md-4 col-sm-6"><div className="skeleton" style={{height:200}}/></div>))}</div>
        ) : (
          <>
            <div className="row g-4">
              {paginated.map((book, i)=> (
                <ProductBookCard key={book.id} book={book} delay={(i%4)*100+100} listingHref={`${location.pathname}${location.search}`} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="d-flex justify-content-center mt-5">
                <ul className="pagination custom-pagination">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button type="button" className="page-link" onClick={()=> handlePageChange(currentPage - 1)}><i className="bi bi-chevron-left"></i></button>
                  </li>
                  {[...Array(totalPages)].map((_, idx)=>{
                    const p = idx+1;
                    if (p === 1 || p === totalPages || (p >= currentPage - 2 && p <= currentPage + 2)) {
                      return (<li key={p} className={`page-item ${currentPage === p ? 'active' : ''}`}><button type="button" className="page-link" onClick={()=> handlePageChange(p)}>{p}</button></li>);
                    }
                    if (p === currentPage - 3 || p === currentPage + 3) {
                      return (<li key={p} className="page-item disabled"><span className="page-link">…</span></li>);
                    }
                    return null;
                  })}
                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button type="button" className="page-link" onClick={()=> handlePageChange(currentPage + 1)}><i className="bi bi-chevron-right"></i></button>
                  </li>
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
