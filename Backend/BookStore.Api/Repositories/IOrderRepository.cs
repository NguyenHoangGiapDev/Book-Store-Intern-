using BookStore.Api.Models;

namespace BookStore.Api.Repositories;

public interface IOrderRepository
{
    Task<List<Order>> GetAllAsync();

    Task<Order?> GetByIdAsync(int id);

    Task<List<Order>> GetByUserIdAsync(int userId);

    Task<Order> CreateAsync(Order order);

    Task UpdateAsync(Order order);

    Task DeleteAsync(Order order);

    Task<bool> ExistsAsync(int id);
}