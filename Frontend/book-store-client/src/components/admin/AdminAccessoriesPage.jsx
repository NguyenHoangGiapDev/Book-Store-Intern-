import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../services/apiClient";
import AdminStationery from "./AdminStationery";
const normalizeCategory = (item) => {
  const id = item?.id ?? item?.Id;
  const name = item?.name ?? item?.Name;
  const description = item?.description ?? item?.Description;
  const type = item?.type ?? item?.Type;
  if (id == null || !name) return null;

  return {
    id: Number(id),
    name,
    description: description || "",
    type: type || "",
  };
};

const normalizeBrand = (item) => {
  const id = item?.id ?? item?.Id;
  const name = item?.name ?? item?.Name;
  const description = item?.description ?? item?.Description;

  if (id == null || !name) return null;

  return {
    id: Number(id),
    name,
    description: description || "",
  };
};

const normalizeManufacturer = (item) => {
  const id = item?.id ?? item?.Id;
  const name = item?.name ?? item?.Name;
  const description = item?.description ?? item?.Description;
  const address = item?.address ?? item?.Address;
  const phone = item?.phone ?? item?.Phone;
  const email = item?.email ?? item?.Email;

  if (id == null || !name) return null;

  return {
    id: Number(id),
    name,
    description: description || "",
    address: address || "",
    phone: phone || "",
    email: email || "",
  };
};
function AdminAccessoriesPage() {
  const [accessories, setAccessories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        accessoriesData,
        categoriesData,
        brandsData,
        manufacturersData,
      ] = await Promise.all([
        apiRequest("/accessories"),
        apiRequest("/accessory-categories"),
        apiRequest("/brands"),
        apiRequest("/manufacturers"),
      ]);

      console.log("accessoriesData:", accessoriesData);
      console.log("accessoryCategoriesData:", categoriesData);
      console.log("brandsData:", brandsData);
      console.log("manufacturersData:", manufacturersData);

      setAccessories(Array.isArray(accessoriesData) ? accessoriesData : []);

      const normalizedCategories = Array.isArray(categoriesData)
        ? categoriesData.map(normalizeCategory).filter(Boolean)
        : [];

      const normalizedBrands = Array.isArray(brandsData)
        ? brandsData.map(normalizeBrand).filter(Boolean)
        : [];

      const normalizedManufacturers = Array.isArray(manufacturersData)
        ? manufacturersData.map(normalizeManufacturer).filter(Boolean)
        : [];

      setCategories(normalizedCategories);
      setBrands(normalizedBrands);
      setManufacturers(normalizedManufacturers);
    } catch (err) {
      console.error("Fetch accessories data error:", err);
      setError(err?.message || "Không thể tải dữ liệu phụ kiện");

      setAccessories([]);
      setCategories([]);
      setBrands([]);
      setManufacturers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const accessoryCategories = useMemo(() => {
    const unique = new Map();
    categories.forEach(item => {
      const nameKey = String(item.name || "").trim().toLowerCase();
      if (!nameKey) return;
      const existing = unique.get(nameKey);
      if (!existing || (item.id && (!existing.id || item.id < existing.id))) {
        unique.set(nameKey, item);
      }
    });
    return Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }, [categories]);

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="card border-0 shadow-sm rounded-4 p-5 text-center">
          <div className="spinner-border text-primary mx-auto mb-3" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>

          <h5 className="fw-bold mb-0">Đang tải dữ liệu phụ kiện...</h5>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-warning rounded-4 border-0 shadow-sm">
          <strong>Không thể tải dữ liệu phụ kiện.</strong> Chi tiết: {error}

          <div className="mt-3">
            <button
              type="button"
              className="btn btn-primary rounded-pill px-4"
              onClick={loadData}
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
      items={accessories}
      categories={accessoryCategories}
      brands={brands}
      manufacturers={manufacturers}
      refresh={loadData}
      productType="accessory"
      apiEndpoint="/accessories"
      pageTitle="QUẢN LÝ PHỤ KIỆN"
      addButtonText="Thêm mới"
      totalLabel="Tổng phụ kiện"
      searchPlaceholder="Tìm theo tên, thương hiệu phụ kiện..."
      categoryWarning="Cảnh báo: Chưa có danh mục phụ kiện."
      emptyText="Không tìm thấy phụ kiện nào"
      editModalTitle="Cập nhật"
      addModalTitle="Thêm mới"
      deleteTitle="Xóa phụ kiện"
      detailModalTitle="Xem chi tiết"
    />
  );
}

export default AdminAccessoriesPage;