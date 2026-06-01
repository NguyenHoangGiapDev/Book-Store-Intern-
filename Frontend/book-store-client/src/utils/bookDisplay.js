/** Hằng và helper dùng chung cho danh sách + chi tiết sách */

export const BOOK_BACKEND_ORIGIN = "http://localhost:5005";
export const BOOK_LIST_API_URL = `${BOOK_BACKEND_ORIGIN}/api/books`;
export const STATIONERY_LIST_API_URL = `${BOOK_BACKEND_ORIGIN}/api/stationery`;

/** Fetch all product types and merge them */
export async function fetchAllProducts() {
  try {
    const endpoints = [
      { url: `${BOOK_BACKEND_ORIGIN}/api/books`, tag: "books" },
      { url: `${BOOK_BACKEND_ORIGIN}/api/stationery`, tag: "stationery" },
      { url: `${BOOK_BACKEND_ORIGIN}/api/toys`, tag: "toys" },
      { url: `${BOOK_BACKEND_ORIGIN}/api/souvenirs`, tag: "souvenirs" },
      { url: `${BOOK_BACKEND_ORIGIN}/api/accessories`, tag: "accessories" },
      { url: `${BOOK_BACKEND_ORIGIN}/api/school-supplies`, tag: "school-supplies" }
    ];

    const responses = await Promise.all(
      endpoints.map(e => fetch(e.url).catch(() => ({ ok: false })))
    );

    const dataPromises = responses.map(res => (res.ok ? res.json() : []));
    const allData = await Promise.all(dataPromises);

    const merged = allData.flatMap((data, index) => 
      (Array.isArray(data) ? data : []).map(item => ({
        ...item,
        originTable: endpoints[index].tag
      }))
    );

    return merged;
  } catch (err) {
    console.error("Fetch all products error:", err);
    return [];
  }
}

export const FALLBACK_BOOK_IMAGE =
  "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=600&auto=format&fit=crop";

export const getImageUrl = (rawUrl, titleOrId) => {
  if (!rawUrl) return FALLBACK_BOOK_IMAGE;
  
  if (rawUrl.includes("cdn.mybookstore.com")) {
    const isToy = rawUrl.includes("/toys/");
    const isStationery = rawUrl.includes("/stationery/");
    const isSouvenir = rawUrl.includes("/souvenirs/");
    const isAccessory = rawUrl.includes("/accessories/");
    const isSchoolSupply = rawUrl.includes("/school-supplies/");
    
    // Deterministic string hash combining URL and Title/ID to ensure a completely unique cover for each product
    let hash = 0;
    const combinedString = rawUrl + String(titleOrId || "");
    for (let i = 0; i < combinedString.length; i++) {
      hash = combinedString.charCodeAt(i) + ((hash << 5) - hash);
    }
    const seed = Math.abs(hash);
    
    if (isToy) {
      const TOY_COVERS = [
        "https://images.unsplash.com/photo-1537655780520-1e392edd816a?q=80&w=400&auto=format&fit=crop", // Wooden blocks
        "https://images.unsplash.com/photo-1587654780291-39c9404d746b?q=80&w=400&auto=format&fit=crop", // LEGO bricks
        "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?q=80&w=400&auto=format&fit=crop", // Toy car
        "https://images.unsplash.com/photo-1559251606-c623743a6d76?q=80&w=400&auto=format&fit=crop", // Colorful toys
        "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?q=80&w=400&auto=format&fit=crop", // Board games
        "https://images.unsplash.com/photo-1515488042361-404e9250afef?q=80&w=400&auto=format&fit=crop", // Toy stack
      ];
      return TOY_COVERS[seed % TOY_COVERS.length];
    }
    
    if (isStationery) {
      const STATIONERY_COVERS = [
        "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?q=80&w=400&auto=format&fit=crop", // Pencil holder
        "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?q=80&w=400&auto=format&fit=crop", // Workspace art
        "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=400&auto=format&fit=crop", // Notebook
        "https://images.unsplash.com/photo-1568205612837-017257d2310a?q=80&w=400&auto=format&fit=crop", // Drawing kit
      ];
      return STATIONERY_COVERS[seed % STATIONERY_COVERS.length];
    }
    
    if (isSouvenir) {
      const SOUVENIR_COVERS = [
        "https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=400&auto=format&fit=crop", // Gift package
        "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=400&auto=format&fit=crop", // Presents
      ];
      return SOUVENIR_COVERS[seed % SOUVENIR_COVERS.length];
    }
    
    if (isAccessory) {
      const ACCESSORY_COVERS = [
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=400&auto=format&fit=crop", // Backpack
        "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?q=80&w=400&auto=format&fit=crop", // Accessories
      ];
      return ACCESSORY_COVERS[seed % ACCESSORY_COVERS.length];
    }
    
    if (isSchoolSupply) {
      const SCHOOL_SUPPLY_COVERS = [
        "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=400&auto=format&fit=crop", // Notebook stack
        "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=400&auto=format&fit=crop", // Blackboard stack
      ];
      return SCHOOL_SUPPLY_COVERS[seed % SCHOOL_SUPPLY_COVERS.length];
    }
    
    // Default beautiful books covers
    const BOOK_COVERS = [
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=400&auto=format&fit=crop", // Blue cover
      "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=400&auto=format&fit=crop", // Classic pages
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=400&auto=format&fit=crop", // Red cover
      "https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=400&auto=format&fit=crop", // Open book
      "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=400&auto=format&fit=crop", // Library stack
      "https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=400&auto=format&fit=crop", // Stack of books
      "https://images.unsplash.com/photo-1495640388908-05fa85288e61?q=80&w=400&auto=format&fit=crop", // Reading vintage
      "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?q=80&w=400&auto=format&fit=crop", // Pages with coffee
    ];
    
    return BOOK_COVERS[seed % BOOK_COVERS.length];
  }
  
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://") || rawUrl.startsWith("data:")) return rawUrl;
  return `${BOOK_BACKEND_ORIGIN}/${rawUrl.replace(/^\/+/, "")}`;
};

export const formatBookPrice = (price) =>
  new Intl.NumberFormat("vi-VN").format(Number(price ?? 0)) + " đ";

export const bookCategoryId = (book) => book?.categoryId ?? book?.CategoryId;
export const bookCategoryName = (book) => book?.categoryName ?? book?.CategoryName;

/** Gợi lập đánh giá để UI giống TMĐT khi API chưa có trường review */
export const shopSignals = (book) => {
  const id = Number(book?.id) || 0;
  const reviews = 42 + ((id * 31) % 380);
  const rating = Number((4.2 + ((id % 8) / 10)).toFixed(1));
  return { reviews, rating };
};
