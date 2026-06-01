using BookStore.Api.DTOs.Categories;
using BookStore.Api.Models;
using BookStore.Api.Repositories;

namespace BookStore.Api.Services;

public class CategoryService : ICategoryService
{
    private readonly ICategoryRepository _categoryRepository;

    public CategoryService(ICategoryRepository categoryRepository)
    {
        _categoryRepository = categoryRepository;
    }

    public async Task<List<CategoryDto>> GetAllAsync()
    {
        var categories = await _categoryRepository.GetAllAsync();

        return categories.Select(MapToDto).ToList();
    }

    public async Task<CategoryDto?> GetByIdAsync(int id)
    {
        var category = await _categoryRepository.GetByIdAsync(id);

        if (category == null)
        {
            return null;
        }

        return MapToDto(category);
    }

    public async Task<CategoryDto> CreateAsync(CreateCategoryDto request)
    {
        var categoryName = request.Name.Trim();

        var nameExists = await _categoryRepository.NameExistsAsync(categoryName);

        if (nameExists)
        {
            throw new InvalidOperationException("Category name already exists.");
        }

        var category = new Category
        {
            Name = categoryName,
            Description = request.Description?.Trim(),
            Type = request.Type?.Trim() ?? "sach"
        };

        var createdCategory = await _categoryRepository.CreateAsync(category);

        return MapToDto(createdCategory);
    }

    public async Task<bool> UpdateAsync(int id, UpdateCategoryDto request)
    {
        var category = await _categoryRepository.GetByIdAsync(id);

        if (category == null)
        {
            return false;
        }

        category.Name = request.Name.Trim();
        category.Description = request.Description?.Trim();
        if (request.Type != null)
        {
            category.Type = request.Type.Trim();
        }
        category.UpdatedAt = DateTime.UtcNow;

        await _categoryRepository.UpdateAsync(category);

        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var category = await _categoryRepository.GetByIdAsync(id);

        if (category == null)
        {
            return false;
        }

        await _categoryRepository.DeleteAsync(category);

        return true;
    }

    private static CategoryDto MapToDto(Category category)
    {
        return new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Description = category.Description,
            Type = category.Type,
            CreatedAt = category.CreatedAt,
            UpdatedAt = category.UpdatedAt
        };
    }
}