using BookStore.Api.Models;

namespace BookStore.Api.Repositories;

public interface IBookRepository // Định nghĩa giao diện IBookRepository để quản lý dữ liệu Book
{
    Task<List<Book>> GetAllAsync(); // Lấy tất cả các sách

    Task<Book?> GetByIdAsync(int id); // Lấy một sách theo ID

    Task<Book> CreateAsync(Book book); // Thêm một sách mới

    Task UpdateAsync(Book book); // Cập nhật thông tin của một sách đã tồn tại

    Task DeleteAsync(Book book); // Xóa một sách khỏi cơ sở dữ liệu

    Task<bool> ExistsAsync(int id); // Kiểm tra xem một sách có tồn tại trong cơ sở dữ liệu hay không dựa trên ID
}