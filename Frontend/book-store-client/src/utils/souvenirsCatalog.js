import { bookCategoryId } from "./bookDisplay.js";

/** Nhận diện danh mục "Quà lưu niệm" (API categories) */
const SOUVENIR_CATEGORY_RE = /quà|quà lưu niệm|souvenir|gift|quatang|đồ lưu niệm|ly sứ|ly và cốc|ly|cốc|bình nước|móc khóa|magnet|postcard|gấu bông|tote|hộp quà|gift box/i;

export function categoryNameIsSouvenir(name) {
  return SOUVENIR_CATEGORY_RE.test((name || "").trim());
}

const TITLE_HINTS = [
  "quà",
  "quà lưu niệm",
  "souvenir",
  "gift",
  "móc khóa",
  "keychain",
  "magnet",
  "postcard",
  "gấu bông",
  "mug",
  "ly sứ",
  "hộp quà",
  "gift box",
  "túi tote",
];

export function bookTitleLooksSouvenir(book) {
  const t = (book?.title || "").toLowerCase();
  return TITLE_HINTS.some((w) => t.includes(w));
}

/** Lọc sản phẩm hiển thị trong kênh Quà Lưu Niệm */
export function filterSouvenirBooks(books, apiCategories) {
  const cats = Array.isArray(apiCategories) ? apiCategories : [];
  const souvenirIds = new Set(
    cats
      .filter((c) => categoryNameIsSouvenir(c?.name ?? c?.Name ?? ""))
      .map((c) => Number(c?.id ?? c?.Id))
      .filter((id) => Number.isFinite(id))
  );

  return books.filter((b) => {
    // 1. If it's explicitly from the souvenirs table, it belongs here
    if (b.originTable === "souvenirs") return true;

    // 2. If category matches, it belongs here
    const cid = bookCategoryId(b);
    if (cid != null && souvenirIds.has(Number(cid))) return true;

    // 3. If it's from stationery table, check if it looks like a souvenir
    if (b.originTable === "stationery") {
       const catName = b.categoryName || "";
       if (categoryNameIsSouvenir(catName)) return true;
    }

    // 4. Fallback
    return bookTitleLooksSouvenir(b);
  });
}
