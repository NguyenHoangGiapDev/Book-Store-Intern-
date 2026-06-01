import { useEffect, useState, useMemo } from "react";
import { useSearchParams, Link, useLocation } from "react-router-dom";
import { getCategories } from "../services/categoryService.js";
import { fetchAllProducts, bookCategoryId, bookCategoryName } from "../utils/bookDisplay.js";
import { categoryNameIsStationery } from "../utils/stationeryCatalog.js";
import { categoryNameIsToys } from "../utils/toysCatalog.js";
import { categoryNameIsSchoolSupply } from "../utils/schoolSuppliesCatalog.js";
import { categoryNameIsSouvenir } from "../utils/souvenirsCatalog.js";
import { categoryNameIsAccessory } from "../utils/accessoriesCatalog.js";
import ProductBookCard from "../components/catalog/ProductBookCard.jsx";

const ITEMS_PER_PAGE = 8;

const toSlug = (str) => {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
};

const normalizeCategory = (raw) => {
  const id = raw?.id ?? raw?.Id;
  const name = raw?.name ?? raw?.Name ?? "";
  if (id == null || name === "") return null;
  return { id: Number(id), name };
};
function SkeletonCard() {
  return (
    <div className="col-xl-3 col-lg-4 col-md-4 col-sm-6">
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
  );
}

function EmptyState() {
  return (
    <div className="card border-0 shadow-sm rounded-4 text-center py-5">
      <div className="card-body">
        <div className="mb-4" style={{ fontSize: "64px", lineHeight: 1 }}>📚</div>
        <h4 className="fw-bold text-dark mb-2">Không tìm thấy sách phù hợp</h4>
        <p className="text-muted-custom mb-4">
          Thử chọn phân loại khác hoặc đổi từ khóa tìm kiếm.
        </p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function BooksPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiCategories, setApiCategories] = useState([]);

  const location = useLocation();
  const listingHrefForCards = `${location.pathname}${location.search}`;

  const [searchParams, setSearchParams] = useSearchParams();
  const searchKeyword = searchParams.get("search") || "";
  const categoryParamRaw = searchParams.get("category");

  const [sortOption, setSortOption] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);

  // ── Fetch data from PostgreSQL via .NET API ──
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchAllProducts()
      .then((data) => setBooks(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    getCategories()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setApiCategories(list.map(normalizeCategory).filter(Boolean));
      })
      .catch(() => setApiCategories([]));
  }, []);

  // ── Lọc bỏ mọi thứ không phải sách ──
  const bookOnlyCategories = useMemo(
    () => apiCategories.filter((c) => 
      !categoryNameIsStationery(c.name) && 
      !categoryNameIsToys(c.name) &&
      !categoryNameIsSchoolSupply(c.name) &&
      !categoryNameIsSouvenir(c.name) &&
      !categoryNameIsAccessory(c.name)
    ),
    [apiCategories]
  );

  // ── Tập hợp ID danh mục không phải sách ──
  const nonBookCatIds = useMemo(() => {
    const ids = new Set();
    apiCategories.forEach((c) => {
      if (
        categoryNameIsStationery(c.name) || 
        categoryNameIsToys(c.name) ||
        categoryNameIsSchoolSupply(c.name) ||
        categoryNameIsSouvenir(c.name) ||
        categoryNameIsAccessory(c.name)
      ) {
        ids.add(c.id);
      }
    });
    return ids;
  }, [apiCategories]);

  // ── Pool sách (không bao gồm VPP) ──
  const booksOnly = useMemo(
    () => books.filter((b) => {
      // 1. Must be from the books table
      if (b.originTable !== "books") return false;

      // 2. Must NOT be in a non-book category
      const cid = bookCategoryId(b);
      return cid == null || !nonBookCatIds.has(Number(cid));
    }),
    [books, nonBookCatIds]
  );

  const categoriesFromBooks = useMemo(() => {
    const map = new Map();
    booksOnly.forEach((b) => {
      const id = bookCategoryId(b);
      const name = bookCategoryName(b);
      if (id != null && name) map.set(Number(id), { id: Number(id), name });
    });
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }, [booksOnly]);

  const navCategories = bookOnlyCategories.length > 0 ? bookOnlyCategories : categoriesFromBooks;

  const countsByCategoryId = useMemo(() => {
    const m = new Map();
    booksOnly.forEach((b) => {
      const id = bookCategoryId(b);
      if (id == null) return;
      const k = Number(id);
      m.set(k, (m.get(k) ?? 0) + 1);
    });
    return m;
  }, [booksOnly]);

  const activeCategoryId = useMemo(() => {
    if (!categoryParamRaw || categoryParamRaw === "") return null;
    
    // 1. Try matching by slug name first
    const targetSlug = categoryParamRaw.toLowerCase();
    const found = navCategories.find((c) => toSlug(c.name) === targetSlug);
    if (found) return found.id;

    // 2. Fallback to numeric ID
    const numId = Number(categoryParamRaw);
    if (Number.isFinite(numId)) {
      const exists = navCategories.some((c) => Number(c.id) === numId);
      if (exists) return numId;
    }

    return null;
  }, [categoryParamRaw, navCategories]);

  useEffect(() => {
    setCurrentPage(1);
    window.scrollTo(0, 0);
  }, [categoryParamRaw, searchKeyword]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const setCategoryInUrl = (categoryId) => {
    const next = new URLSearchParams(searchParams);
    if (categoryId === null) {
      next.delete("category");
    } else {
      const cat = navCategories.find((c) => c.id === categoryId);
      if (cat) {
        next.set("category", toSlug(cat.name));
      } else {
        next.set("category", String(categoryId));
      }
    }
    setSearchParams(next);
  };

  const pageTitlePrimary = useMemo(() => {
    if (searchKeyword) return `Kết quả: "${searchKeyword}"`;
    const label = navCategories.find((c) => c.id === activeCategoryId)?.name;
    if (label) return label;
    return "TẤT CẢ SÁCH";
  }, [searchKeyword, navCategories, activeCategoryId]);

  // ── Search & category & sort (chỉ sách, không VPP) ──
  const filteredBooks = useMemo(() => {
    let result = [...booksOnly];

    // Keyword filter
    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase();
      result = result.filter(
        (b) =>
          b.title?.toLowerCase().includes(kw) ||
          b.author?.toLowerCase().includes(kw) ||
          bookCategoryName(b)?.toLowerCase().includes(kw)
      );
    }

    if (activeCategoryId !== null) {
      result = result.filter((b) => Number(bookCategoryId(b)) === activeCategoryId);
    }

    // Sort
    if (sortOption === "price_asc") result.sort((a, b) => a.price - b.price);
    else if (sortOption === "price_desc") result.sort((a, b) => b.price - a.price);
    else if (sortOption === "newest") result.sort((a, b) => b.id - a.id);
    else if (sortOption === "stock") result.sort((a, b) => b.stockQuantity - a.stockQuantity);

    return result;
  }, [booksOnly, searchKeyword, activeCategoryId, sortOption]);

  // ── Pagination ──
  const totalPages = Math.max(1, Math.ceil(filteredBooks.length / ITEMS_PER_PAGE));
  const paginatedBooks = filteredBooks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="books-page bg-light pb-4 pb-lg-5">
      {/* Breadcrumb */}
      <div className="container py-2">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item">
              <Link to="/" className="text-decoration-none text-dark fw-medium">Trang chủ</Link>
            </li>
            <li className="breadcrumb-item active" aria-current="page">Sách</li>
          </ol>
        </nav>
      </div>

      {/* Error Banner */}
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
        {/* Main Content */}
        <div>

            {/* Sort Bar */}
            <div className="books-toolbar card border-0 rounded-4 mb-3 mb-md-4">
              <div className="card-body p-3 px-4 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                <div>
                  <h4 className="fw-bold mb-1">
                    {pageTitlePrimary}
                  </h4>
                  <span className="text-muted small">
                    {loading ? "Đang tải..." : `${filteredBooks.length} sản phẩm`}
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
                    <option value="stock">Bán chạy nhất</option>
                    <option value="price_asc">Giá: Thấp → Cao</option>
                    <option value="price_desc">Giá: Cao → Thấp</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="row g-4">
                {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : paginatedBooks.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                <div className="row g-4">
                  {paginatedBooks.map((book, i) => (
                    <ProductBookCard
                      key={book.id}
                      book={book}
                      delay={(i % 4) * 100 + 100}
                      listingHref={listingHrefForCards}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="d-flex justify-content-center mt-5">
                    <ul className="pagination custom-pagination">
                      <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                        <button className="page-link" onClick={() => handlePageChange(currentPage - 1)}>
                          <i className="bi bi-chevron-left"></i>
                        </button>
                      </li>
                      {[...Array(totalPages)].map((_, idx) => {
                        const page = idx + 1;
                        // Show at most 7 page buttons with ellipsis
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 2 && page <= currentPage + 2)
                        ) {
                          return (
                            <li key={page} className={`page-item ${currentPage === page ? "active" : ""}`}>
                              <button className="page-link" onClick={() => handlePageChange(page)}>{page}</button>
                            </li>
                          );
                        } else if (page === currentPage - 3 || page === currentPage + 3) {
                          return <li key={page} className="page-item disabled"><span className="page-link">…</span></li>;
                        }
                        return null;
                      })}
                      <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                        <button className="page-link" onClick={() => handlePageChange(currentPage + 1)}>
                          <i className="bi bi-chevron-right"></i>
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </>
            )}
        </div>
      </div>
    </div>
  );
}

export default BooksPage;