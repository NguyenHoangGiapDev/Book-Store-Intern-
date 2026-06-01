import { useEffect, useState } from "react";
import { apiRequest } from "../../services/apiClient";
import AdminStationery from "./AdminStationery";

function AdminStationeryPage() {
  const [stationeries, setStationeries] = useState([]);
const [categories, setCategories] = useState([]);
const [brands, setBrands] = useState([]);
const [manufacturers, setManufacturers] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

  const normalizeCategory = (item) => ({
    id: item.id ?? item.Id,
    name: item.name ?? item.Name,
    description: item.description ?? item.Description,
    type: item.type ?? item.Type ?? "stationery",
  });

  const fetchStationeries = async () => {
    const data = await apiRequest("/stationery");
    setStationeries(Array.isArray(data) ? data : []);
  };

  const fetchCategories = async () => {
    const data = await apiRequest("/stationery-categories");

    const list = Array.isArray(data)
      ? data
          .map(normalizeCategory)
          .filter((category) => category.id && category.name)
          .filter(
            (category, index, self) =>
              index ===
              self.findIndex(
                (item) =>
                  item.name.trim().toLowerCase() ===
                  category.name.trim().toLowerCase()
              )
          )
      : [];

    setCategories(list);
  };

  const normalizeBrand = (item) => ({
  id: item.id ?? item.Id,
  name: item.name ?? item.Name,
  description: item.description ?? item.Description,
});

const fetchBrands = async () => {
  try {
    const data = await apiRequest("/brands");

    const list = Array.isArray(data)
      ? data
          .map(normalizeBrand)
          .filter((brand) => brand.id && brand.name)
      : [];

    setBrands(list);
  } catch (err) {
    console.error("Fetch brands error:", err);
    setBrands([]);
  }
};

const normalizeManufacturer = (item) => ({
  id: item.id ?? item.Id,
  name: item.name ?? item.Name,
  description: item.description ?? item.Description,
  address: item.address ?? item.Address,
  phone: item.phone ?? item.Phone,
  email: item.email ?? item.Email,
});

const fetchManufacturers = async () => {
  try {
    const data = await apiRequest("/manufacturers");

    const list = Array.isArray(data)
      ? data
          .map(normalizeManufacturer)
          .filter((manufacturer) => manufacturer.id && manufacturer.name)
      : [];

    setManufacturers(list);
  } catch (err) {
    console.error("Fetch manufacturers error:", err);
    setManufacturers([]);
  }
};

  const fetchPageData = async () => {
    try {
      setLoading(true);
      setError(null);

      await Promise.all([fetchStationeries(), fetchCategories(), fetchBrands(), fetchManufacturers(),]);
    } catch (err) {
      console.error("Fetch stationery page data error:", err);
      setError(err?.message || "Không thể tải dữ liệu văn phòng phẩm");
      setStationeries([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPageData();
  }, []);

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="card border-0 shadow-sm rounded-4 p-5 text-center">
          <div className="spinner-border text-primary mx-auto mb-3" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
          <h5 className="fw-bold mb-0">Đang tải dữ liệu văn phòng phẩm...</h5>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-warning rounded-4 border-0 shadow-sm">
          <strong>Không thể tải dữ liệu văn phòng phẩm.</strong> Chi tiết: {error}

          <div className="mt-3">
            <button
              type="button"
              className="btn btn-primary rounded-pill px-4"
              onClick={fetchPageData}
            >
              <i className="bi bi-arrow-clockwise me-2"></i>
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminStationery
      items={stationeries}
      categories={categories}
      brands={brands}
      manufacturers={manufacturers}
      refresh={fetchPageData}
      productType="stationery"
      apiEndpoint="/stationery"
      pageTitle="QUẢN LÝ VĂN PHÒNG PHẨM"
      addButtonText="Thêm mới"
      totalLabel="Tổng văn phòng phẩm"
      searchPlaceholder="Tìm theo tên, thương hiệu văn phòng phẩm..."
      categoryWarning="Cảnh báo: Chưa có danh mục văn phòng phẩm."
      emptyText="Không tìm thấy văn phòng phẩm nào"
      editModalTitle="Cập nhật văn phòng phẩm"
      addModalTitle="Thêm mới"
      deleteTitle="Xóa văn phòng phẩm"
    />
  );
}

export default AdminStationeryPage;