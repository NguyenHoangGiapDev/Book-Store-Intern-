using BookStore.Api.Models;

namespace BookStore.Api.Repositories;

public interface IUserRepository
{
    Task<List<User>> GetAllAsync();

    Task<User?> GetByIdAsync(int id);

    Task<User?> GetByEmailAsync(string email);
    
    // Find a user by an identifier which may be email, phone number or username/full name
    Task<User?> GetByIdentifierAsync(string identifier);

    Task<User> CreateAsync(User user);

    Task UpdateAsync(User user);

    Task DeleteAsync(User user);

    Task<bool> ExistsAsync(int id);
}