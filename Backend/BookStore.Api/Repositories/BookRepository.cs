using BookStore.Api.Data;
using BookStore.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BookStore.Api.Repositories;

public class BookRepository : IBookRepository // Triển khai IBookRepository để quản lý dữ liệu Book
{
    private readonly AppDbContext _context; // Sử dụng AppDbContext để tương tác với cơ sở dữ liệu

    public BookRepository(AppDbContext context) // Khởi tạo BookRepository với AppDbContext được tiêm vào qua Dependency Injection
    {
        _context = context;
    }

    public async Task<List<Book>> GetAllAsync() // Lấy tất cả các sách, bao gồm thông tin danh mục, sắp xếp theo ngày tạo giảm dần và không theo dõi thay đổi (AsNoTracking)
    {
        return await _context.Books
            .Include(book => book.Category)
            .AsNoTracking()
            .OrderByDescending(book => book.CreatedAt)
            .ToListAsync();
    }

    public async Task<Book?> GetByIdAsync(int id) // Lấy một sách theo ID, bao gồm thông tin danh mục
    {
        return await _context.Books
            .Include(book => book.Category)
            .FirstOrDefaultAsync(book => book.Id == id);
    }

    public async Task<Book> CreateAsync(Book book) // Thêm một sách mới vào cơ sở dữ liệu và lưu thay đổi
    {
        _context.Books.Add(book);

        await _context.SaveChangesAsync();

        return book;
    }

    public async Task UpdateAsync(Book book) // Cập nhật thông tin của một sách đã tồn tại và lưu thay đổi
    { 
        _context.Books.Update(book);

        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(Book book) // Xóa một sách khỏi cơ sở dữ liệu và lưu thay đổi
    {
        _context.Books.Remove(book);

        await _context.SaveChangesAsync();
    }

    public async Task<bool> ExistsAsync(int id) // Kiểm tra xem một sách có tồn tại trong cơ sở dữ liệu hay không dựa trên ID
    {
        return await _context.Books.AnyAsync(book => book.Id == id);
    }
}