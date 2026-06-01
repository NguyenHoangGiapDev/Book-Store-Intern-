using BookStore.Api.DTOs.Toy;
using BookStore.Api.Models;
using BookStore.Api.Repositories;

namespace BookStore.Api.Services;

public class ToyService : IToyService
{
    private readonly IToyRepository _toyRepository;
    private readonly BookStore.Api.Data.AppDbContext _context;

    public ToyService(
        IToyRepository toyRepository,
        BookStore.Api.Data.AppDbContext context)
    {
        _toyRepository = toyRepository;
        _context = context;
    }

    public async Task<List<ToyDto>> GetAllAsync()
    {
        var items = await _toyRepository.GetAllAsync();
        return items.Select(MapToDto).ToList();
    }

    public async Task<ToyDto?> GetByIdAsync(int id)
    {
        var item = await _toyRepository.GetByIdAsync(id);
        return item == null ? null : MapToDto(item);
    }

    public async Task<ToyDto> CreateAsync(CreateToyDto request)
    {
        ValidateRequest(
            request.Title,
            request.Price,
            request.StockQuantity,
            request.CategoryId
        );

        await EnsureCategoryExistsAsync(request.CategoryId);

        var toy = new Toy
        {
            Title = request.Title?.Trim() ?? "Đồ chơi mới",
            Brand = string.IsNullOrWhiteSpace(request.Brand)
                ? "N/A"
                : request.Brand.Trim(),
            Manufacturer = string.IsNullOrWhiteSpace(request.Manufacturer)
                ? null
                : request.Manufacturer.Trim(),
            Description = string.IsNullOrWhiteSpace(request.Description)
                ? null
                : request.Description.Trim(),
            ImageUrl = string.IsNullOrWhiteSpace(request.ImageUrl)
                ? null
                : request.ImageUrl.Trim(),
            Price = request.Price,
            StockQuantity = request.StockQuantity,
            CategoryId = request.CategoryId,
            Status = string.IsNullOrWhiteSpace(request.Status)
                ? "Available"
                : request.Status.Trim(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = null
        };

        var created = await _toyRepository.CreateAsync(toy);

        return MapToDto(created);
    }

    public async Task<bool> UpdateAsync(int id, UpdateToyDto request)
    {
        ValidateRequest(
            request.Title,
            request.Price,
            request.StockQuantity,
            request.CategoryId
        );

        var toy = await _toyRepository.GetByIdAsync(id);

        if (toy == null)
        {
            return false;
        }

        await EnsureCategoryExistsAsync(request.CategoryId);

        toy.Title = request.Title?.Trim() ?? toy.Title;
        toy.Brand = string.IsNullOrWhiteSpace(request.Brand)
            ? "N/A"
            : request.Brand.Trim();
        toy.Manufacturer = string.IsNullOrWhiteSpace(request.Manufacturer)
            ? null
            : request.Manufacturer.Trim();
        toy.Description = string.IsNullOrWhiteSpace(request.Description)
            ? null
            : request.Description.Trim();
        toy.ImageUrl = string.IsNullOrWhiteSpace(request.ImageUrl)
            ? null
            : request.ImageUrl.Trim();
        toy.Price = request.Price;
        toy.StockQuantity = request.StockQuantity;
        toy.CategoryId = request.CategoryId;
        toy.Status = string.IsNullOrWhiteSpace(request.Status)
            ? "Available"
            : request.Status.Trim();
        toy.UpdatedAt = DateTime.UtcNow;

        await _toyRepository.UpdateAsync(toy);

        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var toy = await _toyRepository.GetByIdAsync(id);

        if (toy == null)
        {
            return false;
        }

        await _toyRepository.DeleteAsync(toy);

        return true;
    }

    private static void ValidateRequest(
        string? title,
        decimal price,
        int stockQuantity,
        int categoryId)
    {
        if (string.IsNullOrWhiteSpace(title))
        {
            throw new InvalidOperationException("Tên đồ chơi không được để trống.");
        }

        if (price <= 0)
        {
            throw new InvalidOperationException("Giá bán phải lớn hơn 0.");
        }

        if (stockQuantity < 0)
        {
            throw new InvalidOperationException("Tồn kho không được nhỏ hơn 0.");
        }

        if (categoryId <= 0)
        {
            throw new InvalidOperationException("Danh mục không hợp lệ.");
        }
    }

    private async Task EnsureCategoryExistsAsync(int categoryId)
    {
        var categoryExists = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.AnyAsync(
            _context.ToyCategories, x => x.Id == categoryId);

        if (!categoryExists)
        {
            throw new InvalidOperationException(
                $"Category with id {categoryId} was not found."
            );
        }
    }

    private static ToyDto MapToDto(Toy toy)
    {
        return new ToyDto
        {
            Id = toy.Id,
            Title = toy.Title,
            Brand = toy.Brand,
            Manufacturer = toy.Manufacturer,
            Description = toy.Description,
            ImageUrl = toy.ImageUrl,
            Price = toy.Price,
            StockQuantity = toy.StockQuantity,
            Status = toy.Status,
            CategoryId = toy.CategoryId,
            CategoryName = toy.Category?.Name,
            CreatedAt = toy.CreatedAt,
            UpdatedAt = toy.UpdatedAt
        };
    }
}