/**
 * Seed script: Tạo sản phẩm Phụ kiện (Accesssories)
 * Run: node seed-accessories.js
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
  { name: "Balo & Cặp xách", type: "phu-kien" },
  { name: "Bình nước & Phụ kiện", type: "phu-kien" },
  { name: "Ví & Túi nhỏ", type: "phu-kien" },
  { name: "Đồng hồ & Trang sức", type: "phu-kien" },
];

const CATEGORY_PRODUCT_MAP = {
  "Balo & Cặp xách": 0,
  "Bình nước & Phụ kiện": 1,
  "Ví & Túi nhỏ": 2,
  "Đồng hồ & Trang sức": 3,
};

// ── Sản phẩm mẫu (20 item) ───────────────────────────────────
const allProducts = [
  // 0: Balo
  [
    { title: "Balo thời trang cao cấp - Chống nước", author: "FashionBag", publisher: "FashionBag", description: "Balo phong cách Hàn Quốc, vải Oxford chống nước, ngăn chứa laptop 15.6 inch riêng biệt.", price: 450000, stockQuantity: 100, imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=600&auto=format&fit=crop" },
    { title: "Balo du lịch dã ngoại - 45L", author: "OutdoorPro", publisher: "OutdoorPro", description: "Balo du lịch dung tích lớn, đệm lưng êm ái, nhiều ngăn phụ tiện dụng cho chuyến đi dài ngày.", price: 690000, stockQuantity: 40, imageUrl: "https://images.unsplash.com/photo-1581605405669-fcdf81165afa?q=80&w=600&auto=format&fit=crop" },
    { title: "Cặp xách công sở da PU", author: "OfficeGear", publisher: "OfficeGear", description: "Cặp xách thanh lịch, chất liệu da PU cao cấp, bền đẹp, phù hợp đi làm hoặc đi họp.", price: 550000, stockQuantity: 60, imageUrl: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=600&auto=format&fit=crop" },
  ],
  // 1: Bình nước
  [
    { title: "Bình giữ nhiệt Lock&Lock 500ml", author: "Lock&Lock", publisher: "Lock&Lock", description: "Bình giữ nhiệt thép không gỉ, giữ nóng 8h và lạnh 12h. Thiết kế gọn nhẹ, màu sắc sang trọng.", price: 320000, stockQuantity: 150, imageUrl: "https://images.unsplash.com/photo-1523362628744-0c14a394ba85?q=80&w=600&auto=format&fit=crop" },
    { title: "Bình nước thể thao nhựa Tritan - 1L", author: "SportLife", publisher: "SportLife", description: "Bình nước chịu lực cực tốt, nhựa Tritan không chứa BPA, an toàn cho sức khỏe, dung tích lớn.", price: 120000, stockQuantity: 200, imageUrl: "https://images.unsplash.com/photo-1544244015-0cd4b3ff3f8d?q=80&w=600&auto=format&fit=crop" },
  ],
  // 2: Ví
  [
    { title: "Ví nam da thật - Thiết kế tối giản", author: "LeatherArt", publisher: "LeatherArt", description: "Ví nam ngang, da bò thật 100%, thiết kế nhỏ gọn với nhiều ngăn đựng thẻ.", price: 380000, stockQuantity: 80, imageUrl: "https://images.unsplash.com/photo-1627123424574-724758594e93?q=80&w=600&auto=format&fit=crop" },
    { title: "Ví cầm tay nữ - Họa tiết hoa", author: "GraceLady", publisher: "GraceLady", description: "Ví cầm tay dài, họa tiết in hoa trẻ trung, nhiều ngăn chứa tiền và điện thoại.", price: 250000, stockQuantity: 120, imageUrl: "https://images.unsplash.com/photo-1584917469897-57ecc5b8ade5?q=80&w=600&auto=format&fit=crop" },
  ],
];

async function main() {
  console.log("🚀 Bắt đầu seed phụ kiện (Port 5005)...\n");

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
          description: `Danh mục ${item.name} phụ kiện thời trang` 
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
    console.log("❌ Không tìm thấy danh mục phụ kiện nào!");
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

  console.log(`\n🎉 Hoàn tất! Đã tạo ${total} sản phẩm phụ kiện.`);
}

main().catch(console.error);
