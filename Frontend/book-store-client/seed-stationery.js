/**
 * Seed script: Tạo sản phẩm văn phòng phẩm cho BookStore
 * (Dùng danh mục đã tồn tại trong DB)
 * Chạy:  node seed-stationery.js
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

// Danh sách danh mục mong muốn và map index sản phẩm
const DESIRED_CATEGORIES = [
  { name: "Giấy in", type: "van-phong-pham" },
  { name: "Bút viết", type: "van-phong-pham" },
  { name: "Sổ ghi chép", type: "van-phong-pham" },
  { name: "Bìa hồ sơ", type: "van-phong-pham" },
  { name: "Dụng cụ văn phòng", type: "van-phong-pham" },
  { name: "Băng keo & Hồ dán", type: "van-phong-pham" },
  { name: "Nhãn dán & Sticker", type: "van-phong-pham" },
];

const CATEGORY_PRODUCT_MAP = {
  "Giấy in": 0,
  "Bút viết": 1,
  "Sổ ghi chép": 2,
  "Bìa hồ sơ": 3,
  "Dụng cụ văn phòng": 4,
  "Băng keo & Hồ dán": 5,
  "Nhãn dán & Sticker": 6,
};

// ── Sản phẩm mẫu ────────────────────────────────────────────────
const allProducts = [
  // ── 0: Giấy in ──
  [
    { title: "Giấy in A4 Double A 70gsm (500 tờ)", author: "Double A", publisher: "Double A", description: "Giấy in A4 chất lượng cao 70gsm, trắng mịn, không kẹt giấy. Phù hợp cho máy in laser và máy photocopy. Đóng gói 500 tờ/ream.", price: 85000, stockQuantity: 200, imageUrl: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?q=80&w=600&auto=format&fit=crop" },
    { title: "Giấy in A4 IK Plus 80gsm (500 tờ)", author: "IK Plus", publisher: "IK Plus", description: "Giấy in cao cấp 80gsm, bề mặt siêu mịn, cho chất lượng in ấn sắc nét. Tương thích mọi loại máy in.", price: 105000, stockQuantity: 150, imageUrl: "https://images.unsplash.com/photo-1568702846914-96b305d2bbe1?q=80&w=600&auto=format&fit=crop" },
    { title: "Giấy in A3 Paper One 80gsm (500 tờ)", author: "Paper One", publisher: "Paper One", description: "Giấy in khổ A3, 80gsm trắng sáng, phù hợp in bản vẽ, poster, tài liệu lớn. 500 tờ/ream.", price: 195000, stockQuantity: 80, imageUrl: "https://images.unsplash.com/photo-1603484477859-abe6a73f46d6?q=80&w=600&auto=format&fit=crop" },
  ],
  // ── 1: Bút viết ──
  [
    { title: "Bút bi Thiên Long TL-027 (hộp 20 cây)", author: "Thiên Long", publisher: "Thiên Long", description: "Bút bi Thiên Long TL-027 mực xanh/đỏ/đen, viết trơn mượt, bền màu. Hộp 20 cây tiết kiệm cho văn phòng.", price: 60000, stockQuantity: 300, imageUrl: "https://images.unsplash.com/photo-1585336261022-680e295ce3fe?q=80&w=600&auto=format&fit=crop" },
    { title: "Bút chì gỗ 2B Staedtler (hộp 12 cây)", author: "Staedtler", publisher: "Staedtler", description: "Bút chì gỗ 2B cao cấp Staedtler, nét đậm đều, dễ xóa. Phù hợp vẽ kỹ thuật, thi cử. Hộp 12 cây.", price: 75000, stockQuantity: 180, imageUrl: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?q=80&w=600&auto=format&fit=crop" },
    { title: "Bút dạ quang Stabilo Boss (bộ 6 màu)", author: "Stabilo", publisher: "Stabilo", description: "Bộ 6 bút dạ quang Stabilo Boss Original với 6 màu neon bắt mắt. Mực không lem, khô nhanh, highlight sắc nét.", price: 120000, stockQuantity: 150, imageUrl: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=600&auto=format&fit=crop" },
  ],
  // ── 2: Sổ ghi chép ──
  [
    { title: "Sổ tay bìa da A5 cao cấp (200 trang)", author: "Hải Tiến", publisher: "Hải Tiến", description: "Sổ tay bìa da PU cao cấp khổ A5, 200 trang giấy kẻ ngang 80gsm. Gáy chỉ may bền chắc, mở phẳng 180°.", price: 85000, stockQuantity: 100, imageUrl: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?q=80&w=600&auto=format&fit=crop" },
    { title: "Sổ lò xo A4 Campus 80 trang", author: "Campus", publisher: "Campus", description: "Sổ lò xo Campus khổ A4, 80 trang giấy kẻ ô vuông, tiện ghi chép và vẽ sơ đồ. Bìa nhựa PP chống nước.", price: 35000, stockQuantity: 250, imageUrl: "https://images.unsplash.com/photo-1517842645767-c639042777db?q=80&w=600&auto=format&fit=crop" },
  ],
  // ── 3: Bìa hồ sơ ──
  [
    { title: "Bìa kẹp A4 hai lỗ Flexoffice (10 cái)", author: "Flexoffice", publisher: "Flexoffice", description: "Bìa kẹp tài liệu A4 hai lỗ Flexoffice, nhựa PP dày dặn, nhiều màu. Đóng gói 10 cái, tiện tổ chức hồ sơ.", price: 55000, stockQuantity: 120, imageUrl: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=600&auto=format&fit=crop" },
    { title: "File đựng tài liệu 60 lá King Jim", author: "King Jim", publisher: "King Jim", description: "File đựng tài liệu 60 lá bìa nhựa trong suốt, khổ A4. Bìa ngoài bền đẹp, dễ tra cứu tài liệu.", price: 75000, stockQuantity: 80, imageUrl: "https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?q=80&w=600&auto=format&fit=crop" },
  ],
  // ── 4: Dụng cụ văn phòng ──
  [
    { title: "Dập ghim Kangaro HD-10 (tặng kèm ghim)", author: "Kangaro", publisher: "Kangaro", description: "Dập ghim Kangaro HD-10 cỡ nhỏ, ghim được 15 tờ. Thiết kế nhỏ gọn, bền bỉ. Tặng kèm 1 hộp ghim số 10.", price: 35000, stockQuantity: 150, imageUrl: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?q=80&w=600&auto=format&fit=crop" },
    { title: "Kéo văn phòng 3M Scotch 17cm", author: "3M Scotch", publisher: "3M Scotch", description: "Kéo văn phòng 3M Scotch lưỡi thép không gỉ, cắt sắc bén, tay cầm cao su chống trượt. Chiều dài 17cm.", price: 55000, stockQuantity: 120, imageUrl: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?q=80&w=600&auto=format&fit=crop" },
  ],
  // ── 5: Băng keo & Hồ dán ──
  [
    { title: "Băng keo trong Scotch 3M (24mm x 30m)", author: "3M Scotch", publisher: "3M", description: "Băng keo trong suốt Scotch 3M, dính chắc, không để lại dấu khi gỡ. Kích thước 24mm x 30m.", price: 25000, stockQuantity: 250, imageUrl: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?q=80&w=600&auto=format&fit=crop" },
    { title: "Hồ khô UHU Stic 21g (2 cây)", author: "UHU", publisher: "UHU", description: "Bộ 2 hồ khô UHU Stic 21g, tiện dụng, không gây bẩn tay. Dán mạnh trên giấy, bìa, ảnh.", price: 35000, stockQuantity: 300, imageUrl: "https://images.unsplash.com/photo-1568702846914-96b305d2bbe1?q=80&w=600&auto=format&fit=crop" },
  ],
  // ── 6: Nhãn dán & Sticker ──
  [
    { title: "Nhãn dán trang trí Washi Tape (bộ 10 cuộn)", author: "MINKYS", publisher: "MINKYS", description: "Bộ 10 cuộn washi tape họa tiết vintage/hoa lá đa dạng. Dễ xé, dễ dán, không để lại keo. Trang trí sổ tay, quà tặng.", price: 55000, stockQuantity: 150, imageUrl: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?q=80&w=600&auto=format&fit=crop" },
    { title: "Giấy note Post-it 3M (76x76mm, 5 màu)", author: "3M Post-it", publisher: "3M", description: "Giấy note Post-it 5 màu pastel, kích thước 76x76mm, 100 tờ/tập. Dính nhẹ, gỡ không rách giấy.", price: 42000, stockQuantity: 300, imageUrl: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?q=80&w=600&auto=format&fit=crop" },
  ],
];

async function main() {
  console.log("🚀 Bắt đầu seed sản phẩm văn phòng phẩm (Port 5005)...\n");

  // Fetch existing categories
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
                description: `Danh mục ${item.name} văn phòng phẩm` 
            });
        } catch (err) {
            console.error(`  ❌ Lỗi tạo danh mục ${item.name}:`, err.message);
            continue;
        }
    } else {
        console.log(`  ✅ Đã có danh mục: "${item.name}" (id=${cat.id})`);
    }
    
    const idx = CATEGORY_PRODUCT_MAP[cat.name];
    if (idx !== undefined) {
        matchedCats.push({ ...cat, productIndex: idx });
    }
  }

  if (matchedCats.length === 0) {
    console.log("❌ Không tìm thấy danh mục văn phòng phẩm nào!");
    return;
  }

  console.log(`\n📦 Bắt đầu tạo sản phẩm cho ${matchedCats.length} danh mục...\n`);

  let totalProducts = 0;

  for (const cat of matchedCats) {
    const products = allProducts[cat.productIndex] || [];
    for (const prod of products) {
      try {
        const created = await post("/books", {
          ...prod,
          categoryId: cat.id,
          status: "Available",
        });
        console.log(`  📝 [${cat.name}] ${created.title} → id=${created.id}`);
        totalProducts++;
      } catch (err) {
        console.error(`  ❌ Lỗi tạo "${prod.title}":`, err.message);
      }
    }
  }

  console.log(`\n🎉 Hoàn tất! Đã tạo ${totalProducts} sản phẩm văn phòng phẩm.`);
}

main().catch(console.error);
