import { useState, useEffect } from "react";

function CategoryForm({ onSubmit, editingCategory, onCancel, categoryTypeName }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    imageUrl: "",
  });

  useEffect(() => {
    if (editingCategory) {
      setFormData({
        name: editingCategory.name || "",
        description: editingCategory.description || "",
        imageUrl: editingCategory.imageUrl || "",
      });
    } else {
      setFormData({
        name: "",
        description: "",
        imageUrl: "",
      });
    }
  }, [editingCategory]);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    onSubmit({
      name: formData.name.trim(),
      description: formData.description.trim(),
      imageUrl: formData.imageUrl.trim(),
    });

    if (!editingCategory) {
      setFormData({
        name: "",
        description: "",
        imageUrl: "",
      });
    }
  }

  function handleCancel() {
    if (onCancel) {
      onCancel();
    }
    setFormData({
      name: "",
      description: "",
      imageUrl: "",
    });
  }

  return (
    <form onSubmit={handleSubmit} className="card p-3 mb-4">
      <h5 className="mb-3">
        {editingCategory ? "Cập nhật danh mục" : `Thêm danh mục ${categoryTypeName || ""}`}
      </h5>

      <div className="mb-3">
        <label className="form-label">Tên danh mục</label>
        <input
          className="form-control"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder={editingCategory ? "" : `Ví dụ: ${categoryTypeName === "Sách" ? "Sách lập trình" : categoryTypeName === "Văn phòng phẩm" ? "Bút bi" : categoryTypeName === "Đồ chơi" ? "Đồ chơi giáo dục" : categoryTypeName === "Quà lưu niệm" ? "Bình hoa" : categoryTypeName === "Đồ dùng học tập" ? "Tập" : "Phụ kiện thời trang"}`}
        />
      </div>

      <div className="mb-3">
        <label className="form-label">Mô tả</label>
        <textarea
          className="form-control"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="3"
          placeholder={editingCategory ? "" : `Mô tả cho danh mục ${categoryTypeName || ""}`}
        />
      </div>

      <div className="mb-3">
        <label className="form-label">Image URL</label>
        <input
          className="form-control"
          name="imageUrl"
          value={formData.imageUrl}
          onChange={handleChange}
          placeholder="https://example.com/image.jpg"
        />
      </div>

      <div className="d-flex gap-2">
        <button type="submit" className="btn btn-primary">
          {editingCategory ? "Cập nhật" : "Thêm danh mục"}
        </button>
        
        {editingCategory && onCancel && (
          <button type="button" className="btn btn-secondary" onClick={handleCancel}>
            Hủy
          </button>
        )}
      </div>
    </form>
  );
}

export default CategoryForm;