using BookStore.Api.DTOs.Payments;

namespace BookStore.Api.Services;

public interface IPaymentService
{
    Task<List<PaymentDto>> GetAllAsync();

    Task<PaymentDto?> GetByIdAsync(int id);

    Task<PaymentDto?> GetByOrderIdAsync(int orderId);

    Task<PaymentDto> CreateAsync(CreatePaymentDto request);

    Task<bool> UpdateStatusAsync(int id, UpdatePaymentStatusDto request);

    Task<bool> DeleteAsync(int id);
}