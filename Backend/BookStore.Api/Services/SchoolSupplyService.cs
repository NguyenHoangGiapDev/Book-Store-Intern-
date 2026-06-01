using BookStore.Api.DTOs.SchoolSupply;
using BookStore.Api.Models;
using BookStore.Api.Repositories;

namespace BookStore.Api.Services;

public class SchoolSupplyService : ISchoolSupplyService
{
    private readonly ISchoolSupplyRepository _schoolSupplyRepository;
    private readonly BookStore.Api.Data.AppDbContext _context;

    public SchoolSupplyService(
        ISchoolSupplyRepository schoolSupplyRepository,
        BookStore.Api.Data.AppDbContext context)
    {
        _schoolSupplyRepository = schoolSupplyRepository;
        _context = context;
    }

    public async Task<List<SchoolSupplyDto>> GetAllAsync()
    {
        var items = await _schoolSupplyRepository.GetAllAsync();

        return items.Select(MapToDto).ToList();
    }

    public async Task<SchoolSupplyDto?> GetByIdAsync(int id)
    {
        var item = await _schoolSupplyRepository.GetByIdAsync(id);

        if (item == null)
        {
            return null;
        }

        return MapToDto(item);
    }

    public async Task<SchoolSupplyDto> CreateAsync(CreateSchoolSupplyDto request)
    {
        await EnsureCategoryExistsAsync(request.CategoryId);

        var schoolSupply = new SchoolSupply
        {
            Title = request.Title?.Trim() ?? string.Empty,
            Brand = request.Brand?.Trim() ?? string.Empty,
            Manufacturer = request.Manufacturer?.Trim(),
            Description = request.Description?.Trim(),
            ImageUrl = request.ImageUrl?.Trim(),
            Price = request.Price,
            StockQuantity = request.StockQuantity,
            CategoryId = request.CategoryId,
            Status = request.Status?.Trim() ?? "Available",
            CreatedAt = DateTime.UtcNow
        };

        var created = await _schoolSupplyRepository.CreateAsync(schoolSupply);

        return MapToDto(created);
    }

    public async Task<bool> UpdateAsync(int id, UpdateSchoolSupplyDto request)
    {
        var schoolSupply = await _schoolSupplyRepository.GetByIdAsync(id);

        if (schoolSupply == null)
        {
            return false;
        }

        await EnsureCategoryExistsAsync(request.CategoryId);

        schoolSupply.Title = request.Title?.Trim() ?? string.Empty;
        schoolSupply.Brand = request.Brand?.Trim() ?? string.Empty;
        schoolSupply.Manufacturer = request.Manufacturer?.Trim();
        schoolSupply.Description = request.Description?.Trim();
        schoolSupply.ImageUrl = request.ImageUrl?.Trim();
        schoolSupply.Price = request.Price;
        schoolSupply.StockQuantity = request.StockQuantity;
        schoolSupply.CategoryId = request.CategoryId;
        schoolSupply.Status = request.Status?.Trim() ?? "Available";
        schoolSupply.UpdatedAt = DateTime.UtcNow;

        await _schoolSupplyRepository.UpdateAsync(schoolSupply);

        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var schoolSupply = await _schoolSupplyRepository.GetByIdAsync(id);

        if (schoolSupply == null)
        {
            return false;
        }

        await _schoolSupplyRepository.DeleteAsync(schoolSupply);

        return true;
    }

    private async Task EnsureCategoryExistsAsync(int categoryId)
    {
        var categoryExists = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.AnyAsync(
            _context.SchoolSupplyCategories, x => x.Id == categoryId);

        if (!categoryExists)
        {
            throw new InvalidOperationException($"Category with id {categoryId} was not found.");
        }
    }

    private static SchoolSupplyDto MapToDto(SchoolSupply schoolSupply)
    {
        return new SchoolSupplyDto
        {
            Id = schoolSupply.Id,
            Title = schoolSupply.Title,
            Brand = schoolSupply.Brand,
            Manufacturer = schoolSupply.Manufacturer,
            Description = schoolSupply.Description,
            ImageUrl = schoolSupply.ImageUrl,
            Price = schoolSupply.Price,
            StockQuantity = schoolSupply.StockQuantity,
            Status = schoolSupply.Status,
            CategoryId = schoolSupply.CategoryId,
            CategoryName = schoolSupply.Category?.Name,
            CreatedAt = schoolSupply.CreatedAt,
            UpdatedAt = schoolSupply.UpdatedAt
        };
    }
}