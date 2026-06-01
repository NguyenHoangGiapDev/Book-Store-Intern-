using BookStore.Api.DTOs.Carts;
using BookStore.Api.Repositories;
using BookStore.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BookStore.Api.Controllers;

[ApiController]
[Route("api/carts")]
[Authorize]
public class CartsController : ControllerBase
{
    private readonly ICartService _cartService;
    private readonly IUserRepository _userRepository;

    public CartsController(
        ICartService cartService,
        IUserRepository userRepository)
    {
        _cartService = cartService;
        _userRepository = userRepository;
    }

    [HttpGet("user/{userId:int}")]
    public async Task<ActionResult<CartDto>> GetByUserId(int userId)
    {
        try
        {
            var activeCheck = await CheckUserActiveAsync(userId);

            if (activeCheck != null)
            {
                return activeCheck;
            }

            var cart = await _cartService.GetOrCreateCartAsync(userId);

            return Ok(cart);
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new
            {
                message = exception.Message
            });
        }
    }

    [HttpPost("items")]
    public async Task<ActionResult<CartDto>> AddItem(AddCartItemDto request)
    {
        try
        {
            var activeCheck = await CheckUserActiveAsync(request.UserId);

            if (activeCheck != null)
            {
                return activeCheck;
            }

            var cart = await _cartService.AddItemAsync(request);

            return Ok(cart);
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new
            {
                message = exception.Message
            });
        }
    }

    [HttpPut("user/{userId:int}/items/{cartItemId:int}")]
    public async Task<IActionResult> UpdateItem(
        int userId,
        int cartItemId,
        UpdateCartItemDto request)
    {
        var activeCheck = await CheckUserActiveAsync(userId);

        if (activeCheck != null)
        {
            return activeCheck;
        }

        var updated = await _cartService.UpdateItemAsync(userId, cartItemId, request);

        if (!updated)
        {
            return NotFound(new
            {
                message = "Cart item was not found."
            });
        }

        return NoContent();
    }

    [HttpDelete("user/{userId:int}/items/{cartItemId:int}")]
    public async Task<IActionResult> RemoveItem(int userId, int cartItemId)
    {
        var activeCheck = await CheckUserActiveAsync(userId);

        if (activeCheck != null)
        {
            return activeCheck;
        }

        var removed = await _cartService.RemoveItemAsync(userId, cartItemId);

        if (!removed)
        {
            return NotFound(new
            {
                message = "Cart item was not found."
            });
        }

        return NoContent();
    }

    [HttpDelete("user/{userId:int}/clear")]
    public async Task<IActionResult> ClearCart(int userId)
    {
        var activeCheck = await CheckUserActiveAsync(userId);

        if (activeCheck != null)
        {
            return activeCheck;
        }

        var cleared = await _cartService.ClearCartAsync(userId);

        if (!cleared)
        {
            return NotFound(new
            {
                message = $"Cart for user id {userId} was not found."
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
                message = "Tài khoản của bạn đã bị khóa, không thể thao tác với giỏ hàng."
            });
        }

        return null;
    }
}