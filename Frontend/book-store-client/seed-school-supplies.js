/**
 * Seed script: Tạo sản phẩm Đồ dùng học tập (School Supplies)
 * Run: node seed-school-supplies.js
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
  { name: "Dụng cụ học tập", type: "do-dung-hoc-tap" },
  { name: "Bút & Viết học sinh", type: "do-dung-hoc-tap" },
  { name: "Vở & Tập học sinh", type: "do-dung-hoc-tap" },
  { name: "Hộp bút & Túi đựng", type: "do-dung-hoc-tap" },
];

const CATEGORY_PRODUCT_MAP = {
  "Dụng cụ học tập": 0,
  "Bút & Viết học sinh": 1,
  "Vở & Tập học sinh": 2,
  "Hộp bút & Túi đựng": 3,
};

// ── Sản phẩm mẫu (20 item) ───────────────────────────────────
const allProducts = [
  // 0: Dụng cụ
  [
    { title: "Bộ dụng cụ toán học - ComPa & Thước", author: "Deli", publisher: "Deli", description: "Bộ dụng cụ học toán đầy đủ bao gồm compa, thước kẻ, ê-ke, thước đo độ. Chất liệu nhựa bền đẹp.", price: 45000, stockQuantity: 200, imageUrl: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?q=80&w=600&auto=format&fit=crop" },
    { title: "Gọt chì quay tay Deli - Hình gấu", author: "Deli", publisher: "Deli", description: "Máy gọt bút chì quay tay tiện lợi, thiết kế hình gấu dễ thương, gọt nhanh và không gãy lõi chì.", price: 85000, stockQuantity: 100, imageUrl: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?q=80&w=600&auto=format&fit=crop" },
  ],
  // 1: Bút
  [
    { title: "Bút bi nước màu sắc - Bộ 10 cây", author: "MujiStyle", publisher: "MujiStyle", description: "Bộ 10 bút bi nước nhiều màu sắc neon và pastel, viết cực mượt, phù hợp ghi chú và trang trí.", price: 120000, stockQuantity: 150, imageUrl: "https://images.unsplash.com/photo-1585336261022-680e295ce3fe?q=80&w=600&auto=format&fit=crop" },
    { title: "Bút mực máy Thiên Long - Luyện chữ đẹp", author: "Thiên Long", publisher: "Thiên Long", description: "Bút máy chuyên dụng cho học sinh luyện chữ đẹp, ngòi mài nông, viết êm không nhòe mực.", price: 35000, stockQuantity: 300, imageUrl: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=600&auto=format&fit=crop" },
  ],
];

async function main() {
  console.log("🚀 Bắt đầu seed đồ dùng học tập (Port 5005)...\n");

  const categories = await get("/categories");
  console.log(`📋 Tìm thấy ${categories.length} danh mục trong DB`);

  const existing = new Map();
  for (const c of categories) existing.set(c.name, c);

  const matched = [];
  for (let i = 0; i < DESIRED_CATEGORIES.length; i++) {
    const item = DESIRED_CATEGORIES[i];
    let cat = existing.get(item.name);
    if (!cat) {
      try {
        console.log(`  ➕ Tạo danh mục mới: "${item.name}"...`);
        cat = await post("/categories", { 
          name: item.name, 
          type: item.type,
          description: `Danh mục ${item.name} đồ dùng học tập cho học sinh` 
        });
      } catch (err) {
        console.error(`  ❌ Không thể tạo danh mục "${item.name}":`, err.message);
        continue;
      }
    } else {
      console.log(`  ✅ Đã có danh mục: "${item.name}" (id=${cat.id})`);
    }
    matched.push({ ...cat, productIndex: i });
  }

  if (matched.length === 0) {
    console.log("❌ Không tìm thấy danh mục đồ dùng học tập nào!");
    return;
  }

  let total = 0;
  for (const cat of matched) {
    const products = allProducts[cat.productIndex] || [];
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

  console.log(`\n🎉 Hoàn tất! Đã tạo ${total} sản phẩm đồ dùng học tập.`);
}

main().catch(console.error);
