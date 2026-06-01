using BookStore.Api.DTOs.Roles;
using BookStore.Api.Models;
using BookStore.Api.Repositories;

namespace BookStore.Api.Services;

public class RoleService : IRoleService
{
    private readonly IRoleRepository _roleRepository;

    public RoleService(IRoleRepository roleRepository)
    {
        _roleRepository = roleRepository;
    }

    public async Task<List<RoleDto>> GetAllAsync()
    {
        var roles = await _roleRepository.GetAllAsync();

        return roles.Select(MapToDto).ToList();
    }

    public async Task<RoleDto?> GetByIdAsync(int id)
    {
        var role = await _roleRepository.GetByIdAsync(id);

        if (role == null)
        {
            return null;
        }

        return MapToDto(role);
    }

    public async Task<RoleDto> CreateAsync(CreateRoleDto request)
    {
        var roleName = request.Name.Trim();

        var nameExists = await _roleRepository.NameExistsAsync(roleName);

        if (nameExists)
        {
            throw new InvalidOperationException("Role name already exists.");
        }

        var role = new Role
        {
            Name = roleName
        };

        var createdRole = await _roleRepository.CreateAsync(role);

        return MapToDto(createdRole);
    }

    public async Task<bool> UpdateAsync(int id, UpdateRoleDto request)
    {
        var role = await _roleRepository.GetByIdAsync(id);

        if (role == null)
        {
            return false;
        }

        role.Name = request.Name.Trim();

        await _roleRepository.UpdateAsync(role);

        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var role = await _roleRepository.GetByIdAsync(id);

        if (role == null)
        {
            return false;
        }

        await _roleRepository.DeleteAsync(role);

        return true;
    }

    private static RoleDto MapToDto(Role role)
    {
        return new RoleDto
        {
            Id = role.Id,
            Name = role.Name
        };
    }
}