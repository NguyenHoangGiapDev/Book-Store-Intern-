using BookStore.Api.DTOs.Payments;
using BookStore.Api.Models;
using BookStore.Api.Repositories;

namespace BookStore.Api.Services;

public class PaymentService : IPaymentService
{
    private readonly IPaymentRepository _paymentRepository;
    private readonly IOrderRepository _orderRepository;

    public PaymentService(
        IPaymentRepository paymentRepository,
        IOrderRepository orderRepository)
    {
        _paymentRepository = paymentRepository;
        _orderRepository = orderRepository;
    }

    public async Task<List<PaymentDto>> GetAllAsync()
    {
        var payments = await _paymentRepository.GetAllAsync();

        return payments.Select(MapToDto).ToList();
    }

    public async Task<PaymentDto?> GetByIdAsync(int id)
    {
        var payment = await _paymentRepository.GetByIdAsync(id);

        if (payment == null)
        {
            return null;
        }

        return MapToDto(payment);
    }

    public async Task<PaymentDto?> GetByOrderIdAsync(int orderId)
    {
        var payment = await _paymentRepository.GetByOrderIdAsync(orderId);

        if (payment == null)
        {
            return null;
        }

        return MapToDto(payment);
    }

    public async Task<PaymentDto> CreateAsync(CreatePaymentDto request)
    {
        var orderExists = await _orderRepository.ExistsAsync(request.OrderId);

        if (!orderExists)
        {
            throw new InvalidOperationException($"Order with id {request.OrderId} was not found.");
        }

        var existingPayment = await _paymentRepository.GetByOrderIdAsync(request.OrderId);

        if (existingPayment != null)
        {
            throw new InvalidOperationException("This order already has a payment.");
        }

        var payment = new Payment
        {
            OrderId = request.OrderId,
            Amount = request.Amount,
            PaymentMethod = request.PaymentMethod.Trim(),
            Status = "Paid",
            PaidAt = DateTime.UtcNow
        };

        var createdPayment = await _paymentRepository.CreateAsync(payment);

        return MapToDto(createdPayment);
    }

    public async Task<bool> UpdateStatusAsync(int id, UpdatePaymentStatusDto request)
    {
        var payment = await _paymentRepository.GetByIdAsync(id);

        if (payment == null)
        {
            return false;
        }

        payment.Status = request.Status.Trim();

        if (payment.Status.Equals("Paid", StringComparison.OrdinalIgnoreCase))
        {
            payment.PaidAt = DateTime.UtcNow;
        }

        await _paymentRepository.UpdateAsync(payment);

        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var payment = await _paymentRepository.GetByIdAsync(id);

        if (payment == null)
        {
            return false;
        }

        await _paymentRepository.DeleteAsync(payment);

        return true;
    }

    private static PaymentDto MapToDto(Payment payment)
    {
        return new PaymentDto
        {
            Id = payment.Id,
            OrderId = payment.OrderId,
            Amount = payment.Amount,
            PaymentMethod = payment.PaymentMethod,
            Status = payment.Status,
            PaidAt = payment.PaidAt
        };
    }
}