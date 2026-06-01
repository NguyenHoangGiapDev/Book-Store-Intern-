using BookStore.Api.DTOs.Orders;

namespace BookStore.Api.Services;

public interface IOrderService
{
    Task<List<OrderDto>> GetAllAsync();

    Task<OrderDto?> GetByIdAsync(int id);

    Task<List<OrderDto>> GetByUserIdAsync(int userId);

    Task<OrderDto> CreateAsync(CreateOrderDto request);

    Task<bool> UpdateStatusAsync(int id, UpdateOrderStatusDto request);

    Task<bool> DeleteAsync(int id);
    Task<bool> StaffUpdateAsync(int id, StaffUpdateOrderDto request);
}