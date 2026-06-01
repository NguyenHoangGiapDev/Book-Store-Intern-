using BookStore.Api.Models;

namespace BookStore.Api.Repositories;

public interface IAccessoryRepository
{
    Task<List<Accessory>> GetAllAsync();
    Task<Accessory?> GetByIdAsync(int id);
    Task<Accessory> CreateAsync(Accessory accessory);
    Task UpdateAsync(Accessory accessory);
    Task DeleteAsync(Accessory accessory);
}
