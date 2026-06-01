using BookStore.Api.Data;
using BookStore.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BookStore.Api.Repositories;

public class RoleRepository : IRoleRepository
{
    private readonly AppDbContext _context;

    public RoleRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<Role>> GetAllAsync()
    {
        return await _context.Roles
            .AsNoTracking()
            .OrderBy(role => role.Name)
            .ToListAsync();
    }

    public async Task<Role?> GetByIdAsync(int id)
    {
        return await _context.Roles
            .FirstOrDefaultAsync(role => role.Id == id);
    }

    public async Task<Role> CreateAsync(Role role)
    {
        _context.Roles.Add(role);

        await _context.SaveChangesAsync();

        return role;
    }

    public async Task UpdateAsync(Role role)
    {
        _context.Roles.Update(role);

        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(Role role)
    {
        _context.Roles.Remove(role);

        await _context.SaveChangesAsync();
    }

    public async Task<bool> ExistsAsync(int id)
    {
        return await _context.Roles
            .AnyAsync(role => role.Id == id);
    }

    public async Task<bool> NameExistsAsync(string name)
    {
        var normalizedName = name.Trim().ToLower();

        return await _context.Roles
            .AnyAsync(role => role.Name.ToLower() == normalizedName);
    }
}