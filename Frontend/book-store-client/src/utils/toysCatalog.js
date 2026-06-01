import { bookCategoryId } from "./bookDisplay.js";

/** Nhận diện danh mục thuộc đồ chơi (từ API /categories) */
const TOYS_CATEGORY_RE = /đồ chơi|toy|figure|lego|mô hình|búp bê|xếp hình|đua xe|mô-tô|vật chơi|tượng|board game|trò chơi/i;

export function categoryNameIsToys(name) {
  return TOYS_CATEGORY_RE.test((name || "").trim());
}

/** Các phân mục đồ chơi phổ biến và từ khóa gợi ý cho từng nhóm */
const SUBCATS = {
  lego: {
    name: "Lắp ráp / Lego",
    keywords: ["lego", "lắp ráp", "xếp hình lắp", "block", "building", "technic", "lego set", "brick"],
  },
  puzzle: {
    name: "Xếp hình / Puzzle",
    keywords: ["puzzle", "xếp hình", "ghép hình", "jigsaw", "pazl"],
  },
  doll: {
    name: "Búp bê & Nhân vật",
    keywords: ["búp bê", "barbie", "doll", "action figure", "nhân vật", "siêu anh hùng"],
  },
  board: {
    name: "Board game & Cờ",
    keywords: ["board", "board game", "cờ", "cờ vua", "cờ tướng", "cờ tỷ phú", "cờ cá ngựa", "game", "bài", "boardgame"],
  },
  model: {
    name: "Mô hình / Model kits",
    keywords: ["mô hình", "model", "mô hình lắp", "kit", "mô-hình", "scale", "mô hình 3d"],
  },
  craftkits: {
    name: "Bộ dụng cụ thủ công",
    keywords: ["bộ dụng cụ", "bộ làm", "thủ công", "craft", "diy", "bộ làm vòng", "vẽ", "nặn", "đất sét"],
  },
  stem: {
    name: "Đồ chơi giáo dục & STEM",
    keywords: [
      "bảng chữ",
      "bảng chữ cái",
      "con số",
      "thẻ chữ",
      "thẻ số",
      "que tính",
      "robot",
      "khoa học",
      "thí nghiệm",
    ],
  },
  toddler: {
    name: "Đồ chơi mầm non",
    keywords: ["thú bông", "nhạc cụ", "đồ chơi nhà bếp", "bác sĩ", "đồ chơi phát triển", "mầm non", "bé", "đồ chơi âm thanh"],
  },
  collectible: {
    name: "Sưu tập & Mini box",
    keywords: ["thẻ bài", "collectible", "blind box", "mini blind", "hộp bí mật", "sưu tập", "card"],
  },
};

const ALL_SUBCAT_KEYS = Object.keys(SUBCATS);

export function subcategoryList() {
  return ALL_SUBCAT_KEYS.map((k) => ({ id: k, name: SUBCATS[k].name }));
}

function titleIncludesAny(title, arr) {
  const t = (title || "").toLowerCase();
  return arr.some((w) => t.includes(w));
}

export function bookTitleLooksToys(book) {
  const t = (book?.title || "").toLowerCase();
  return ALL_SUBCAT_KEYS.some((k) => titleIncludesAny(t, SUBCATS[k].keywords));
}

/**
 * Phân loại 1 sản phẩm đồ chơi sang phân nhóm cụ thể (stem, board, creative, toddler, collectible)
 * Tries: 1) match API category name, 2) match title keywords.
 */
export function classifyToyBook(book, apiCategories = []) {
  // Try categories from API first
  const cats = Array.isArray(apiCategories) ? apiCategories : [];
  const title = (book?.title || "").toLowerCase();

  for (const k of ALL_SUBCAT_KEYS) {
    const keywords = SUBCATS[k].keywords;
    // check api categories names
    if (
      cats.some((c) => {
        const name = (c?.name || c?.Name || "").toLowerCase();
        return titleIncludesAny(name, keywords) || titleIncludesAny(name, [k]);
      })
    ) {
      return k;
    }
  }

  // fallback to title-based
  for (const k of ALL_SUBCAT_KEYS) {
    if (titleIncludesAny(title, SUBCATS[k].keywords)) return k;
  }

  return null;
}

/**
 * Lọc danh sách sản phẩm hiển thị trong kênh Đồ chơi.
 * Nếu cung cấp subcategory (key), chỉ trả về sản phẩm cùng phân mục đó.
 */
export function filterToysBooks(books, apiCategories, subcategory = null) {
  const cats = Array.isArray(apiCategories) ? apiCategories : [];
  const toysIds = new Set(
    cats
      .filter((c) => categoryNameIsToys(c?.name ?? c?.Name ?? ""))
      .map((c) => Number(c?.id ?? c?.Id))
      .filter((id) => Number.isFinite(id))
  );

  const pool = books.filter((b) => {
    // 1. If it's explicitly from the toys table, it belongs here
    if (b.originTable === "toys") return true;

    // 2. If category matches toys, it belongs here
    const cid = bookCategoryId(b);
    if (cid != null && toysIds.has(Number(cid))) return true;

    // 2. If it's from stationery table, check if it looks like a toy
    // (In AdminStationery, user adds toys to the Stationery table)
    if (b.originTable === "stationery") {
       const catName = b.categoryName || "";
       if (categoryNameIsToys(catName)) return true;
    }

    // 3. Fallback for legacy
    return bookTitleLooksToys(b);
  });

  if (subcategory == null) return pool;

  return pool.filter((b) => classifyToyBook(b, apiCategories) === subcategory);
}

