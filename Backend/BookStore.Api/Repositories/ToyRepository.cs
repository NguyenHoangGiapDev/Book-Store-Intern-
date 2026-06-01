using BookStore.Api.Data;
using BookStore.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BookStore.Api.Repositories;

public class ToyRepository : IToyRepository
{
    private readonly AppDbContext _context;

    public ToyRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<Toy>> GetAllAsync()
    {
        return await _context.Toys
            .Include(x => x.Category)
            .OrderByDescending(x => x.Id)
            .ToListAsync();
    }

    public async Task<Toy?> GetByIdAsync(int id)
    {
        return await _context.Toys
            .Include(x => x.Category)
            .FirstOrDefaultAsync(x => x.Id == id);
    }

    public async Task<Toy> CreateAsync(Toy toy)
    {
        _context.Toys.Add(toy);
        await _context.SaveChangesAsync();

        return await _context.Toys
            .Include(x => x.Category)
            .FirstAsync(x => x.Id == toy.Id);
    }

    public async Task UpdateAsync(Toy toy)
    {
        /*
         * KHÔNG dùng:
         * _context.Toys.Update(toy);
         *
         * Vì toy đã được EF tracking từ GetByIdAsync().
         * Chỉ cần SaveChangesAsync() là đủ.
         */
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(Toy toy)
    {
        _context.Toys.Remove(toy);
        await _context.SaveChangesAsync();
    }
}