using BookStore.Api.Data;
using BookStore.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BookStore.Api.Repositories;

public class AccessoryRepository : IAccessoryRepository
{
    private readonly AppDbContext _context;

    public AccessoryRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<Accessory>> GetAllAsync()
    {
        return await _context.Set<Accessory>()
            .Include(x => x.Category)
            .OrderByDescending(x => x.Id)
            .ToListAsync();
    }

    public async Task<Accessory?> GetByIdAsync(int id)
    {
        return await _context.Set<Accessory>()
            .Include(x => x.Category)
            .FirstOrDefaultAsync(x => x.Id == id);
    }

    public async Task<Accessory> CreateAsync(Accessory accessory)
    {
        _context.Set<Accessory>().Add(accessory);
        await _context.SaveChangesAsync();
        return accessory;
    }

    public async Task UpdateAsync(Accessory accessory)
    {
        _context.Set<Accessory>().Update(accessory);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(Accessory accessory)
    {
        _context.Set<Accessory>().Remove(accessory);
        await _context.SaveChangesAsync();
    }
}
