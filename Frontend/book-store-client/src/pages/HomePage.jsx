import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { fetchAllProducts } from "../utils/bookDisplay.js";
import { filterStationeryBooks } from "../utils/stationeryCatalog.js";
import { filterToysBooks } from "../utils/toysCatalog.js";
import ProductBookCard from "../components/catalog/ProductBookCard.jsx";
import { getCategories } from "../services/categoryService.js";
import { apiRequest } from "../services/apiClient";
import "../styles/HomePage.css";

function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const defaultBanners = [
    {
      imgSrc: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=1200&auto=format&fit=crop",
      title: "Tri thức là sức mạnh",
      description: "Khám phá hàng ngàn tựa sách hay với ưu đãi lên đến 50% trong tháng này.",
      buttonText: "Mua ngay",
      color: "#0f172a"
    },
    {
      imgSrc: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=1200&auto=format&fit=crop",
      title: "Góc học tập sáng tạo",
      description: "Bộ sưu tập văn phòng phẩm cao cấp giúp bạn làm việc hiệu quả hơn mỗi ngày.",
      buttonText: "Khám phá",
      color: "#1e3a8a"
    },
    {
      imgSrc: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?q=80&w=1200&auto=format&fit=crop",
      title: "Thế giới của bé",
      description: "Đồ chơi trí tuệ an toàn, khơi gợi niềm đam mê khám phá cho trẻ nhỏ.",
      buttonText: "Sắm ngay",
      color: "#166534"
    }
  ];

  const [promotions, setPromotions] = useState([]);

  const banners = useMemo(() => {
    if (!promotions || promotions.length === 0) return defaultBanners;

    const baseImages = [
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=1200&auto=format&fit=crop"
    ];
    const baseColors = ["#0f172a", "#1e3a8a", "#166534", "#7c2d12"];

    return promotions.map((p, index) => {
      const discount = p.discountPercent ?? p.DiscountPercent ?? p.discount ?? p.Discount ?? 0;
      const code = p.code ?? p.Code ?? "";
      return {
        imgSrc: baseImages[index % baseImages.length],
        title: p.name || p.Name || "Khuyến mãi đặc biệt",
        description: p.description || p.Description || `Nhập mã ${code} để giảm ${discount}%.`,
        buttonText: "Khám phá ngay",
        color: baseColors[index % baseColors.length]
      };
    });
  }, [promotions]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, catsData, promosData] = await Promise.all([
          fetchAllProducts(),
          getCategories(),
          apiRequest("/promotions").catch(() => [])
        ]);
        setBooks(productsData || []);
        setCategories(catsData || []);

        const activePromos = (promosData || []).filter((p) => {
          const today = new Date().toISOString().slice(0, 10);
          const start = p.startDate || p.StartDate;
          const end = p.endDate || p.EndDate;
          const isActive = p.isActive ?? p.IsActive ?? true;
          
          if (!isActive) return false;
          if (start && today < start.slice(0, 10)) return false;
          if (end && today > end.slice(0, 10)) return false;
          return true;
        });
        setPromotions(activePromos);
      } catch (err) {
        console.error("Error fetching homepage data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    const timer = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % banners.length);
    }, 5005);
    return () => clearInterval(timer);
  }, [banners.length]);

  const newArrivals = useMemo(() => {
    // Only books for this section
    return books.filter(b => b.originTable === "books").slice(0, 4);
  }, [books]);

  const stationeryItems = useMemo(() => {
    return filterStationeryBooks(books, categories).slice(0, 4);
  }, [books, categories]);

  const toyItems = useMemo(() => {
    return filterToysBooks(books, categories).slice(0, 4);
  }, [books, categories]);

  return (
    <div className="homepage-wrapper">
      {/* --- HERO SECTION --- */}
      <section className="hero-slider">
        <div className="container-fluid p-0 position-relative h-100">
          <div className="slider-container" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
            {banners.map((banner, index) => (
              <div key={index} className="slide-item">
                <div className="slide-bg-wrapper">
                  <img src={banner.imgSrc} alt={banner.title} className="slide-img" />
                  <div className="slide-overlay" style={{ background: `linear-gradient(135deg, ${banner.color}CC 0%, transparent 100%)` }}></div>
                </div>
                <div className="slide-content container h-100 d-flex align-items-center">
                  <div className="content-glass p-5 rounded-5 animate-slide-in shadow-lg border border-white border-opacity-10">
                    <span className="badge bg-white text-primary mb-3 px-3 py-2 fw-bold text-uppercase ls-wide" style={{ letterSpacing: '2px' }}>Bộ sưu tập 2024</span>
                    <h1 className="display-2 fw-bold text-white mb-4 lh-1">{banner.title}</h1>
                    <p className="fs-4 text-white-50 mb-5" style={{ maxWidth: '500px' }}>{banner.description}</p>
                    <div className="d-flex gap-3">
                      <Link to="/books" className="btn btn-primary btn-lg rounded-pill px-5 py-3 fw-bold shadow-lg hover-scale">
                        {banner.buttonText} <i className="bi bi-arrow-right ms-2"></i>
                      </Link>
                      <button className="btn btn-outline-light btn-lg rounded-pill px-5 py-3 fw-bold hover-scale">
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Navigation Arrows */}
          <button className="slider-arrow prev" onClick={() => setCurrentSlide(prev => (prev - 1 + banners.length) % banners.length)}>
            <i className="bi bi-chevron-left"></i>
          </button>
          <button className="slider-arrow next" onClick={() => setCurrentSlide(prev => (prev + 1) % banners.length)}>
            <i className="bi bi-chevron-right"></i>
          </button>

          <div className="slider-dots">
            {banners.map((_, index) => (
              <button 
                key={index} 
                className={`dot ${currentSlide === index ? 'active' : ''}`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* --- TRUST BADGES --- */}
      <section className="trust-badges py-5 bg-white border-bottom">
        <div className="container">
          <div className="row g-4 text-center">
            <div className="col-md-3 col-6">
              <div className="badge-item">
                <i className="bi bi-truck text-primary fs-1 mb-3"></i>
                <h6 className="fw-bold mb-1">Giao hàng miễn phí</h6>
                <p className="text-muted small mb-0">Cho đơn hàng từ 199k</p>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="badge-item">
                <i className="bi bi-shield-check text-primary fs-1 mb-3"></i>
                <h6 className="fw-bold mb-1">Sản phẩm chính hãng</h6>
                <p className="text-muted small mb-0">Cam kết 100% chất lượng</p>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="badge-item">
                <i className="bi bi-arrow-repeat text-primary fs-1 mb-3"></i>
                <h6 className="fw-bold mb-1">Đổi trả dễ dàng</h6>
                <p className="text-muted small mb-0">Trong vòng 7 ngày làm việc</p>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="badge-item">
                <i className="bi bi-headset text-primary fs-1 mb-3"></i>
                <h6 className="fw-bold mb-1">Hỗ trợ 24/7</h6>
                <p className="text-muted small mb-0">Tư vấn nhiệt tình, tận tâm</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- FEATURED CATEGORIES --- */}
      <section className="featured-categories py-5 bg-light">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold h1">DANH MỤC NỔI BẬT</h2>
            <div className="section-divider mx-auto"></div>
          </div>
          <div className="row g-4 justify-content-center">
            {[
              { title: "Sách văn học", icon: "bi-book", color: "#6366f1", link: "/books?category=sach-van-hoc" },
              { title: "Sách kinh tế", icon: "bi-graph-up-arrow", color: "#f59e0b", link: "/books?category=sach-kinh-te" },
              { title: "Sách thiếu nhi", icon: "bi-balloon", color: "#ec4899", link: "/books?category=sach-thieu-nhi" },
              { title: "Văn phòng phẩm", icon: "bi-pencil-square", color: "#10b981", link: "/stationery" },
              { title: "Đồ chơi", icon: "bi-robot", color: "#06b6d4", link: "/toys" },
              { title: "Quà lưu niệm", icon: "bi-gift", color: "#8b5cf6", link: "/souvenirs" }
            ].map((cat, idx) => (
              <div key={idx} className="col-lg-2 col-md-4 col-6">
                <Link to={cat.link} className="category-item-card text-decoration-none shadow-sm">
                  <div className="cat-icon-box" style={{ backgroundColor: `${cat.color}15`, color: cat.color }}>
                    <i className={`bi ${cat.icon}`}></i>
                  </div>
                  <span className="cat-title">{cat.title}</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- NEW ARRIVALS --- */}
      <section className="new-arrivals py-5 bg-white">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center mb-5">
            <div>
              <h2 className="fw-bold mb-1">Sách mới nhất</h2>
            </div>
            <Link to="/books" className="btn btn-outline-primary rounded-pill px-4 fw-bold">Xem tất cả</Link>
          </div>
          <div className="row g-4">
            {loading ? (
              [1,2,3,4].map(i => <div key={i} className="col-lg-3 col-md-4 col-sm-6"><div className="skeleton-card" style={{height:'400px'}}></div></div>)
            ) : newArrivals.map((book, idx) => (
              <ProductBookCard key={book.id} book={book} delay={idx * 100} listingHref="/" />
            ))}
          </div>
        </div>
      </section>
      {/* --- PROMO BANNER --- */}
      <section className="promo-banner py-5">
        <div className="container">
          <div className="promo-card shadow-lg rounded-5 overflow-hidden position-relative">
            <img src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=1200&auto=format&fit=crop" alt="Promo" className="promo-bg" />
            <div className="promo-overlay d-flex align-items-center p-5">
              <div className="col-lg-6 text-white">
                <span className="badge bg-danger mb-3 px-3 py-2 fs-6">Sự kiện đặc biệt</span>
                <h2 className="display-5 fw-bold mb-4">Ngày Hội Văn Hóa Đọc 2024</h2>
                <p className="lead mb-4">Tham gia ngay để nhận hàng ngàn mã giảm giá và quà tặng hấp dẫn dành riêng cho hội viên Book-Store.</p>
                <button className="btn btn-light btn-lg rounded-pill px-5 fw-bold text-primary">Tham gia ngay</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- STATIONERY & TOYS --- */}
      <section className="stationery-section py-5 bg-light">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold h1">Góc sáng tạo & vui chơi</h2>
            <p className="text-muted">Văn phòng phẩm và đồ chơi trí tuệ dành cho mọi lứa tuổi</p>
            <div className="section-divider mx-auto"></div>
          </div>
          <div className="row g-4">
             {loading ? (
               [1,2,3,4].map(i => <div key={i} className="col-lg-3 col-md-4 col-sm-6"><div className="skeleton-card" style={{height:'400px'}}></div></div>)
             ) : (
               <>
                {stationeryItems.map((book, idx) => <ProductBookCard key={book.id} book={book} delay={idx * 100} listingHref="/" />)}
                {toyItems.map((book, idx) => <ProductBookCard key={book.id} book={book} delay={idx * 100 + 400} listingHref="/" />)}
               </>
             )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
