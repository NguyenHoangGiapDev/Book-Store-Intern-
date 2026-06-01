using BookStore.Api.Data;
using BookStore.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BookStore.Api.Repositories;

public class SchoolSupplyRepository : ISchoolSupplyRepository
{
    private readonly AppDbContext _context;

    public SchoolSupplyRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<SchoolSupply>> GetAllAsync()
    {
        return await _context.SchoolSupplies
            .Include(x => x.Category)
            .OrderByDescending(x => x.Id)
            .ToListAsync();
    }

    public async Task<SchoolSupply?> GetByIdAsync(int id)
    {
        return await _context.SchoolSupplies
            .Include(x => x.Category)
            .FirstOrDefaultAsync(x => x.Id == id);
    }

    public async Task<SchoolSupply> CreateAsync(SchoolSupply schoolSupply)
    {
        _context.SchoolSupplies.Add(schoolSupply);
        await _context.SaveChangesAsync();

        return schoolSupply;
    }

    public async Task UpdateAsync(SchoolSupply schoolSupply)
    {
        _context.SchoolSupplies.Update(schoolSupply);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(SchoolSupply schoolSupply)
    {
        _context.SchoolSupplies.Remove(schoolSupply);
        await _context.SaveChangesAsync();
    }
}