using BookStore.Api.DTOs.Stationery;

namespace BookStore.Api.Services;

public interface IStationeryService
{
    Task<List<StationeryDto>> GetAllAsync(string? type = null);

    Task<StationeryDto?> GetByIdAsync(int id);

    Task<StationeryDto> CreateAsync(CreateStationeryDto request);

    Task<bool> UpdateAsync(int id, UpdateStationeryDto request);

    Task<bool> DeleteAsync(int id);
}
