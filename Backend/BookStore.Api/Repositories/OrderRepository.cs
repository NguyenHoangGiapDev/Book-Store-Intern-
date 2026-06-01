using BookStore.Api.Data;
using BookStore.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BookStore.Api.Repositories;

public class OrderRepository : IOrderRepository
{
    private readonly AppDbContext _context;

    public OrderRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<Order>> GetAllAsync()
    {
        return await _context.Orders
            .Include(order => order.User)
            .Include(order => order.OrderDetails).ThenInclude(d => d.Book)
            .Include(order => order.OrderDetails).ThenInclude(d => d.Toy)
            .Include(order => order.OrderDetails).ThenInclude(d => d.Stationery)
            .Include(order => order.OrderDetails).ThenInclude(d => d.SchoolSupply)
            .Include(order => order.OrderDetails).ThenInclude(d => d.Accessory)
            .Include(order => order.OrderDetails).ThenInclude(d => d.Souvenir)
            .OrderByDescending(order => order.OrderDate)
            .ToListAsync();
    }

    public async Task<Order?> GetByIdAsync(int id)
    {
        return await _context.Orders
            .Include(order => order.User)
            .Include(order => order.OrderDetails).ThenInclude(d => d.Book)
            .Include(order => order.OrderDetails).ThenInclude(d => d.Toy)
            .Include(order => order.OrderDetails).ThenInclude(d => d.Stationery)
            .Include(order => order.OrderDetails).ThenInclude(d => d.SchoolSupply)
            .Include(order => order.OrderDetails).ThenInclude(d => d.Accessory)
            .Include(order => order.OrderDetails).ThenInclude(d => d.Souvenir)
            .Include(order => order.Payment)
            .FirstOrDefaultAsync(order => order.Id == id);
    }

    public async Task<List<Order>> GetByUserIdAsync(int userId)
    {
        return await _context.Orders
            .Where(order => order.UserId == userId)
            .Include(order => order.OrderDetails).ThenInclude(d => d.Book)
            .Include(order => order.OrderDetails).ThenInclude(d => d.Toy)
            .Include(order => order.OrderDetails).ThenInclude(d => d.Stationery)
            .Include(order => order.OrderDetails).ThenInclude(d => d.SchoolSupply)
            .Include(order => order.OrderDetails).ThenInclude(d => d.Accessory)
            .Include(order => order.OrderDetails).ThenInclude(d => d.Souvenir)
            .OrderByDescending(order => order.OrderDate)
            .ToListAsync();
    }

    public async Task<Order> CreateAsync(Order order)
    {
        _context.Orders.Add(order);
        await _context.SaveChangesAsync();
        return order;
    }

    public async Task UpdateAsync(Order order)
    {
        _context.Orders.Update(order);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(Order order)
    {
        _context.Orders.Remove(order);
        await _context.SaveChangesAsync();
    }

    public async Task<bool> ExistsAsync(int id)
    {
        return await _context.Orders.AnyAsync(order => order.Id == id);
    }
}