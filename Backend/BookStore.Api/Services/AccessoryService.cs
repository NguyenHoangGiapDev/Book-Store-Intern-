using BookStore.Api.DTOs.Accessory;
using BookStore.Api.Models;
using BookStore.Api.Repositories;

namespace BookStore.Api.Services;

public class AccessoryService : IAccessoryService
{
    private readonly IAccessoryRepository _accessoryRepository;
    private readonly BookStore.Api.Data.AppDbContext _context;

    public AccessoryService(
        IAccessoryRepository accessoryRepository,
        BookStore.Api.Data.AppDbContext context)
    {
        _accessoryRepository = accessoryRepository;
        _context = context;
    }

    public async Task<List<AccessoryDto>> GetAllAsync()
    {
        var items = await _accessoryRepository.GetAllAsync();
        return items.Select(MapToDto).ToList();
    }

    public async Task<AccessoryDto?> GetByIdAsync(int id)
    {
        var item = await _accessoryRepository.GetByIdAsync(id);
        return item == null ? null : MapToDto(item);
    }

    public async Task<AccessoryDto> CreateAsync(CreateAccessoryDto request)
    {
        await EnsureCategoryExistsAsync(request.CategoryId);

        var accessory = new Accessory
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

        var created = await _accessoryRepository.CreateAsync(accessory);
        return MapToDto(created);
    }

    public async Task<bool> UpdateAsync(int id, UpdateAccessoryDto request)
    {
        var accessory = await _accessoryRepository.GetByIdAsync(id);
        if (accessory == null) return false;

        await EnsureCategoryExistsAsync(request.CategoryId);

        accessory.Title = request.Title?.Trim() ?? accessory.Title;
        accessory.Brand = request.Brand?.Trim() ?? accessory.Brand;
        accessory.Manufacturer = request.Manufacturer?.Trim();
        accessory.Description = request.Description?.Trim();
        accessory.ImageUrl = request.ImageUrl?.Trim();
        accessory.Price = request.Price;
        accessory.StockQuantity = request.StockQuantity;
        accessory.CategoryId = request.CategoryId;
        accessory.Status = request.Status?.Trim() ?? "Available";
        accessory.UpdatedAt = DateTime.UtcNow;

        await _accessoryRepository.UpdateAsync(accessory);
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var accessory = await _accessoryRepository.GetByIdAsync(id);
        if (accessory == null) return false;

        await _accessoryRepository.DeleteAsync(accessory);
        return true;
    }

    private async Task EnsureCategoryExistsAsync(int categoryId)
    {
        var exists = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.AnyAsync(
            _context.AccessoryCategories, x => x.Id == categoryId);
        if (!exists) throw new InvalidOperationException($"Category with id {categoryId} was not found.");
    }

    private static AccessoryDto MapToDto(Accessory accessory)
    {
        return new AccessoryDto
        {
            Id = accessory.Id,
            Title = accessory.Title,
            Brand = accessory.Brand,
            Manufacturer = accessory.Manufacturer,
            Description = accessory.Description,
            ImageUrl = accessory.ImageUrl,
            Price = accessory.Price,
            StockQuantity = accessory.StockQuantity,
            Status = accessory.Status,
            CategoryId = accessory.CategoryId,
            CategoryName = accessory.Category?.Name,
            CreatedAt = accessory.CreatedAt,
            UpdatedAt = accessory.UpdatedAt
        };
    }
}
