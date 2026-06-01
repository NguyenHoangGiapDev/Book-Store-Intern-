import { Link } from "react-router-dom";
import { formatBookPrice, getImageUrl, FALLBACK_BOOK_IMAGE } from "../../utils/bookDisplay.js";

function ProductBookCard({
  book,
  delay = 0,
  listingHref = "/books",
  detailBasePath = "/books",
}) {
  if (!book) return null;

  let actualDetailBasePath = detailBasePath;
  if (book.originTable === "stationery") actualDetailBasePath = "/stationery";
  else if (book.originTable === "toys") actualDetailBasePath = "/toys";
  else if (book.originTable === "souvenirs") actualDetailBasePath = "/souvenirs";
  else if (book.originTable === "accessories") actualDetailBasePath = "/accessories";
  else if (book.originTable === "school-supplies") actualDetailBasePath = "/school-supplies";
  else if (book.originTable === "books") actualDetailBasePath = "/books";

  const detailUrl = `${actualDetailBasePath}/${book.id}`;

  return (
    <div
      className="col-xl-3 col-lg-4 col-md-4 col-sm-6"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="product-card card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
        <Link
          to={detailUrl}
          state={{ from: listingHref }}
          className="text-decoration-none text-dark"
        >
          <div className="product-image-wrapper position-relative">
            <img
              src={getImageUrl(book.imageUrl, book.title)}
              alt={book.title || "Sản phẩm"}
              className="product-image w-100"
              onError={(e) => { e.currentTarget.src = FALLBACK_BOOK_IMAGE; }}
            />

            <button
              type="button"
              className="btn btn-light rounded-circle position-absolute top-0 end-0 m-3 shadow-sm"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
            >
              <i className="bi bi-heart"></i>
            </button>
          </div>

          <div className="card-body p-3">
            {book.categoryName && (
              <div className="mb-2">
                <span className="badge bg-success-subtle text-success-emphasis rounded-pill px-3 py-2 text-uppercase">
                  {book.categoryName}
                </span>
              </div>
            )}

            <h5 className="fw-bold mb-2 product-title">
              {book.title || "Sản phẩm chưa có tên"}
            </h5>

            <div className="text-muted small mb-2">
              {book.author || book.brand || book.manufacturer || "Book-Store"}
            </div>

            <div className="d-flex align-items-center gap-1 mb-2">
              <i className="bi bi-star-fill text-warning"></i>
              <i className="bi bi-star-fill text-warning"></i>
              <i className="bi bi-star-fill text-warning"></i>
              <i className="bi bi-star-fill text-warning"></i>
              <i className="bi bi-star-half text-warning"></i>
              <span className="small fw-semibold ms-1">4.8</span>
            </div>

            <div className="fw-bold text-success fs-5">
              {formatBookPrice(book.price)}
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default ProductBookCard;