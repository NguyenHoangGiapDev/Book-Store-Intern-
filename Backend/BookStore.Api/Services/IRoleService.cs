using BookStore.Api.DTOs.Roles;

namespace BookStore.Api.Services;

public interface IRoleService
{
    Task<List<RoleDto>> GetAllAsync();

    Task<RoleDto?> GetByIdAsync(int id);

    Task<RoleDto> CreateAsync(CreateRoleDto request);

    Task<bool> UpdateAsync(int id, UpdateRoleDto request);

    Task<bool> DeleteAsync(int id);
}