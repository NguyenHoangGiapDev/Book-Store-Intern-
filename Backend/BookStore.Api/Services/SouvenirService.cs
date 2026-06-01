using BookStore.Api.DTOs.Souvenir;
using BookStore.Api.Models;
using BookStore.Api.Repositories;

namespace BookStore.Api.Services;

public class SouvenirService : ISouvenirService
{
    private readonly ISouvenirRepository _souvenirRepository;
    private readonly BookStore.Api.Data.AppDbContext _context;

    public SouvenirService(
        ISouvenirRepository souvenirRepository,
        BookStore.Api.Data.AppDbContext context)
    {
        _souvenirRepository = souvenirRepository;
        _context = context;
    }

    public async Task<List<SouvenirDto>> GetAllAsync()
    {
        var items = await _souvenirRepository.GetAllAsync();
        return items.Select(MapToDto).ToList();
    }

    public async Task<SouvenirDto?> GetByIdAsync(int id)
    {
        var item = await _souvenirRepository.GetByIdAsync(id);
        return item == null ? null : MapToDto(item);
    }

    public async Task<SouvenirDto> CreateAsync(CreateSouvenirDto request)
    {
        await EnsureCategoryExistsAsync(request.CategoryId);

        var souvenir = new Souvenir
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

        var created = await _souvenirRepository.CreateAsync(souvenir);
        return MapToDto(created);
    }

    public async Task<bool> UpdateAsync(int id, UpdateSouvenirDto request)
    {
        var souvenir = await _souvenirRepository.GetByIdAsync(id);
        if (souvenir == null) return false;

        await EnsureCategoryExistsAsync(request.CategoryId);

        souvenir.Title = request.Title?.Trim() ?? souvenir.Title;
        souvenir.Brand = request.Brand?.Trim() ?? souvenir.Brand;
        souvenir.Manufacturer = request.Manufacturer?.Trim();
        souvenir.Description = request.Description?.Trim();
        souvenir.ImageUrl = request.ImageUrl?.Trim();
        souvenir.Price = request.Price;
        souvenir.StockQuantity = request.StockQuantity;
        souvenir.CategoryId = request.CategoryId;
        souvenir.Status = request.Status?.Trim() ?? "Available";
        souvenir.UpdatedAt = DateTime.UtcNow;

        await _souvenirRepository.UpdateAsync(souvenir);
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var souvenir = await _souvenirRepository.GetByIdAsync(id);
        if (souvenir == null) return false;

        await _souvenirRepository.DeleteAsync(souvenir);
        return true;
    }

    private async Task EnsureCategoryExistsAsync(int categoryId)
    {
        var exists = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.AnyAsync(
            _context.SouvenirCategories, x => x.Id == categoryId);
        if (!exists) throw new InvalidOperationException($"Category with id {categoryId} was not found.");
    }

    private static SouvenirDto MapToDto(Souvenir souvenir)
    {
        return new SouvenirDto
        {
            Id = souvenir.Id,
            Title = souvenir.Title,
            Brand = souvenir.Brand,
            Manufacturer = souvenir.Manufacturer,
            Description = souvenir.Description,
            ImageUrl = souvenir.ImageUrl,
            Price = souvenir.Price,
            StockQuantity = souvenir.StockQuantity,
            Status = souvenir.Status,
            CategoryId = souvenir.CategoryId,
            CategoryName = souvenir.Category?.Name,
            CreatedAt = souvenir.CreatedAt,
            UpdatedAt = souvenir.UpdatedAt
        };
    }
}
