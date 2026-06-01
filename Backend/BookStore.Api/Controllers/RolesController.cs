using BookStore.Api.DTOs.Roles;
using BookStore.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace BookStore.Api.Controllers;

[ApiController]
[Route("api/roles")]
public class RolesController : ControllerBase
{
    private readonly IRoleService _roleService;

    public RolesController(IRoleService roleService)
    {
        _roleService = roleService;
    }

    [HttpGet]
    public async Task<ActionResult<List<RoleDto>>> GetAll()
    {
        var roles = await _roleService.GetAllAsync();

        return Ok(roles);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<RoleDto>> GetById(int id)
    {
        var role = await _roleService.GetByIdAsync(id);

        if (role == null)
        {
            return NotFound($"Role with id {id} was not found.");
        }

        return Ok(role);
    }

    [HttpPost]
    public async Task<ActionResult<RoleDto>> Create(CreateRoleDto request)
    {
        try
        {
            var createdRole = await _roleService.CreateAsync(request);

            return CreatedAtAction(
                nameof(GetById),
                new { id = createdRole.Id },
                createdRole
            );
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(exception.Message);
        }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateRoleDto request)
    {
        var updated = await _roleService.UpdateAsync(id, request);

        if (!updated)
        {
            return NotFound($"Role with id {id} was not found.");
        }

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _roleService.DeleteAsync(id);

        if (!deleted)
        {
            return NotFound($"Role with id {id} was not found.");
        }

        return NoContent();
    }
}