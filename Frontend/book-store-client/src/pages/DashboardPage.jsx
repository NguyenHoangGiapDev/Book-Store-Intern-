import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { apiRequest } from "../services/apiClient";
import { showToast } from "../components/common/Toast.jsx";
import AdminOverview from "../components/admin/AdminOverview.jsx";
import AdminOrders from "../components/admin/AdminOrders.jsx";
import AdminBooks from "../components/admin/AdminBooks.jsx";
import AdminCategories from "../components/admin/AdminCategories.jsx";
import AdminCustomers from "../components/admin/AdminUsers.jsx";
import AdminPromotions from "../components/admin/AdminPromotions.jsx";
import AdminShipping from "../components/admin/AdminShipping.jsx";
import AdminReviews from "../components/admin/AdminReviews.jsx";
import AdminReports from "../components/admin/AdminReports.jsx";
import AdminStationery from "../components/admin/AdminStationeryPage.jsx";
import AdminMessages from "../components/admin/AdminMessages.jsx";


function DashboardPage() {
  const location = useLocation();
  const [data, setData] = useState({
    orders: [],
    books: [],
    stationery: [],
    users: [],
    categories: [],
    reviews: [],
    promotions: [],
    stats: { totalSales: 0, orderCount: 0, bookCount: 0, userCount: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
  setLoading(true);

  try {
      const [
        orders,
        books,
        stationery,
        users,
        categories,
        promotions,
      ] = await Promise.all([
        apiRequest("/orders").catch(() => []),
        apiRequest("/books").catch(() => []),
        apiRequest("/stationery").catch(() => []),
        apiRequest("/users").catch(() => []),
        apiRequest("/categories").catch(() => []),
        apiRequest("/promotions").catch(() => []),
      ]);
    

    const normalizeGeneralCategories = (items) => {
      return Array.isArray(items)
        ? items.map((item) => ({
            id: item.id ?? item.Id,
            name: item.name ?? item.Name,
            description: item.description ?? item.Description,
            createdAt: item.createdAt ?? item.CreatedAt,
            updatedAt: item.updatedAt ?? item.UpdatedAt,
            type: item.type ?? item.Type,
          }))
        : [];
    };

    const normalizedCategories = normalizeGeneralCategories(categories);

    const totalSales =
      orders?.reduce(
        (sum, o) => (o.status === "Completed" ? sum + o.totalAmount : sum),
        0
      ) || 0;

    setData({
      orders: orders || [],
      books: books || [],
      stationery: stationery || [],
      users: users || [],
      categories: normalizedCategories,
      reviews: [],
      promotions: promotions || [],
      stats: {
        totalSales,
        orderCount: orders?.length || 0,
        bookCount: (books?.length || 0) + (stationery?.length || 0),
        userCount: users?.length || 0,
      },
    });
  } catch (err) {
    console.error("Fetch dashboard data error:", err);
    showToast("Lỗi khi tải dữ liệu hệ thống", "error");
  } finally {
    setLoading(false);
  }
};

  const renderContent = () => {
    const path = location.pathname;
    if (path === "/admin" || path === "/admin/") return <AdminOverview data={data} refresh={fetchData} />;
    if (path.includes("/orders")) return <AdminOrders orders={data.orders} refresh={fetchData} />;

    if (path.includes("/books")) return <AdminBooks books={data.books} categories={data.categories} refresh={fetchData} />;
    
    if (path.includes("/stationery")) return <AdminStationery items={data.stationery} type="Văn phòng phẩm" categories={data.categories} refresh={fetchData} />;
    if (path.includes("/toys")) return <AdminStationery items={data.stationery} type="Đồ chơi" categories={data.categories} refresh={fetchData} />;
    if (path.includes("/school")) return <AdminStationery items={data.stationery} type="Đồ dùng học tập" categories={data.categories} refresh={fetchData} />;

    if (path.includes("/categories")) return <AdminCategories categories={data.categories} refresh={fetchData} />;
    if (path.includes("/customers")) return <AdminCustomers users={data.users} refresh={fetchData} />;
    if (path.includes("/promotions")) return <AdminPromotions promotions={data.promotions} refresh={fetchData} />;
    if (path.includes("/shipping")) return <AdminShipping orders={data.orders} refresh={fetchData} />;
    if (path.includes("/reviews")) return <AdminReviews reviews={data.reviews} refresh={fetchData} />;
    if (path.includes("/reports")) return <AdminReports data={data} refresh={fetchData} />;
    if (path.includes("/messages")) return <AdminMessages />;
    
    return <AdminOverview data={data} refresh={fetchData} />;
  };

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Đang tải...</span>
      </div>
    </div>
  );

  return renderContent();
}

export default DashboardPage;