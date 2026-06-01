using BookStore.Api.Data;
using BookStore.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BookStore.Api.Repositories;

public class StationeryRepository : IStationeryRepository
{
    private readonly AppDbContext _context;

    public StationeryRepository(AppDbContext context)
    {
        _context = context;
    }
   public async Task<List<Stationery>> GetAllAsync()
    {
        var count = await _context.Stationeries.CountAsync();
        Console.WriteLine($"Stationeries count from backend database: {count}");

        var items = await _context.Stationeries
            .Include(s => s.Category)
            .AsNoTracking()
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();

        Console.WriteLine($"Stationeries returned from repository: {items.Count}");

        return items;
    }

    public async Task<Stationery?> GetByIdAsync(int id)
    {
        return await _context.Stationeries
            .Include(s => s.Category)
            .FirstOrDefaultAsync(s => s.Id == id);
    }

    public async Task<Stationery> CreateAsync(Stationery stationery)
    {
        _context.Stationeries.Add(stationery);

        await _context.SaveChangesAsync();

        return stationery;
    }

    public async Task UpdateAsync(Stationery stationery)
    {
        _context.Stationeries.Update(stationery);

        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(Stationery stationery)
    {
        _context.Stationeries.Remove(stationery);

        await _context.SaveChangesAsync();
    }

    public async Task<bool> ExistsAsync(int id)
    {
        return await _context.Stationeries.AnyAsync(s => s.Id == id);
    }
}
