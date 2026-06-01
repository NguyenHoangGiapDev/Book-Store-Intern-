/**
 * Seed script: Tạo 10 sản phẩm đồ chơi mẫu cho BookStore
 * Hành vi giống `seed-stationery.js` — tạo sản phẩm vào API /books và gán categoryId từ DB
 * Chạy: node seed-toys.js
 */

const API = "http://localhost:5005/api";

async function get(endpoint) {
  const res = await fetch(`${API}${endpoint}`);
  if (!res.ok) throw new Error(`GET ${endpoint} → ${res.status}`);
  return res.json();
}

async function post(endpoint, body) {
  const res = await fetch(`${API}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${endpoint} → ${res.status}: ${text}`);
  }
  return res.json();
}

// Danh sách danh mục mong muốn
const DESIRED_CATEGORIES = [
  { name: "Đồ chơi giáo dục", type: "do-choi" },
  { name: "Lego / Lắp ráp", type: "do-choi" },
  { name: "Board game", type: "do-choi" },
  { name: "Mô hình nhân vật", type: "do-choi" },
  { name: "Búp bê & Thú bông", type: "do-choi" },
];

const CATEGORY_PRODUCT_MAP = {
  "Đồ chơi giáo dục": 0,
  "Lego / Lắp ráp": 0,
  "Board game": 0,
  "Mô hình nhân vật": 0,
  "Búp bê & Thú bông": 0,
};

// ── Sản phẩm mẫu (10 item) ───────────────────────────────────
const allProducts = [
  [
    {
      title: "LEGO Classic Bộ Sáng Tạo 10704",
      author: "LEGO",
      publisher: "LEGO",
      description: "Bộ LEGO Classic giúp trẻ phát triển sáng tạo với nhiều viên gạch đa dạng. Phù hợp nhiều lứa tuổi.",
      price: 499000,
      stockQuantity: 80,
      imageUrl: "https://images.unsplash.com/photo-1582719478170-8b8b4d8b9f69?q=80&w=600&auto=format&fit=crop",
    },
    {
      title: "Lắp ráp Xe Đua 1:24 - Model Kit",
      author: "HobbyMaker",
      publisher: "HobbyMaker",
      description: "Mô hình lắp ráp xe đua tỷ lệ 1:24, chi tiết cao, sơn và dán tem theo hướng dẫn.",
      price: 249000,
      stockQuantity: 50,
      imageUrl: "https://images.unsplash.com/photo-1518552782427-9b5c8f1b3b8c?q=80&w=600&auto=format&fit=crop",
    },
    {
      title: "Puzzle 500 mảnh - Cảnh thiên nhiên",
      author: "PuzzleWorld",
      publisher: "PuzzleWorld",
      description: "Puzzle 500 mảnh chất lượng cao, in hình màu sắc sống động. Kích thước hoàn thành 48x68cm.",
      price: 179000,
      stockQuantity: 120,
      imageUrl: "https://images.unsplash.com/photo-1505238680356-667803448bb6?q=80&w=600&auto=format&fit=crop",
    },
    {
      title: "Puzzle 100 mảnh - Dễ cho trẻ em",
      author: "KidPuzzles",
      publisher: "KidPuzzles",
      description: "Puzzle 100 mảnh dành cho trẻ em, mảnh lớn dễ ghép, an toàn cho bé.",
      price: 89000,
      stockQuantity: 140,
      imageUrl: "https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=600&auto=format&fit=crop",
    },
    {
      title: "Búp bê Fashionista - Barbie Style",
      author: "Barbie",
      publisher: "Mattel",
      description: "Búp bê thời trang với trang phục thay đổi, phụ kiện đi kèm. Dành cho trẻ từ 3 tuổi trở lên.",
      price: 299000,
      stockQuantity: 60,
      imageUrl: "https://images.unsplash.com/photo-1596495577886-d920f5f0b8b1?q=80&w=600&auto=format&fit=crop",
    },
    {
      title: "Action Figure - Siêu Anh Hùng 15cm",
      author: "ToyHero",
      publisher: "ToyHero",
      description: "Mô hình nhân vật hành động 15cm, khớp nối linh hoạt, phù hợp sưu tầm và chơi.",
      price: 159000,
      stockQuantity: 90,
      imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop",
    },
    {
      title: "Cờ vua gỗ cao cấp - Bộ cờ truyền thống",
      author: "ChessMaster",
      publisher: "ChessMaster",
      description: "Bộ cờ vua gỗ với quân cờ chạm khắc, bàn cờ gấp tiện lợi, dành cho người mới và sưu tập.",
      price: 219000,
      stockQuantity: 40,
      imageUrl: "https://images.unsplash.com/photo-1520975912970-6c6d76f7f8c0?q=80&w=600&auto=format&fit=crop",
    },
    {
      title: "Monopoly - Board Game Gia Đình",
      author: "Hasbro",
      publisher: "Hasbro",
      description: "Monopoly phiên bản gia đình, giờ chơi vui vẻ cùng người thân, phù hợp từ 8 tuổi trở lên.",
      price: 299000,
      stockQuantity: 70,
      imageUrl: "https://images.unsplash.com/photo-1596816223215-8d6f7b3c4f1e?q=80&w=600&auto=format&fit=crop",
    },
    {
      title: "Bộ dụng cụ thủ công - Làm vòng tay & đồ trang trí",
      author: "CraftyKids",
      publisher: "CraftyKids",
      description: "Bộ dụng cụ thủ công bao gồm hạt, dây, kim loại nhẹ, hướng dẫn làm vòng tay, đồ trang trí cho trẻ.",
      price: 129000,
      stockQuantity: 110,
      imageUrl: "https://images.unsplash.com/photo-1531746790731-6c087fecd65a?q=80&w=600&auto=format&fit=crop",
    },
    {
      title: "Blind Box Mini - Hộp bất ngờ (Random)",
      author: "SurpriseToys",
      publisher: "SurpriseToys",
      description: "Blind box mini - hộp bí mật chứa 1 trong số các món đồ sưu tập mini. Phù hợp để sưu tập và làm quà.",
      price: 79000,
      stockQuantity: 200,
      imageUrl: "https://images.unsplash.com/photo-1602524810621-6a6b5b9b9d8d?q=80&w=600&auto=format&fit=crop",
    },
  ],
];

async function main() {
  console.log("🚀 Bắt đầu seed sản phẩm đồ chơi (Port 5005)...\n");

  const categories = await get("/categories");
  console.log(`📋 Tìm thấy ${categories.length} danh mục trong DB`);

  const existing = new Map();
  for (const c of categories) existing.set(c.name, c);

  const matchedCats = [];
  for (const item of DESIRED_CATEGORIES) {
    let cat = existing.get(item.name);
    if (!cat) {
      try {
        console.log(`  ➕ Tạo danh mục mới: "${item.name}"...`);
        cat = await post("/categories", { 
          name: item.name, 
          type: item.type,
          description: `Danh mục ${item.name} dành cho đồ chơi` 
        });
      } catch (err) {
        console.error(`  ❌ Lỗi tạo danh mục ${item.name}:`, err.message);
        continue;
      }
    } else {
      console.log(`  ✅ Đã có danh mục: "${item.name}" (id=${cat.id})`);
    }

    const idx = CATEGORY_PRODUCT_MAP[cat.name];
    if (idx !== undefined) matchedCats.push({ ...cat, productIndex: idx });
  }

  if (matchedCats.length === 0) {
    console.log("❌ Không tìm thấy danh mục đồ chơi nào!");
    return;
  }

  let total = 0;
  for (const cat of matchedCats) {
    const products = allProducts[cat.productIndex];
    for (const p of products) {
      try {
        const created = await post("/books", { ...p, categoryId: cat.id, status: "Available" });
        console.log(`  📝 [${cat.name}] ${created.title} → id=${created.id}`);
        total++;
      } catch (err) {
        console.error(`  ❌ Lỗi tạo ${p.title}:`, err.message);
      }
    }
  }

  console.log(`\n🎉 Hoàn tất! Đã tạo ${total} sản phẩm đồ chơi.`);
}

main().catch((err) => {
  console.error("Lỗi seed:", err);
});

main().catch((err) => {
  console.error("Lỗi seed:", err);
});
