using BookStore.Api.Data;
using BookStore.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BookStore.Api.Repositories;

public class UserRepository : IUserRepository
{
    private readonly AppDbContext _context;

    public UserRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<User>> GetAllAsync()
    {
        return await _context.Users
            .Include(user => user.Role)
            .AsNoTracking()
            .OrderBy(user => user.FullName)
            .ToListAsync();
    }

    public async Task<User?> GetByIdAsync(int id)
    {
        return await _context.Users
            .Include(user => user.Role)
            .FirstOrDefaultAsync(user => user.Id == id);
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        return await _context.Users
            .FirstOrDefaultAsync(user => user.Email == email);
    }

    public async Task<User?> GetByIdentifierAsync(string identifier)
    {
        if (string.IsNullOrWhiteSpace(identifier)) return null;

        // Trim but don't call ToLower() on entity properties inside the expression
        // because some CLR string operations aren't translatable to SQL expression trees.
        // Use the Npgsql case-insensitive ILike via EF.Functions.ILike for matching.
        var trimmed = identifier.Trim();

        return await _context.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(user =>
                (user.Email != null && EF.Functions.ILike(user.Email, trimmed)) ||
                (user.PhoneNumber != null && EF.Functions.ILike(user.PhoneNumber, trimmed)) ||
                (user.FullName != null && EF.Functions.ILike(user.FullName, trimmed)) ||
                // match local-part of email (e.g. 'admin' for 'admin@example.com')
                (user.Email != null && EF.Functions.ILike(user.Email, trimmed + "@%")) ||
                // match fullname prefix
                (user.FullName != null && EF.Functions.ILike(user.FullName, trimmed + "%"))
            );
    }

    public async Task<User> CreateAsync(User user)
    {
        _context.Users.Add(user);

        await _context.SaveChangesAsync();

        return user;
    }

    public async Task UpdateAsync(User user)
    {
        _context.Users.Update(user);

        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(User user)
    {
        _context.Users.Remove(user);

        await _context.SaveChangesAsync();
    }

    public async Task<bool> ExistsAsync(int id)
    {
        return await _context.Users.AnyAsync(user => user.Id == id);
    }
}