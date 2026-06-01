using BookStore.Api.DTOs.Categories;

namespace BookStore.Api.Services;

public interface ICategoryService // Định nghĩa giao diện ICategoryService để quản lý các hoạt động liên quan đến danh mục
{
    Task<List<CategoryDto>> GetAllAsync(); // Lấy tất cả các danh mục dưới dạng CategoryDto

    Task<CategoryDto?> GetByIdAsync(int id); // Lấy một danh mục theo ID dưới dạng CategoryDto, trả về null nếu không tìm thấy

    Task<CategoryDto> CreateAsync(CreateCategoryDto request); // Thêm một danh mục mới dựa trên CreateCategoryDto và trả về CategoryDto của danh mục đã tạo

    Task<bool> UpdateAsync(int id, UpdateCategoryDto request); // Cập nhật thông tin của một danh mục đã tồn tại dựa trên ID và UpdateCategoryDto, trả về true nếu cập nhật thành công, false nếu không tìm thấy danh mục

    Task<bool> DeleteAsync(int id); // Xóa một danh mục khỏi cơ sở dữ liệu dựa trên ID, trả về true nếu xóa thành công, false nếu không tìm thấy danh mục 
}