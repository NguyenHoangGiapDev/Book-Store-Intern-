// CategoryNavSection.jsx
const categoryIconClass = (name) => {
  const n = (name || "").toLowerCase();
  if (n.includes("lập trình") || n.includes("công nghệ") || n.includes("tin học")) return "bi-code-slash";
  if (n.includes("kinh tế") || n.includes("đầu tư") || n.includes("marketing")) return "bi-graph-up-arrow";
  if (n.includes("thiếu nhi") || n.includes("trẻ em") || n.includes("mầm non")) return "bi-balloon-heart";
  if (n.includes("tiểu thuyết") || n.includes("văn học") || n.includes("truyện")) return "bi-book-half";
  if (n.includes("kỹ năng") || n.includes("phát triển") || n.includes("sống đẹp")) return "bi-lightbulb";
  if (n.includes("sức khỏe") || n.includes("y học")) return "bi-heart-pulse";
  if (n.includes("lịch sử")) return "bi-hourglass-split";
  // ── Văn phòng phẩm ──
  if (n.includes("giấy in") || n.includes("giấy photo")) return "bi-file-earmark-text";
  if (n.includes("bút viết") || n.includes("bút bi") || n.includes("bút chì") || n.includes("dạ quang")) return "bi-pen";
  if (n.includes("sổ ghi") || n.includes("sổ tay") || n.includes("notebook")) return "bi-journal-text";
  if (n.includes("bìa hồ sơ") || n.includes("file tài liệu") || n.includes("cặp tài liệu")) return "bi-folder2-open";
  if (n.includes("dụng cụ") || n.includes("bấm ghim") || n.includes("kéo") || n.includes("dao rọc")) return "bi-scissors";
  if (n.includes("băng keo") || n.includes("hồ dán") || n.includes("keo")) return "bi-paperclip";
  if (n.includes("nhãn dán") || n.includes("sticker") || n.includes("post-it")) return "bi-sticky";
  if (n.includes("văn phòng") || n.includes("vpp")) return "bi-pencil-square";
  return "bi-journal-richtext";
};

export default function CategoryNavSection({
  categories,
  activeCategoryId,
  onSelectAll,
  onSelectCategory,
  totalBooks,
  countsByCategoryId,
  headingId = "catalog-category-heading",
  title = "Phân loại sách",
  subtitle = "Lọc nhanh theo danh mục — có số lượng tồn kho thực trong hệ thống",
  allLabel = "Tất cả sách",
  stockUnitLabel = "sách",
}) {
  const chipTone = (idx) => `books-category-chip-icon--tone-${idx % 5}`;

  return (
    <section
      className="books-category-shell card border-0 rounded-4 mb-3 mb-md-4"
      aria-labelledby={headingId}
    >
      <div className="card-body py-3 py-md-4 px-3 px-md-4">
        <div className="books-category-head d-flex flex-wrap align-items-start justify-content-between gap-3 pb-3 mb-1 border-bottom books-category-head-border">
          <div className="d-flex gap-3 align-items-center min-w-0">
            <div className="books-category-head-illu d-none d-sm-flex" aria-hidden="true">
              <i className="bi bi-layout-text-sidebar-reverse"></i>
            </div>
            <div className="min-w-0">
              <h2 id={headingId} className="books-category-head-title h5 mb-1">
                {title}
              </h2>
              <p className="books-category-head-sub small text-muted mb-0">{subtitle}</p>
            </div>
          </div>
          <span className="books-category-pill-meta text-nowrap">
            {categories.length} danh mục{" "}
            <span className="text-muted fw-normal">
              · Kho {totalBooks} {stockUnitLabel}
            </span>
          </span>
        </div>

        <div
          className="books-category-scroll overflow-x-auto"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <ul
            className="books-category-rail list-unstyled mb-0 d-flex flex-nowrap gap-2 gap-md-3 pb-1 pt-2"
            aria-label={title}
          >
            <li className="flex-shrink-0">
              <button
                type="button"
                className={`books-category-chip text-start ${activeCategoryId === null ? "is-active" : ""}`}
                onClick={onSelectAll}
                aria-current={activeCategoryId === null ? "true" : undefined}
              >
                <span className="books-category-chip-icon-wrap books-category-chip-icon-wrap-all">
                  <i className="bi bi-grid-3x3-gap" aria-hidden="true"></i>
                </span>
                <span className="books-category-chip-body">
                  <span className="books-category-chip-name">{allLabel}</span>
                  <span className="books-category-chip-count">{totalBooks} sản phẩm</span>
                </span>
              </button>
            </li>

            {categories.map((cat, idx) => {
              const isActive = activeCategoryId === cat.id;
              const cnt = countsByCategoryId.get(cat.id) ?? 0;
              return (
                <li key={cat.id} className="flex-shrink-0">
                  <button
                    type="button"
                    className={`books-category-chip text-start ${isActive ? "is-active" : ""}`}
                    onClick={() => onSelectCategory(cat.id)}
                    aria-current={isActive ? "true" : undefined}
                  >
                    <span className={`books-category-chip-icon-wrap ${chipTone(idx)}`}>
                      <i className={`bi ${categoryIconClass(cat.name)}`} aria-hidden="true"></i>
                    </span>
                    <span className="books-category-chip-body">
                      <span className="books-category-chip-name" title={cat.name}>
                        {cat.name}
                      </span>
                      <span className="books-category-chip-count">
                        {cnt} sản phẩm{cnt === 0 ? " · sắp về" : ""}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
