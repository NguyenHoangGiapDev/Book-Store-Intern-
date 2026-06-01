// Utility to detect and filter "Phụ kiện" (Accessories) products

export function categoryNameIsAccessory(name) {
  if (!name) return false;
  const s = name.toLowerCase();
  return s.includes("phụ kiện") || s.includes("phu kien") || s.includes("phu-kien") || s.includes("accessories") || s.includes("phụ kiện điện thoại") || s.includes("phukien");
}

export function bookTitleLooksAccessory(book) {
  const t = (book.title || book.name || "").toLowerCase();
  const keywords = [
    "ốp lưng",
    "cáp",
    "tai nghe",
    "sạc",
    "case",
    "adapter",
    "tai nghe",
    "kẹp",
    "dây đeo",
    "dây sạc",
    "pin dự phòng",
    "bao da",
    "miếng dán",
    "phụ kiện",
    "accessory",
  ];
  return keywords.some((k) => t.includes(k));
}

export function classifyAccessory(book, apiCategories = []) {
  const catId = book?.categoryId ?? book?.category?.id ?? null;
  if (catId != null) {
    const found = apiCategories.find((c) => Number(c.id) === Number(catId));
    if (found) return { kind: "api", category: found };
  }
  if (bookTitleLooksAccessory(book)) return { kind: "heuristic", reason: "title" };
  return null;
}

export function filterAccessories(books = [], apiCategories = []) {
  if (!Array.isArray(books)) return [];
  const apiCatIds = new Set(
    apiCategories.filter((c) => categoryNameIsAccessory(c.name)).map((c) => Number(c.id))
  );

  return books.filter((b) => {
    // 1. If it's explicitly from the accessories table, it belongs here
    if (b.originTable === "accessories") return true;

    // 2. If category matches, it belongs here
    const catId = b?.categoryId ?? b?.CategoryId ?? null;
    if (catId != null && apiCatIds.has(Number(catId))) return true;

    // 2. If it's from stationery table, check if it's accessory
    if (b.originTable === "stationery") {
       const catName = b.categoryName || "";
       if (categoryNameIsAccessory(catName)) return true;
    }

    // 3. Fallback
    return bookTitleLooksAccessory(b);
  });
}
