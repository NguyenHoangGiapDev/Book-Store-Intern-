using BookStore.Api.Models;

namespace BookStore.Api.Repositories;

public interface IRoleRepository
{
    Task<List<Role>> GetAllAsync();

    Task<Role?> GetByIdAsync(int id);

    Task<Role> CreateAsync(Role role);

    Task UpdateAsync(Role role);

    Task DeleteAsync(Role role);

    Task<bool> ExistsAsync(int id);

    Task<bool> NameExistsAsync(string name);
}