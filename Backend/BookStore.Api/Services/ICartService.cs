using BookStore.Api.DTOs.Carts;

namespace BookStore.Api.Services;

public interface ICartService
{
    Task<CartDto> GetOrCreateCartAsync(int userId);

    Task<CartDto> AddItemAsync(AddCartItemDto request);

    Task<bool> UpdateItemAsync(int userId, int cartItemId, UpdateCartItemDto request);

    Task<bool> RemoveItemAsync(int userId, int cartItemId);

    Task<bool> ClearCartAsync(int userId);
}