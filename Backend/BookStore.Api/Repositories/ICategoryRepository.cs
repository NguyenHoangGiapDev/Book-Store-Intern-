using BookStore.Api.Models;

namespace BookStore.Api.Repositories;

public interface ICategoryRepository // Định nghĩa giao diện ICategoryRepository để quản lý dữ liệu Category
{
    Task<List<Category>> GetAllAsync(); // Lấy tất cả các danh mục

    Task<Category?> GetByIdAsync(int id); // Lấy một danh mục theo ID

    Task<Category> CreateAsync(Category category); // Thêm một danh mục mới

    Task UpdateAsync(Category category); // Cập nhật thông tin của một danh mục đã tồn tại

    Task DeleteAsync(Category category); // Xóa một danh mục khỏi cơ sở dữ liệu

    Task<bool> ExistsAsync(int id); // Kiểm tra xem một danh mục có tồn tại trong cơ sở dữ liệu hay không dựa trên ID
    Task<bool> NameExistsAsync(string name); // Kiểm tra xem một danh mục có tồn tại trong cơ sở dữ liệu hay không dựa trên tên (để tránh trùng lặp tên danh mục)
}