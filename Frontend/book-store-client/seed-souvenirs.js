/**
 * Seed script: Tạo 20 sản phẩm Quà Lưu Niệm (souvenirs)
 * Hành vi:
 * - Kiểm tra các danh mục mong muốn trong DB; nếu thiếu sẽ tạo mới
 * - POST /api/books để tạo sản phẩm, gán categoryId trả về từ DB
 * Chạy: node seed-souvenirs.js
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

// Danh sách danh mục quà lưu niệm mong muốn
const DESIRED_CATEGORIES = [
  { name: "Quà lưu niệm", type: "qua-luu-niem" },
  { name: "Gấu bông & Quà tặng", type: "qua-luu-niem" },
  { name: "Móc khóa lưu niệm", type: "qua-luu-niem" },
  { name: "Ly & Cốc sứ", type: "qua-luu-niem" },
];

const CATEGORY_PRODUCT_MAP = {
  "Quà lưu niệm": 0,
  "Gấu bông & Quà tặng": 1,
  "Móc khóa lưu niệm": 2,
  "Ly & Cốc sứ": 3,
};

// Sản phẩm mẫu: 4 nhóm * 5 sản phẩm = 20
const allProducts = [
  // 0: Quà lưu niệm (tổng quát)
  [
    { title: "Bình nước thép không gỉ in họa tiết - 350ml", author: "SouvenirCo", publisher: "SouvenirCo", description: "Bình nước inox in họa tiết độc đáo, phù hợp làm quà tặng. Giữ nhiệt tốt.", price: 199000, stockQuantity: 120, imageUrl: "https://images.unsplash.com/photo-1526318472351-c75fcf070b6a?q=80&w=600&auto=format&fit=crop" },
    { title: "Hộp nhạc mini - Quà lưu niệm cổ điển", author: "MelodyGifts", publisher: "MelodyGifts", description: "Hộp nhạc gỗ mini, quay lên có nhạc, đẹp mắt để trang trí hoặc làm quà lưu niệm.", price: 149000, stockQuantity: 60, imageUrl: "https://images.unsplash.com/photo-1514894783487-8e9b4c3b3f8a?q=80&w=600&auto=format&fit=crop" },
    { title: "Móc chìa khóa da khắc tên", author: "CraftLetter", publisher: "CraftLetter", description: "Móc khóa da có thể khắc tên, chất liệu da PU cao cấp. Lý tưởng làm quà cá nhân hóa.", price: 99000, stockQuantity: 180, imageUrl: "https://images.unsplash.com/photo-1602080753047-0e33a4a7f3f8?q=80&w=600&auto=format&fit=crop" },
    { title: "Túi vải tote in họa tiết thành phố", author: "CityPrint", publisher: "CityPrint", description: "Túi tote vải cotton thân thiện môi trường, in họa tiết các địa danh nổi tiếng.", price: 89000, stockQuantity: 140, imageUrl: "https://images.unsplash.com/photo-1523289333742-be2e2a7e8d84?q=80&w=600&auto=format&fit=crop" },
    { title: "Đèn ngủ mini LED - Hình ngọn đồi", author: "LightMuse", publisher: "LightMuse", description: "Đèn ngủ LED nhỏ gọn, ánh sáng ấm, thiết kế nghệ thuật phù hợp trang trí phòng.", price: 219000, stockQuantity: 90, imageUrl: "https://images.unsplash.com/photo-1509395176047-4a66953fd231?q=80&w=600&auto=format&fit=crop" },
  ],
  // 1: Gấu bông
  [
    { title: "Gấu bông Bearly - 30cm", author: "SoftToys", publisher: "SoftToys", description: "Gấu bông siêu mềm 30cm, chất liệu an toàn cho trẻ em. Màu sắc dễ thương.", price: 179000, stockQuantity: 150, imageUrl: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?q=80&w=600&auto=format&fit=crop" },
    { title: "Gấu bông ôm tim - Limited", author: "CuteBox", publisher: "CuteBox", description: "Gấu bông ôm tim đỏ, phiên bản limited. Phù hợp làm quà tình cảm.", price: 249000, stockQuantity: 60, imageUrl: "https://images.unsplash.com/photo-1603315054124-9b9d6153a06f?q=80&w=600&auto=format&fit=crop" },
    { title: "Gấu bông mini móc khóa - Bộ 3", author: "TinyFriend", publisher: "TinyFriend", description: "Bộ 3 gấu bông mini có móc khóa, tiện treo balo hoặc làm quà tặng.", price: 129000, stockQuantity: 200, imageUrl: "https://images.unsplash.com/photo-1560807707-8cc77767d783?q=80&w=600&auto=format&fit=crop" },
    { title: "Gấu bông cặp đôi - 2 chiếc", author: "LoveBears", publisher: "LoveBears", description: "Set gấu bông cặp đôi, thích hợp tặng đôi bạn hoặc người yêu.", price: 299000, stockQuantity: 50, imageUrl: "https://images.unsplash.com/photo-1549576490-b0b4831ef60a?q=80&w=600&auto=format&fit=crop" },
    { title: "Gối ôm gấu bông 60cm", author: "ComfortTeddy", publisher: "ComfortTeddy", description: "Gối ôm gấu bông kích thước 60cm, mềm mại, hỗ trợ giấc ngủ và trang trí phòng.", price: 349000, stockQuantity: 40, imageUrl: "https://images.unsplash.com/photo-1515548211193-39b3f3b7d09f?q=80&w=600&auto=format&fit=crop" },
  ],
  // 2: Móc khóa
  [
    { title: "Móc khóa kim loại - Mini bản đồ Việt Nam", author: "KeyMap", publisher: "KeyMap", description: "Móc khóa kim loại khắc hình bản đồ Việt Nam, bề mặt mạ sáng, dễ mang theo.", price: 79000, stockQuantity: 220, imageUrl: "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?q=80&w=600&auto=format&fit=crop" },
    { title: "Móc khóa thủ công - Gốm sứ", author: "CeramiCraft", publisher: "CeramiCraft", description: "Móc khóa gốm sứ họa tiết vẽ tay, mỗi chiếc là một tác phẩm nhỏ.", price: 99000, stockQuantity: 110, imageUrl: "https://images.unsplash.com/photo-1526045612212-70caf35c14df?q=80&w=600&auto=format&fit=crop" },
    { title: "Móc khóa LED phát sáng - Heart", author: "GlowKey", publisher: "GlowKey", description: "Móc khóa LED nhỏ phát sáng nhiều màu, thích hợp trẻ em và thiết kế hiện đại.", price: 119000, stockQuantity: 180, imageUrl: "https://images.unsplash.com/photo-1579370318441-5a7b0b3b8dcd?q=80&w=600&auto=format&fit=crop" },
    { title: "Móc khóa gỗ khắc laser - Thư pháp", author: "WoodArt", publisher: "WoodArt", description: "Móc khóa gỗ khắc laser với chữ thư pháp, thích hợp làm quà tặng cá nhân.", price: 69000, stockQuantity: 160, imageUrl: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?q=80&w=600&auto=format&fit=crop" },
    { title: "Móc khóa đa năng - Đèn, dao mini", author: "MultiToolKey", publisher: "MultiToolKey", description: "Móc khóa đa chức năng với đèn LED và dao mini (không phải dụng cụ nguy hiểm), tiện lợi khi đi du lịch.", price: 139000, stockQuantity: 90, imageUrl: "https://images.unsplash.com/photo-1562003380-0c8f6b5f0a4e?q=80&w=600&auto=format&fit=crop" },
  ],
  // 3: Ly & Cốc
  [
    { title: "Ly sứ in hình - Bộ 2 chiếc", author: "CeramiCo", publisher: "CeramiCo", description: "Bộ 2 ly sứ in họa tiết, dung tích 320ml, an toàn cho thực phẩm.", price: 159000, stockQuantity: 140, imageUrl: "https://images.unsplash.com/photo-1517685352821-92cf88aee5a5?q=80&w=600&auto=format&fit=crop" },
    { title: "Cốc giữ nhiệt chân không - 450ml", author: "ThermoCup", publisher: "ThermoCup", description: "Cốc giữ nhiệt chân không với nắp chống tràn, giữ nóng/lạnh lâu, phù hợp làm quà doanh nghiệp.", price: 299000, stockQuantity: 80, imageUrl: "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?q=80&w=600&auto=format&fit=crop" },
    { title: "Ly thủy tinh in logo - Quà tặng sự kiện", author: "GlassPro", publisher: "GlassPro", description: "Ly thủy tinh cao cấp in logo, phù hợp quà tặng sự kiện hoặc quà lưu niệm công ty.", price: 189000, stockQuantity: 60, imageUrl: "https://images.unsplash.com/photo-1511381939415-5c7bd5561e3f?q=80&w=600&auto=format&fit=crop" },
    { title: "Cốc giấy thiết kế - Bộ 10 chiếc", author: "EcoCup", publisher: "EcoCup", description: "Cốc giấy thiết kế thân thiện môi trường, thích hợp dùng trong hội nghị hoặc làm quà nhỏ.", price: 99000, stockQuantity: 300, imageUrl: "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?q=80&w=600&auto=format&fit=crop" },
    { title: "Ly men handmade - Họa tiết nghệ thuật", author: "ArtMug", publisher: "ArtMug", description: "Ly men handmade với họa tiết nghệ thuật, thích hợp trang trí và làm quà cao cấp.", price: 249000, stockQuantity: 35, imageUrl: "https://images.unsplash.com/photo-1526318472351-c75fcf070b6a?q=80&w=600&auto=format&fit=crop" },
  ],
];

async function main() {
  console.log("🚀 Bắt đầu seed sản phẩm Quà Lưu Niệm (Port 5005)...\n");

  const categories = await get("/categories");
  console.log(`📋 Tìm thấy ${categories.length} danh mục trong DB`);

  // Map existing categories by name
  const existing = new Map();
  for (const c of categories) existing.set(c.name, c);

  // Ensure desired categories exist (create if missing)
  const matched = [];
  for (let i = 0; i < DESIRED_CATEGORIES.length; i++) {
    const item = DESIRED_CATEGORIES[i];
    let cat = existing.get(item.name);
    if (!cat) {
      try {
        const created = await post('/categories', { 
            name: item.name, 
            type: item.type,
            description: `Danh mục ${item.name} (tạo bởi seeder)`, 
            imageUrl: '' 
        });
        console.log(`  ➕ Tạo danh mục mới: "${created.name}" (id=${created.id})`);
        cat = created;
      } catch (err) {
        console.error(`  ❌ Không thể tạo danh mục "${item.name}":`, err.message);
        continue;
      }
    } else {
      console.log(`  ✅ Đã tìm thấy danh mục: "${item.name}" (id=${cat.id})`);
    }
    matched.push({ ...cat, productIndex: i });
  }

  if (matched.length === 0) {
    console.log("❌ Không có danh mục để gán sản phẩm. Dừng lại.");
    return;
  }

  let total = 0;
  for (const cat of matched) {
    const products = allProducts[cat.productIndex] || [];
    for (const p of products) {
      try {
        const created = await post('/books', { ...p, categoryId: cat.id, status: 'Available' });
        console.log(`  📝 [${cat.name}] ${created.title} → id=${created.id}`);
        total++;
      } catch (err) {
        console.error(`  ❌ Lỗi tạo "${p.title}":`, err.message);
      }
    }
  }

  console.log(`\n🎉 Hoàn tất! Đã tạo ${total} sản phẩm quà lưu niệm.`);
}

main().catch((err) => {
  console.error('Lỗi seed:', err);
});
