import { bookCategoryId } from "./bookDisplay.js";

/** Nhận diện danh mục thuộc văn phòng phẩm (từ API /categories) */
const STATIONERY_CATEGORY_RE = /văn phòng|vpp|dụng cụ|ghi chép|bút mực|dụng cụ học|giấy in|giấy photo|bút viết|sổ ghi|bìa hồ sơ|file tài liệu|băng keo|hồ dán|nhãn dán|sticker/i;

export function categoryNameIsStationery(name) {
  return STATIONERY_CATEGORY_RE.test((name || "").trim());
}

/** Gợi ý theo tên sản phẩm khi DB chưa có danh mục VPP riêng */
const TITLE_HINTS = [
  "bút",
  "mực",
  "sổ tay",
  "kẹp giấy",
  "ghim",
  "thước",
  "bấm ghim",
  "hồ dán",
  "file",
  "tẩy",
  "compa",
  "hộp bút",
  "bút chì",
  "highlight",
  "stabilo",
  "giấy in",
  "giấy photo",
  "dạ quang",
  "sổ lò xo",
  "notebook",
  "bìa kẹp",
  "bìa hồ sơ",
  "bìa lá",
  "cặp tài liệu",
  "kéo",
  "dao rọc",
  "băng keo",
  "keo sữa",
  "keo dán",
  "nhãn dán",
  "sticker",
  "washi tape",
  "post-it",
  "dập ghim",
  "kẹp bướm",
];

export function bookTitleLooksStationery(book) {
  const t = (book?.title || "").toLowerCase();
  return TITLE_HINTS.some((w) => t.includes(w));
}

/**
 * Lọc danh sách sản phẩm hiển thị trong kênh VPP.
 * Ưu tiên theo danh mục khớp regex; nếu không có danh mục nào khớp thì lọc theo từ gợi ý trong tiêu đề.
 */
export function filterStationeryBooks(books, apiCategories) {
  const cats = Array.isArray(apiCategories) ? apiCategories : [];
  const stationeryIds = new Set(
    cats
      .filter((c) => categoryNameIsStationery(c?.name ?? c?.Name ?? ""))
      .map((c) => Number(c?.id ?? c?.Id))
      .filter((id) => Number.isFinite(id))
  );

  return books.filter((b) => {
    // 1. If it came from the stationery table, it belongs here (unless it's a toy, but we'll filter those in ToysPage)
    // Actually, for StationeryPage, we want "Stationery" type items.
    
    // 2. Check category ID
    const cid = bookCategoryId(b);
    if (cid != null && stationeryIds.has(Number(cid))) return true;

    // 3. Heuristic for legacy books table items
    if (b.originTable === "books") {
       return bookTitleLooksStationery(b);
    }
    
    // 4. Default for stationery table items: allow them here 
    // (They will be further filtered by category if the user selects one)
    return b.originTable === "stationery";
  });
}
