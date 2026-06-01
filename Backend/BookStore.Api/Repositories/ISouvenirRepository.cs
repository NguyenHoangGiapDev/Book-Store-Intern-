using BookStore.Api.Models;

namespace BookStore.Api.Repositories;

public interface ISouvenirRepository
{
    Task<List<Souvenir>> GetAllAsync();
    Task<Souvenir?> GetByIdAsync(int id);
    Task<Souvenir> CreateAsync(Souvenir souvenir);
    Task UpdateAsync(Souvenir souvenir);
    Task DeleteAsync(Souvenir souvenir);
}
