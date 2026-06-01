import { useEffect, useState, useMemo } from "react";
import { useSearchParams, Link, useLocation } from "react-router-dom";
import { getCategories } from "../services/categoryService.js";
import { bookCategoryId, bookCategoryName } from "../utils/bookDisplay.js";
import { apiRequest } from "../services/apiClient.js";
import { filterToysBooks, categoryNameIsToys, subcategoryList, classifyToyBook } from "../utils/toysCatalog.js";
import ProductBookCard from "../components/catalog/ProductBookCard.jsx";

const ITEMS_PER_PAGE = 8;

const normalizeCategory = (raw) => {
  const id = raw?.id ?? raw?.Id;
  const name = raw?.name ?? raw?.Name ?? "";
  if (id == null || name === "") return null;
  return { id: Number(id), name };
};

function ToysSkeletonGrid() {
  return (
    <div className="row g-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="col-xl-3 col-lg-4 col-md-4 col-sm-6">
          <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
            <div className="skeleton" style={{ height: "200px" }} />
            <div className="p-3">
              <div className="skeleton skeleton-text mb-2" style={{ height: "16px", width: "80%" }} />
              <div className="skeleton skeleton-text mb-2" style={{ height: "13px", width: "55%" }} />
              <div className="skeleton skeleton-text mb-3" style={{ height: "18px", width: "40%" }} />
              <div className="skeleton skeleton-text" style={{ height: "36px", borderRadius: "20px" }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ToysEmpty() {
  return (
    <div className="card border-0 shadow-sm rounded-4 text-center py-5">
      <div className="card-body">
        <div className="mb-3" style={{ fontSize: "56px", lineHeight: 1 }}>🧸</div>
        <h4 className="fw-bold text-dark mb-2">Chưa có sản phẩm đồ chơi</h4>
        <p className="text-muted mb-4 max-w-md mx-auto">
          Thêm danh mục phù hợp (tên chứa "đồ chơi", "lego", "mô hình"...) hoặc gán sản phẩm tương ứng —
          hệ thống sẽ tự động hiển thị tại đây.
        </p>
        <Link to="/books" className="btn btn-success rounded-pill px-4 fw-bold">
          <i className="bi bi-book me-2"></i>
          Xem kho sách
        </Link>
      </div>
    </div>
  );
}

function NoMatchInFilter() {
  return (
    <div className="card border-0 shadow-sm rounded-4 text-center py-5">
      <div className="card-body">
        <h4 className="fw-bold text-dark mb-2">Không có sản phẩm trong phân loại này</h4>
        <p className="text-muted mb-0">Thử chọn &quot;Tất cả sản phẩm&quot; hoặc phân loại khác.</p>
      </div>
    </div>
  );
}

function ToysPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiCategories, setApiCategories] = useState([]);

  const location = useLocation();
  const listingHrefForCards = `${location.pathname}${location.search}`;

  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParamRaw = searchParams.get("category");
  const subParamRaw = searchParams.get("sub");

  const [sortOption, setSortOption] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
  setLoading(true);
  setError(null);

  apiRequest("/toys")
    .then((data) => {
      const items = Array.isArray(data) ? data : [];
      setBooks(items.map(t => ({ ...t, originTable: "toys" })));
    })
    .catch((err) => setError(err.message))
    .finally(() => setLoading(false));
}, []);

  useEffect(() => {
    apiRequest("/toy-categories")
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setApiCategories(list.map(normalizeCategory).filter(Boolean));
      })
      .catch(() => setApiCategories([]));
  }, []);

  const hasToysCategoryInApi = useMemo(
    () => apiCategories.some((c) => categoryNameIsToys(c.name)),
    [apiCategories]
  );

  const toysPool = useMemo(() => filterToysBooks(books, apiCategories), [books, apiCategories]);

  const navCategories = useMemo(() => {
    const map = new Map();
    toysPool.forEach((b) => {
      const id = bookCategoryId(b);
      const name = bookCategoryName(b);
      if (id != null && name) map.set(Number(id), { id: Number(id), name });
    });
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }, [toysPool]);

  const countsByCategoryId = useMemo(() => {
    const m = new Map();
    toysPool.forEach((b) => {
      const id = bookCategoryId(b);
      if (id == null) return;
      const k = Number(id);
      m.set(k, (m.get(k) ?? 0) + 1);
    });
    return m;
  }, [toysPool]);

  const categoryParamNum = useMemo(() => {
    if (categoryParamRaw == null || categoryParamRaw === "") return null;
    const n = Number(categoryParamRaw);
    return Number.isFinite(n) ? n : null;
  }, [categoryParamRaw]);

  const activeCategoryId = useMemo(() => {
    if (categoryParamNum === null) return null;
    const exists = navCategories.some((c) => c.id === categoryParamNum);
    return exists ? categoryParamNum : null;
  }, [categoryParamNum, navCategories]);

  const activeSubKey = useMemo(() => {
    if (!subParamRaw) return null;
    // validate against known subcategories
    const keys = new Set(subcategoryList().map((s) => s.id));
    return keys.has(subParamRaw) ? subParamRaw : null;
  }, [subParamRaw]);

  useEffect(() => {
    setCurrentPage(1);
    window.scrollTo(0, 0);
  }, [categoryParamRaw, sortOption]);

  // reset page when subcategory changes as well
  useEffect(() => {
    setCurrentPage(1);
    window.scrollTo(0, 0);
  }, [subParamRaw]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const subCategories = useMemo(() => subcategoryList().map((s) => ({ id: s.id, name: s.name })), []);

  const countsBySubKey = useMemo(() => {
    const m = new Map();
    toysPool.forEach((b) => {
      const k = classifyToyBook(b, apiCategories);
      if (k == null) return;
      m.set(k, (m.get(k) ?? 0) + 1);
    });
    return m;
  }, [toysPool, apiCategories]);

  const setCategoryInUrl = (categoryId) => {
    const next = new URLSearchParams(searchParams);
    if (categoryId === null) {
      next.delete("category");
    } else {
      next.set("category", String(categoryId));
    }
    setSearchParams(next);
  };

  const setSubInUrl = (subKey) => {
    const next = new URLSearchParams(searchParams);
    if (subKey === null) next.delete("sub");
    else next.set("sub", String(subKey));
    setSearchParams(next);
  };

  const filteredItems = useMemo(() => {
  let result = [...toysPool];

  if (activeSubKey) {
    result = result.filter((b) => classifyToyBook(b, apiCategories) === activeSubKey);
  }

  if (activeCategoryId !== null) {
    result = result.filter((b) => Number(bookCategoryId(b)) === activeCategoryId);
  }

  if (sortOption === "price_asc") result.sort((a, b) => a.price - b.price);
  else if (sortOption === "price_desc") result.sort((a, b) => b.price - a.price);
  else if (sortOption === "newest") result.sort((a, b) => b.id - a.id);
  else if (sortOption === "stock") result.sort((a, b) => b.stockQuantity - a.stockQuantity);

  return result;
}, [toysPool, activeSubKey, activeCategoryId, sortOption, apiCategories]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const pageTitlePrimary = useMemo(() => {
    const label = navCategories.find((c) => c.id === activeCategoryId)?.name;
    if (label) return label;
    if (activeSubKey) return subcategoryList().find((s) => s.id === activeSubKey)?.name ?? "Đồ chơi";
    return "ĐỒ CHƠI";
  }, [navCategories, activeCategoryId, activeSubKey]);

  const showHeuristicHint = !hasToysCategoryInApi && toysPool.length > 0;

  return (
    <div className="books-page bg-light pb-4 pb-lg-5">
      <div className="container py-2">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item">
              <Link to="/" className="text-decoration-none text-dark fw-medium">
                Trang chủ
              </Link>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              Đồ chơi
            </li>
          </ol>
        </nav>
      </div>

      {error && (
        <div className="container mb-3">
          <div className="alert alert-warning d-flex align-items-center gap-2 rounded-4 border-0 shadow-sm">
            <i className="bi bi-exclamation-triangle-fill text-warning fs-5"></i>
            <div>
              <strong>Không thể kết nối máy chủ.</strong> Vui lòng đảm bảo backend đang chạy tại{" "}
              <code>http://localhost:5005</code>. Chi tiết: {error}
            </div>
          </div>
        </div>
      )}
      <div className="container">
        {showHeuristicHint && !loading && (
          <div className="alert alert-light border rounded-4 mb-3 mb-md-4 shadow-sm small">
            <i className="bi bi-info-circle text-primary me-2"></i>
            Chưa có danh mục &quot;đồ chơi&quot; trong hệ thống — đang hiển thị sản phẩm gợi ý theo tên.
            Thêm danh mục phù hợp trong quản trị để lọc chính xác hơn.
          </div>
        )}

        {!loading && toysPool.length === 0 ? (
          <ToysEmpty />
        ) : (
          <>

            <div className="books-toolbar card border-0 rounded-4 mb-3 mb-md-4">
              <div className="card-body p-3 px-4 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                <div>
                  <h4 className="fw-bold mb-1 text-uppercase">{pageTitlePrimary}</h4>
                  <span className="text-muted small">
                    {loading ? "Đang tải..." : `${filteredItems.length} sản phẩm`}
                  </span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span className="text-nowrap fw-medium small">Sắp xếp:</span>
                  <select
                    className="form-select form-select-sm border-0 bg-light fw-medium rounded-pill"
                    style={{ minWidth: "170px", cursor: "pointer" }}
                    value={sortOption}
                    onChange={(e) => { setSortOption(e.target.value); setCurrentPage(1); }}
                  >
                    <option value="newest">Mới nhất</option>
                    <option value="stock">Còn nhiều hàng</option>
                    <option value="price_asc">Giá: Thấp → Cao</option>
                    <option value="price_desc">Giá: Cao → Thấp</option>
                  </select>
                </div>
              </div>
            </div>

            {loading ? (
              <ToysSkeletonGrid />
            ) : filteredItems.length === 0 ? (
              <NoMatchInFilter />
            ) : (
              <>
                <div className="row g-4">
                  {paginatedItems.map((book, i) => (
                    <ProductBookCard
                      key={book.id}
                      book={book}
                      delay={(i % 4) * 100 + 100}
                      listingHref={listingHrefForCards}
                      detailBasePath="/toys"
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="d-flex justify-content-center mt-5">
                    <ul className="pagination custom-pagination">
                      <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                        <button type="button" className="page-link" onClick={() => handlePageChange(currentPage - 1)}>
                          <i className="bi bi-chevron-left"></i>
                        </button>
                      </li>
                      {[...Array(totalPages)].map((_, idx) => {
                        const page = idx + 1;
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 2 && page <= currentPage + 2)
                        ) {
                          return (
                            <li key={page} className={`page-item ${currentPage === page ? "active" : ""}`}>
                              <button type="button" className="page-link" onClick={() => handlePageChange(page)}>{page}</button>
                            </li>
                          );
                        }
                        if (page === currentPage - 3 || page === currentPage + 3) {
                          return (
                            <li key={page} className="page-item disabled">
                              <span className="page-link">…</span>
                            </li>
                          );
                        }
                        return null;
                      })}
                      <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                        <button type="button" className="page-link" onClick={() => handlePageChange(currentPage + 1)}>
                          <i className="bi bi-chevron-right"></i>
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ToysPage;