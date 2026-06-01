using BookStore.Api.Data;
using BookStore.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BookStore.Api.Repositories;

public class CartRepository : ICartRepository
{
    private readonly AppDbContext _context;

    public CartRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Cart?> GetByUserIdAsync(int userId)
    {
        return await _context.Carts
            .Include(cart => cart.User)
            .Include(cart => cart.CartItems)
                .ThenInclude(item => item.Book)
            .Include(cart => cart.CartItems)
                .ThenInclude(item => item.Toy)
            .Include(cart => cart.CartItems)
                .ThenInclude(item => item.Stationery)
            .Include(cart => cart.CartItems)
                .ThenInclude(item => item.SchoolSupply)
            .Include(cart => cart.CartItems)
                .ThenInclude(item => item.Accessory)
            .Include(cart => cart.CartItems)
                .ThenInclude(item => item.Souvenir)
            .FirstOrDefaultAsync(cart => cart.UserId == userId);
    }

    public async Task<Cart?> GetByIdAsync(int id)
    {
        return await _context.Carts
            .Include(cart => cart.User)
            .Include(cart => cart.CartItems)
                .ThenInclude(item => item.Book)
            .Include(cart => cart.CartItems)
                .ThenInclude(item => item.Toy)
            .Include(cart => cart.CartItems)
                .ThenInclude(item => item.Stationery)
            .Include(cart => cart.CartItems)
                .ThenInclude(item => item.SchoolSupply)
            .Include(cart => cart.CartItems)
                .ThenInclude(item => item.Accessory)
            .Include(cart => cart.CartItems)
                .ThenInclude(item => item.Souvenir)
            .FirstOrDefaultAsync(cart => cart.Id == id);
    }

    public async Task<Cart> CreateAsync(Cart cart)
    {
        _context.Carts.Add(cart);

        await _context.SaveChangesAsync();

        return cart;
    }

    public async Task UpdateAsync(Cart cart)
    {
        _context.Carts.Update(cart);

        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(Cart cart)
    {
        _context.Carts.Remove(cart);

        await _context.SaveChangesAsync();
    }
}