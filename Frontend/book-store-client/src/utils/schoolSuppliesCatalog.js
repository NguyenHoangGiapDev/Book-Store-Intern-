// Utility to detect and filter "Dụng Cụ Học Tập" products

export function categoryNameIsSchoolSupply(name) {
  if (!name) return false;
  const s = name.toLowerCase();
  return s.includes("dụng cụ học") || s.includes("dụng cụ học tập") || s.includes("dụng cụ học tap") || s.includes("school supplies") || s.includes("school-supplies");
}

export function bookTitleLooksSchoolSupply(book) {
  const t = (book.title || book.name || "").toLowerCase();
  const keywords = [
    "bút",
    "tập",
    "tập vở",
    "thước",
    "compass",
    "com-pa",
    "bảng",
    "hộp bút",
    "bộ dụng cụ",
    "keo",
    "tẩy",
    "bút chì",
    "bút dạ",
    "ghi chép",
    "stationery",
  ];
  return keywords.some((k) => t.includes(k));
}

export function classifySchoolSupply(book, apiCategories = []) {
  const catId = book?.categoryId ?? book?.category?.id ?? book?.categoryId;
  if (catId != null) {
    const found = apiCategories.find((c) => Number(c.id) === Number(catId));
    if (found) return { kind: "api", category: found };
  }
  if (bookTitleLooksSchoolSupply(book)) return { kind: "heuristic", reason: "title" };
  return null;
}

export function filterSchoolSupplies(books = [], apiCategories = []) {
  if (!Array.isArray(books)) return [];
  const apiCatIds = new Set(
    apiCategories.filter((c) => categoryNameIsSchoolSupply(c.name)).map((c) => Number(c.id))
  );

  return books.filter((b) => {
    // 1. If it's explicitly from the school-supplies table, it belongs here
    if (b.originTable === "school-supplies") return true;

    // 2. If category matches, it belongs here
    const catId = b?.categoryId ?? b?.CategoryId ?? null;
    if (catId != null && apiCatIds.has(Number(catId))) return true;

    // 2. If it's from stationery table, check if it's school supply
    if (b.originTable === "stationery") {
       const catName = b.categoryName || "";
       if (categoryNameIsSchoolSupply(catName)) return true;
    }

    // 3. Fallback
    return bookTitleLooksSchoolSupply(b);
  });
}
