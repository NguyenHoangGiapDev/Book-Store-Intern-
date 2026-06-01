function CategoryTable({ categories, onDelete, onEdit }) {
  if (categories.length === 0) {
    return <p>Chưa có danh mục nào.</p>;
  }

  return (
    <div className="card">
      <div className="card-header">
        <strong>Danh sách danh mục</strong>
      </div>

      <div className="table-responsive">
        <table className="table table-bordered table-hover mb-0">
          <thead className="table-light">
            <tr>
              <th style={{ width: "80px" }}>ID</th>
              <th>Ảnh</th>
              <th>Tên danh mục</th>
              <th>Mô tả</th>
              <th style={{ width: "150px" }}>Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                <td>{category.id}</td>
                <td>
                  {category.imageUrl ? (
                    <img 
                      src={category.imageUrl} 
                      alt={category.name}
                      style={{ width: "50px", height: "50px", objectFit: "cover" }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div 
                      style={{ 
                        width: "50px", 
                        height: "50px", 
                        backgroundColor: "#f8f9fa", 
                        border: "1px solid #dee2e6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        color: "#6c757d"
                      }}
                    >
                      No image
                    </div>
                  )}
                </td>
                <td>{category.name}</td>
                <td>{category.description || "-"}</td>
                <td>
                  <div className="d-flex gap-1">
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => onEdit(category)}
                    >
                      Sửa
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => onDelete(category.id)}
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CategoryTable;