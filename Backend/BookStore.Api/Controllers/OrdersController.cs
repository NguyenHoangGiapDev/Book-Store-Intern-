using BookStore.Api.DTOs.Orders;
using BookStore.Api.Repositories;
using BookStore.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BookStore.Api.Controllers;

[ApiController]
[Route("api/orders")]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;
    private readonly IUserRepository _userRepository;

    public OrdersController(
        IOrderService orderService,
        IUserRepository userRepository)
    {
        _orderService = orderService;
        _userRepository = userRepository;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<ActionResult<List<OrderDto>>> GetAll()
    {
        var orders = await _orderService.GetAllAsync();

        return Ok(orders);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<OrderDto>> GetById(int id)
    {
        var order = await _orderService.GetByIdAsync(id);

        if (order == null)
        {
            return NotFound(new
            {
                message = $"Order with id {id} was not found."
            });
        }

        return Ok(order);
    }

    [HttpGet("user/{userId:int}")]
    public async Task<ActionResult<List<OrderDto>>> GetByUserId(int userId)
    {
        var activeCheck = await CheckUserActiveAsync(userId);

        if (activeCheck != null)
        {
            return activeCheck;
        }

        var orders = await _orderService.GetByUserIdAsync(userId);

        return Ok(orders);
    }

    [HttpPost]
    public async Task<ActionResult<OrderDto>> Create(CreateOrderDto request)
    {
        try
        {
            var activeCheck = await CheckUserActiveAsync(request.UserId);

            if (activeCheck != null)
            {
                return activeCheck;
            }

            var createdOrder = await _orderService.CreateAsync(request);

            return CreatedAtAction(
                nameof(GetById),
                new { id = createdOrder.Id },
                createdOrder
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
    public async Task<IActionResult> UpdateStatus(int id, UpdateOrderStatusDto request)
    {
        var updated = await _orderService.UpdateStatusAsync(id, request);

        if (!updated)
        {
            return NotFound(new
            {
                message = $"Order with id {id} was not found."
            });
        }

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _orderService.DeleteAsync(id);

        if (!deleted)
        {
            return NotFound(new
            {
                message = $"Order with id {id} was not found."
            });
        }

        return NoContent();
    }

    [HttpPut("{id:int}/staff-update")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> StaffUpdate(int id, StaffUpdateOrderDto request)
    {
        var updated = await _orderService.StaffUpdateAsync(id, request);

        if (!updated)
        {
            return NotFound(new
            {
                message = $"Order with id {id} was not found."
            });
        }

        return NoContent();
    }

    private async Task<ActionResult?> CheckUserActiveAsync(int userId)
    {
        var user = await _userRepository.GetByIdAsync(userId);

        if (user == null)
        {
            return Unauthorized(new
            {
                message = "Tài khoản không tồn tại."
            });
        }

        if (!user.IsActive)
        {
            return Unauthorized(new
            {
                message = "Tài khoản của bạn đã bị khóa, không thể đặt hàng."
            });
        }

        return null;
    }
}