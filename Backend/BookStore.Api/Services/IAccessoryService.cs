using BookStore.Api.DTOs.Accessory;

namespace BookStore.Api.Services;

public interface IAccessoryService
{
    Task<List<AccessoryDto>> GetAllAsync();
    Task<AccessoryDto?> GetByIdAsync(int id);
    Task<AccessoryDto> CreateAsync(CreateAccessoryDto request);
    Task<bool> UpdateAsync(int id, UpdateAccessoryDto request);
    Task<bool> DeleteAsync(int id);
}
