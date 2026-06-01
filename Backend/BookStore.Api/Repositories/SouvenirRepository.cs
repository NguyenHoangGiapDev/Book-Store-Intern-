using BookStore.Api.Data;
using BookStore.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BookStore.Api.Repositories;

public class SouvenirRepository : ISouvenirRepository
{
    private readonly AppDbContext _context;

    public SouvenirRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<Souvenir>> GetAllAsync()
    {
        return await _context.Set<Souvenir>()
            .Include(x => x.Category)
            .OrderByDescending(x => x.Id)
            .ToListAsync();
    }

    public async Task<Souvenir?> GetByIdAsync(int id)
    {
        return await _context.Set<Souvenir>()
            .Include(x => x.Category)
            .FirstOrDefaultAsync(x => x.Id == id);
    }

    public async Task<Souvenir> CreateAsync(Souvenir souvenir)
    {
        _context.Set<Souvenir>().Add(souvenir);
        await _context.SaveChangesAsync();
        return souvenir;
    }

    public async Task UpdateAsync(Souvenir souvenir)
    {
        _context.Set<Souvenir>().Update(souvenir);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(Souvenir souvenir)
    {
        _context.Set<Souvenir>().Remove(souvenir);
        await _context.SaveChangesAsync();
    }
}
