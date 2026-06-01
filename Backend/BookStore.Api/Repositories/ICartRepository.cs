using BookStore.Api.Models;

namespace BookStore.Api.Repositories;

public interface ICartRepository
{
    Task<Cart?> GetByUserIdAsync(int userId);

    Task<Cart?> GetByIdAsync(int id);

    Task<Cart> CreateAsync(Cart cart);

    Task UpdateAsync(Cart cart);

    Task DeleteAsync(Cart cart);
}