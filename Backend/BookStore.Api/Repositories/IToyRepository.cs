using BookStore.Api.Models;

namespace BookStore.Api.Repositories;

public interface IToyRepository
{
    Task<List<Toy>> GetAllAsync();

    Task<Toy?> GetByIdAsync(int id);

    Task<Toy> CreateAsync(Toy toy);

    Task UpdateAsync(Toy toy);

    Task DeleteAsync(Toy toy);
}