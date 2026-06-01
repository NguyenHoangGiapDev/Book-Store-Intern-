using BookStore.Api.Models;

namespace BookStore.Api.Repositories;

public interface IStationeryRepository
{
    Task<List<Stationery>> GetAllAsync();

    Task<Stationery?> GetByIdAsync(int id);

    Task<Stationery> CreateAsync(Stationery stationery);

    Task UpdateAsync(Stationery stationery);

    Task DeleteAsync(Stationery stationery);

    Task<bool> ExistsAsync(int id);
}
