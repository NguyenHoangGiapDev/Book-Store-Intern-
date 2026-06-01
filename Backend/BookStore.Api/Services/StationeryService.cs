using BookStore.Api.DTOs.Stationery;
using BookStore.Api.Models;
using BookStore.Api.Repositories;

namespace BookStore.Api.Services;

public class StationeryService : IStationeryService
{
    private readonly IStationeryRepository _stationeryRepository;
    private readonly BookStore.Api.Data.AppDbContext _context;

    public StationeryService(
        IStationeryRepository stationeryRepository,
        BookStore.Api.Data.AppDbContext context)
    {
        _stationeryRepository = stationeryRepository;
        _context = context;
    }

    public async Task<List<StationeryDto>> GetAllAsync(string? type = null)
    {
        var items = await _stationeryRepository.GetAllAsync();

        if (!string.IsNullOrWhiteSpace(type))
        {
            items = items
                .Where(x => x.Type != null && x.Type.ToLower() == type.ToLower())
                .ToList();
        }

        return items.Select(MapToDto).ToList();
    }

    public async Task<StationeryDto?> GetByIdAsync(int id)
    {
        var item = await _stationeryRepository.GetByIdAsync(id);

        if (item == null)
        {
            return null;
        }

        return MapToDto(item);
    }

    public async Task<StationeryDto> CreateAsync(CreateStationeryDto request)
    {
        await EnsureStationeryCategoryAsync(request.CategoryId);

        var stationery = new Stationery
        {
            Title = request.Title?.Trim() ?? string.Empty,
            Brand = request.Brand?.Trim() ?? string.Empty,
            Type = request.Type?.Trim() ?? "stationery",
            Manufacturer = request.Manufacturer?.Trim(),
            Description = request.Description?.Trim(),
            ImageUrl = request.ImageUrl?.Trim(),
            Price = request.Price,
            StockQuantity = request.StockQuantity,
            CategoryId = request.CategoryId,
            Status = request.Status?.Trim() ?? "Available",
            CreatedAt = DateTime.UtcNow
        };

        var created = await _stationeryRepository.CreateAsync(stationery);

        return MapToDto(created);
    }

    public async Task<bool> UpdateAsync(int id, UpdateStationeryDto request)
    {
        var stationery = await _stationeryRepository.GetByIdAsync(id);

        if (stationery == null)
        {
            return false;
        }

        await EnsureStationeryCategoryAsync(request.CategoryId);

        stationery.Title = request.Title?.Trim() ?? string.Empty;
        stationery.Brand = request.Brand?.Trim() ?? string.Empty;
        stationery.Type = request.Type?.Trim() ?? stationery.Type;
        stationery.Manufacturer = request.Manufacturer?.Trim();
        stationery.Description = request.Description?.Trim();
        stationery.Price = request.Price;
        stationery.StockQuantity = request.StockQuantity;
        stationery.ImageUrl = request.ImageUrl?.Trim();
        stationery.CategoryId = request.CategoryId;
        stationery.UpdatedAt = DateTime.UtcNow;

        await _stationeryRepository.UpdateAsync(stationery);

        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var stationery = await _stationeryRepository.GetByIdAsync(id);

        if (stationery == null)
        {
            return false;
        }

        await _stationeryRepository.DeleteAsync(stationery);

        return true;
    }

    private async Task EnsureStationeryCategoryAsync(int categoryId)
    {
        var exists = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.AnyAsync(
            _context.StationeryCategories, x => x.Id == categoryId);

        if (!exists)
        {
            throw new InvalidOperationException($"Category with id {categoryId} was not found.");
        }
    }

    private static StationeryDto MapToDto(Stationery stationery)
    {
        return new StationeryDto
        {
            Id = stationery.Id,
            Title = stationery.Title,
            Brand = stationery.Brand,
            Description = stationery.Description,
            Price = stationery.Price,
            StockQuantity = stationery.StockQuantity,
            ImageUrl = stationery.ImageUrl,
            CategoryId = stationery.CategoryId,
            CategoryName = stationery.Category?.Name
        };
    }
}