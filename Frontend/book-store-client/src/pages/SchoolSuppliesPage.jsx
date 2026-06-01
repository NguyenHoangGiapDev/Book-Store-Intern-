import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../services/apiClient.js";
import { formatBookPrice } from "../utils/bookDisplay.js";

const ITEMS_PER_PAGE = 8;

const getItemId = (item) => item?.id ?? item?.Id;

const getTitle = (item) => item?.title ?? item?.Title ?? "Đồ dùng học tập";

const getBrand = (item) =>
  item?.brand ??
  item?.Brand ??
  item?.manufacturer ??
  item?.Manufacturer ??
  "Book-Store";

const getImageUrl = (item) => item?.imageUrl ?? item?.ImageUrl ?? "";

const getPrice = (item) => Number(item?.price ?? item?.Price ?? 0);

const getStockQuantity = (item) =>
  Number(item?.stockQuantity ?? item?.StockQuantity ?? 0);

const getCategoryId = (item) => {
  const id = item?.categoryId ?? item?.CategoryId;
  return id == null ? null : Number(id);
};

const normalizeCategory = (category) => {
  const id = category?.id ?? category?.Id;
  const name = category?.name ?? category?.Name ?? "";
  const type = category?.type ?? category?.Type ?? "";

  if (id == null || !name) return null;

  return {
    id: Number(id),
    name,
    type,
  };
};

function SchoolSuppliesPage() {
  const [items, setItems] = useState([]);
  const [schoolCategories, setSchoolCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [error, setError] = useState("");

  const [sortOption, setSortOption] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const loadSchoolSupplies = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await apiRequest("/school-supplies");
        setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Load school supplies error:", err);
        setError(err?.message || "Không thể tải danh sách đồ dùng học tập");
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadSchoolSupplies();
  }, []);

  useEffect(() => {
    const loadSchoolCategories = async () => {
      try {
        setCategoryLoading(true);

        let data = [];

        try {
          data = await apiRequest("/categories/school-supplies");
        } catch {
          data = await apiRequest("/categories");
        }

        const list = Array.isArray(data)
          ? data.map(normalizeCategory).filter(Boolean)
          : [];

        const schoolOnly = list.filter((category) => {
          const type = String(category.type || "").toLowerCase();
          const name = String(category.name || "").toLowerCase();

          return (
            type === "do-dung-hoc-tap" ||
            type === "school" ||
            type === "school-supplies" ||
            name.includes("bút") ||
            name.includes("but") ||
            name.includes("thước") ||
            name.includes("thuoc") ||
            name.includes("học tập") ||
            name.includes("hoc tap")
          );
        });

        setSchoolCategories(schoolOnly.length > 0 ? schoolOnly : list);
      } catch (err) {
        console.error("Load school categories error:", err);
        setSchoolCategories([]);
      } finally {
        setCategoryLoading(false);
      }
    };

    loadSchoolCategories();
  }, []);

  const categoryNameById = useMemo(() => {
    const map = new Map();

    schoolCategories.forEach((category) => {
      map.set(Number(category.id), category.name);
    });

    return map;
  }, [schoolCategories]);

  const getSchoolCategoryName = (item) => {
    const categoryId = getCategoryId(item);

    if (categoryId != null && categoryNameById.has(categoryId)) {
      return categoryNameById.get(categoryId);
    }

    return "Đồ dùng học tập";
  };

  const filteredItems = useMemo(() => {
    const result = [...items];

    if (sortOption === "price_asc") {
      result.sort((a, b) => getPrice(a) - getPrice(b));
    } else if (sortOption === "price_desc") {
      result.sort((a, b) => getPrice(b) - getPrice(a));
    } else if (sortOption === "stock") {
      result.sort((a, b) => getStockQuantity(b) - getStockQuantity(a));
    } else {
      result.sort(
        (a, b) => Number(getItemId(b) || 0) - Number(getItemId(a) || 0)
      );
    }

    return result;
  }, [items, sortOption]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredItems.length / ITEMS_PER_PAGE)
  );

  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
    window.scrollTo(0, 0);
  }, [sortOption]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
              Đồ dùng học tập
            </li>
          </ol>
        </nav>
      </div>

      <div className="container">
        <div className="books-toolbar card border-0 rounded-4 mb-3 mb-md-4">
          <div className="card-body p-3 px-4 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
            <div>
              <h4 className="fw-bold mb-1 text-uppercase">ĐỒ DÙNG HỌC TẬP</h4>

              <span className="text-muted small">
                {loading ? "Đang tải..." : `${filteredItems.length} sản phẩm`}
              </span>
            </div>

            <div className="d-flex align-items-center gap-2">
              <span className="text-nowrap fw-medium small">Sắp xếp:</span>

              <select
                className="form-select form-select-sm border-0 bg-light fw-medium rounded-pill"
                style={{ minWidth: 170, cursor: "pointer" }}
                value={sortOption}
                onChange={(event) => {
                  setSortOption(event.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="newest">Mới nhất</option>
                <option value="stock">Còn nhiều hàng</option>
                <option value="price_asc">Giá: Thấp → Cao</option>
                <option value="price_desc">Giá: Cao → Thấp</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-warning rounded-4 border-0 shadow-sm">
            {error}
          </div>
        )}

        {loading || categoryLoading ? (
          <div className="row g-4">
            {[...Array(8)].map((_, index) => (
              <div
                key={index}
                className="col-xl-3 col-lg-4 col-md-4 col-sm-6"
              >
                <div className="skeleton" style={{ height: 260 }}></div>
              </div>
            ))}
          </div>
        ) : paginatedItems.length === 0 ? (
          <div className="card border-0 rounded-4 shadow-sm p-5 text-center">
            <i className="bi bi-backpack display-4 text-muted mb-3"></i>

            <h4 className="fw-bold mb-2">Chưa có sản phẩm đồ dùng học tập</h4>

            <p className="text-muted mb-0">Vui lòng quay lại sau.</p>
          </div>
        ) : (
          <>
            <div className="row g-4">
              {paginatedItems.map((item) => {
                const id = getItemId(item);
                const title = getTitle(item);
                const imageUrl = getImageUrl(item);
                const brand = getBrand(item);
                const price = getPrice(item);
                const stockQuantity = getStockQuantity(item);
                const categoryName = getSchoolCategoryName(item);

                return (
                  <div
                    key={id}
                    className="col-xl-3 col-lg-4 col-md-4 col-sm-6"
                  >
                    <Link
                      to={`/school-supplies/${id}`}
                      className="text-decoration-none text-dark"
                    >
                      <div className="card product-card border-0 rounded-4 shadow-sm h-100 overflow-hidden">
                        <div
                          className="bg-white d-flex align-items-center justify-content-center"
                          style={{ height: 280 }}
                        >
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={title}
                              className="w-100 h-100"
                              style={{ objectFit: "cover" }}
                            />
                          ) : (
                            <i className="bi bi-backpack display-4 text-muted"></i>
                          )}
                        </div>

                        <div className="card-body p-3">
                          <span className="badge bg-success-subtle text-success fw-bold mb-2">
                            {categoryName.toUpperCase()}
                          </span>

                          <h5 className="fw-bold mb-2 text-dark">{title}</h5>

                          <p className="text-muted small mb-2">{brand}</p>

                          <div className="fw-800 text-success">
                            {formatBookPrice(price)}
                          </div>

                          <div className="text-muted small mt-2">
                            Còn {stockQuantity} sản phẩm
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="d-flex justify-content-center mt-5">
                <ul className="pagination custom-pagination">
                  <li
                    className={`page-item ${
                      currentPage === 1 ? "disabled" : ""
                    }`}
                  >
                    <button
                      type="button"
                      className="page-link"
                      onClick={() => handlePageChange(currentPage - 1)}
                    >
                      <i className="bi bi-chevron-left"></i>
                    </button>
                  </li>

                  {[...Array(totalPages)].map((_, index) => {
                    const page = index + 1;

                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 2 && page <= currentPage + 2)
                    ) {
                      return (
                        <li
                          key={page}
                          className={`page-item ${
                            currentPage === page ? "active" : ""
                          }`}
                        >
                          <button
                            type="button"
                            className="page-link"
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </button>
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

                  <li
                    className={`page-item ${
                      currentPage === totalPages ? "disabled" : ""
                    }`}
                  >
                    <button
                      type="button"
                      className="page-link"
                      onClick={() => handlePageChange(currentPage + 1)}
                    >
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
  );
}

export default SchoolSuppliesPage;