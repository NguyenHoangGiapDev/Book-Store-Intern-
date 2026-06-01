import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { bookCategoryId } from "../utils/bookDisplay.js";
import { apiRequest } from "../services/apiClient.js";
import ProductBookCard from "../components/catalog/ProductBookCard.jsx";

const ITEMS_PER_PAGE = 8;

function StationerySkeletonGrid() {
  return (
    <div className="row g-4">
      {[...Array(8)].map((_, index) => (
        <div key={index} className="col-xl-3 col-lg-4 col-md-4 col-sm-6">
          <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
            <div className="skeleton" style={{ height: "200px" }} />

            <div className="p-3">
              <div
                className="skeleton skeleton-text mb-2"
                style={{ height: "16px", width: "80%" }}
              />
              <div
                className="skeleton skeleton-text mb-2"
                style={{ height: "13px", width: "55%" }}
              />
              <div
                className="skeleton skeleton-text mb-3"
                style={{ height: "18px", width: "40%" }}
              />
              <div
                className="skeleton skeleton-text"
                style={{ height: "36px", borderRadius: "20px" }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function StationeryEmpty() {
  return (
    <div className="card border-0 shadow-sm rounded-4 text-center py-5">
      <div className="card-body">
        <div className="mb-3" style={{ fontSize: "56px", lineHeight: 1 }}>
          ✏️
        </div>

        <h4 className="fw-bold text-dark mb-2">
          Chưa có sản phẩm văn phòng phẩm
        </h4>

        <p className="text-muted mb-4 max-w-md mx-auto">
          Hãy thêm danh mục có tên chứa &quot;văn phòng&quot;, &quot;VPP&quot;
          hoặc gán sản phẩm phù hợp như bút, sổ, dụng cụ học tập.
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
        <h4 className="fw-bold text-dark mb-2">
          Không có sản phẩm phù hợp
        </h4>

        <p className="text-muted mb-0">
          Hãy thử đổi cách sắp xếp hoặc kiểm tra lại dữ liệu sản phẩm.
        </p>
      </div>
    </div>
  );
}

function StationeryPage() {
  const [stationeries, setStationeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [sortOption, setSortOption] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);

  const location = useLocation();
  const listingHrefForCards = `${location.pathname}${location.search}`;

  useEffect(() => {
    setLoading(true);
    setError(null);

    apiRequest("/stationery")
      .then((data) => {
        setStationeries(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        setError(err?.message || "Không thể tải văn phòng phẩm");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const filteredItems = useMemo(() => {
    const result = [...stationeries];

    if (sortOption === "price_asc") {
      result.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    } else if (sortOption === "price_desc") {
      result.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    } else if (sortOption === "newest") {
      result.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
    } else if (sortOption === "stock") {
      result.sort(
        (a, b) =>
          Number(b.stockQuantity || 0) - Number(a.stockQuantity || 0)
      );
    }

    return result;
  }, [stationeries, sortOption]);

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
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
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
              Văn phòng phẩm
            </li>
          </ol>
        </nav>
      </div>

      {error && (
        <div className="container mb-3">
          <div className="alert alert-warning d-flex align-items-center gap-2 rounded-4 border-0 shadow-sm">
            <i className="bi bi-exclamation-triangle-fill text-warning fs-5"></i>

            <div>
              <strong>Không thể kết nối máy chủ.</strong> Vui lòng đảm bảo
              backend đang chạy tại <code>http://localhost:5005</code>. Chi
              tiết: {error}
            </div>
          </div>
        </div>
      )}

      <div className="container">
        {!loading && stationeries.length === 0 ? (
          <StationeryEmpty />
        ) : (
          <>
            <div className="books-toolbar card border-0 rounded-4 mb-3 mb-md-4">
              <div className="card-body p-3 px-4 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                <div>
                  <h4 className="fw-bold mb-1 text-uppercase">
                    VĂN PHÒNG PHẨM
                  </h4>

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

            {loading ? (
              <StationerySkeletonGrid />
            ) : filteredItems.length === 0 ? (
              <NoMatchInFilter />
            ) : (
              <>
                <div className="row g-4">
                  {paginatedItems.map((item, index) => (
                    <ProductBookCard
                      key={item.id}
                      book={item}
                      delay={(index % 4) * 100 + 100}
                      listingHref={listingHrefForCards}
                      detailBasePath="/stationery"
                    />
                  ))}
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
                          (page >= currentPage - 2 &&
                            page <= currentPage + 2)
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

                        if (
                          page === currentPage - 3 ||
                          page === currentPage + 3
                        ) {
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
          </>
        )}
      </div>
    </div>
  );
}

export default StationeryPage;