using BookStore.Api.Data;
using BookStore.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BookStore.Api.Repositories;

public class CategoryRepository : ICategoryRepository // Triển khai ICategoryRepository để quản lý dữ liệu Category
{
    private readonly AppDbContext _context;

    public CategoryRepository(AppDbContext context) // Sử dụng AppDbContext để tương tác với cơ sở dữ liệu
    {
        _context = context;
    }

    public async Task<List<Category>> GetAllAsync() // Lấy tất cả các danh mục, sắp xếp theo tên và không theo dõi thay đổi (AsNoTracking)
    {
        return await _context.Categories
            .AsNoTracking()
            .OrderBy(category => category.Name)
            .ToListAsync();
    }

    public async Task<Category?> GetByIdAsync(int id) // Lấy một danh mục theo ID, bao gồm các sách thuộc danh mục đó
    {
        return await _context.Categories
            .Include(category => category.Books)
            .FirstOrDefaultAsync(category => category.Id == id);
    }

    public async Task<Category> CreateAsync(Category category) // Thêm một danh mục mới vào cơ sở dữ liệu và lưu thay đổi
    {
        _context.Categories.Add(category);

        await _context.SaveChangesAsync();

        return category;
    }

    public async Task UpdateAsync(Category category) // Cập nhật thông tin của một danh mục đã tồn tại và lưu thay đổi
    {
        _context.Categories.Update(category);

        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(Category category) // Xóa một danh mục khỏi cơ sở dữ liệu và lưu thay đổi
    {
        _context.Categories.Remove(category);

        await _context.SaveChangesAsync();
    }

    public async Task<bool> ExistsAsync(int id) // Kiểm tra xem một danh mục có tồn tại trong cơ sở dữ liệu hay không dựa trên ID
    {
        // The system stores categories in multiple tables (books categories and several
        // product-specific category tables that are exposed to the client with an
        // offset (e.g. StationeryCategories are returned as Id + 1000). The frontend
        // subtracts offsets before sending CategoryId for non-book products, so here
        // we must check existence across all category tables.

        if (await _context.Categories.AnyAsync(category => category.Id == id)) return true;

        if (await _context.StationeryCategories.AnyAsync(c => c.Id == id)) return true;
        if (await _context.ToyCategories.AnyAsync(c => c.Id == id)) return true;
        if (await _context.SouvenirCategories.AnyAsync(c => c.Id == id)) return true;
        if (await _context.AccessoryCategories.AnyAsync(c => c.Id == id)) return true;
        if (await _context.SchoolSupplyCategories.AnyAsync(c => c.Id == id)) return true;

        return false;
    }
    public async Task<bool> NameExistsAsync(string name) // Kiểm tra xem một danh mục có tồn tại trong cơ sở dữ liệu hay không dựa trên tên (để tránh trùng lặp tên danh mục)
    {
        return await _context.Categories
            .AnyAsync(category => category.Name.ToLower() == name.ToLower());
    }
}