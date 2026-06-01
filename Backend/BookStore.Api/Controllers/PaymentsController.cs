using BookStore.Api.Data;
using BookStore.Api.DTOs.Payments;
using BookStore.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookStore.Api.Controllers;

[ApiController]
[Route("api/payments")]
[Authorize]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;
    private readonly AppDbContext _context;

    public PaymentsController(
        IPaymentService paymentService,
        AppDbContext context)
    {
        _paymentService = paymentService;
        _context = context;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<ActionResult<List<PaymentDto>>> GetAll()
    {
        var payments = await _paymentService.GetAllAsync();

        return Ok(payments);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<PaymentDto>> GetById(int id)
    {
        var payment = await _paymentService.GetByIdAsync(id);

        if (payment == null)
        {
            return NotFound(new
            {
                message = $"Payment with id {id} was not found."
            });
        }

        return Ok(payment);
    }

    [HttpGet("order/{orderId:int}")]
    public async Task<ActionResult<PaymentDto>> GetByOrderId(int orderId)
    {
        var activeCheck = await CheckOrderOwnerActiveAsync(orderId);

        if (activeCheck != null)
        {
            return activeCheck;
        }

        var payment = await _paymentService.GetByOrderIdAsync(orderId);

        if (payment == null)
        {
            return NotFound(new
            {
                message = $"Payment for order id {orderId} was not found."
            });
        }

        return Ok(payment);
    }

    [HttpPost]
    public async Task<ActionResult<PaymentDto>> Create(CreatePaymentDto request)
    {
        try
        {
            var activeCheck = await CheckOrderOwnerActiveAsync(request.OrderId);

            if (activeCheck != null)
            {
                return activeCheck;
            }

            var createdPayment = await _paymentService.CreateAsync(request);

            return CreatedAtAction(
                nameof(GetById),
                new { id = createdPayment.Id },
                createdPayment
            );
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new
            {
                message = exception.Message
            });
        }
    }

    [HttpPut("{id:int}/status")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> UpdateStatus(int id, UpdatePaymentStatusDto request)
    {
        var updated = await _paymentService.UpdateStatusAsync(id, request);

        if (!updated)
        {
            return NotFound(new
            {
                message = $"Payment with id {id} was not found."
            });
        }

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _paymentService.DeleteAsync(id);

        if (!deleted)
        {
            return NotFound(new
            {
                message = $"Payment with id {id} was not found."
            });
        }

        return NoContent();
    }

    private async Task<ActionResult?> CheckOrderOwnerActiveAsync(int orderId)
    {
        var order = await _context.Orders
            .Include(o => o.User)
            .FirstOrDefaultAsync(o => o.Id == orderId);

        if (order == null)
        {
            return NotFound(new
            {
                message = $"Order with id {orderId} was not found."
            });
        }

        if (order.User == null)
        {
            return Unauthorized(new
            {
                message = "Tài khoản của đơn hàng không tồn tại."
            });
        }

        if (!order.User.IsActive)
        {
            return Unauthorized(new
            {
                message = "Tài khoản của bạn đã bị khóa, không thể thanh toán."
            });
        }

        return null;
    }
}