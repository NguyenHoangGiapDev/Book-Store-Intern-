using BookStore.Api.Models;

namespace BookStore.Api.Repositories;

public interface IPaymentRepository
{
    Task<List<Payment>> GetAllAsync();

    Task<Payment?> GetByIdAsync(int id);

    Task<Payment?> GetByOrderIdAsync(int orderId);

    Task<Payment> CreateAsync(Payment payment);

    Task UpdateAsync(Payment payment);

    Task DeleteAsync(Payment payment);

    Task<bool> ExistsAsync(int id);
}