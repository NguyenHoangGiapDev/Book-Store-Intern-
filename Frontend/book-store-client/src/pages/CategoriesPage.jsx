import { useEffect, useState } from "react";
import CategoryForm from "../components/categories/CategoryForm";
import CategoryTable from "../components/categories/CategoryTable";
import Loading from "../components/common/Loading";
import {
  createCategory,
  deleteCategory,
  getCategories,
  getAllCategories,
  updateCategory,
} from "../services/categoryService";

const CATEGORY_TYPES = [
  { id: 'sach', name: 'Sách', label: 'Sách' },
  { id: 'van-phong-pham', name: 'Văn phòng phẩm', label: 'Văn phòng phẩm' },
  { id: 'do-choi', name: 'Đồ chơi', label: 'Đồ chơi' },
  { id: 'qua-luu-niem', name: 'Quà lưu niệm', label: 'Quà lưu niệm' },
  { id: 'do-dung-hoc-tap', name: 'Đồ dùng học tập', label: 'Đồ dùng học tập' },
  { id: 'phu-kien', name: 'Phụ kiện', label: 'Phụ kiện' },
];

function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sach');
  const [editingCategory, setEditingCategory] = useState(null);

  async function loadCategories() {
    try {
      setIsLoading(true);
      const data = await getAllCategories();
      
      // Combine all categories from different types
      const allCategories = [
        ...(data.books || []),
        ...(data.stationery || []),
        ...(data.toys || []),
        ...(data.souvenirs || []),
        ...(data.accessories || []),
        ...(data.schoolSupplies || [])
      ];
      
      setCategories(allCategories);
    } catch (error) {
      console.error("Error loading categories:", error);
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateCategory(formData) {
    try {
      await createCategory({
        ...formData,
        type: activeTab
      });
      await loadCategories();
    } catch (error) {
      alert(error.message);
    }
  }

  async function handleUpdateCategory(id, formData) {
    try {
      await updateCategory(id, formData);
      await loadCategories();
      setEditingCategory(null);
    } catch (error) {
      alert(error.message);
    }
  }

  async function handleDeleteCategory(id) {
    const confirmed = window.confirm("Bạn có chắc muốn xóa danh mục này không?");

    if (!confirmed) {
      return;
    }

    try {
      await deleteCategory(id);
      await loadCategories();
    } catch (error) {
      alert(error.message);
    }
  }

  function handleEditCategory(category) {
    setEditingCategory(category);
  }

  function handleCancelEdit() {
    setEditingCategory(null);
  }

  function getFilteredCategories() {
    return categories.filter(category => category.type === activeTab);
  }

  useEffect(() => {
    loadCategories();
  }, []);

  const currentCategoryType = CATEGORY_TYPES.find(type => type.id === activeTab);

  return (
    <div>
      <h2 className="mb-4">Quản lý danh mục</h2>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        {CATEGORY_TYPES.map(type => (
          <li className="nav-item" key={type.id}>
            <button
              className={`nav-link ${activeTab === type.id ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(type.id);
                setEditingCategory(null);
              }}
              style={{ cursor: 'pointer' }}
            >
              {type.name}
            </button>
          </li>
        ))}
      </ul>

      {/* Category Form */}
      <CategoryForm 
        onSubmit={editingCategory ? 
          (formData) => handleUpdateCategory(editingCategory.id, formData) : 
          handleCreateCategory
        }
        editingCategory={editingCategory}
        onCancel={editingCategory ? handleCancelEdit : null}
        categoryTypeName={currentCategoryType?.name}
      />

      {/* Category Table */}
      {isLoading ? (
        <Loading />
      ) : (
        <CategoryTable
          categories={getFilteredCategories()}
          onDelete={handleDeleteCategory}
          onEdit={handleEditCategory}
        />
      )}
    </div>
  );
}

export default CategoriesPage;