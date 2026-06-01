using BookStore.Api.DTOs.Users;
using BookStore.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace BookStore.Api.Controllers;

[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet]
    public async Task<ActionResult<List<UserDto>>> GetAll()
    {
        var users = await _userService.GetAllAsync();
        return Ok(users);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<UserDto>> GetById(int id)
    {
        var user = await _userService.GetByIdAsync(id);

        if (user == null)
        {
            return NotFound($"User with id {id} was not found.");
        }

        return Ok(user);
    }

    [HttpPost]
    public async Task<ActionResult<UserDto>> Create([FromBody] CreateUserDto request)
    {
        try
        {
            var createdUser = await _userService.CreateAsync(request);

            return CreatedAtAction(
                nameof(GetById),
                new { id = createdUser.Id },
                createdUser
            );
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(exception.Message);
        }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUserDto request)
    {
        var updated = await _userService.UpdateAsync(id, request);

        if (!updated)
        {
            return NotFound($"User with id {id} was not found.");
        }

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _userService.DeleteAsync(id);

        if (!deleted)
        {
            return NotFound($"User with id {id} was not found.");
        }

        return NoContent();
    }

    [HttpPut("{id:int}/password")]
    public async Task<IActionResult> ChangePassword(int id, [FromBody] ChangePasswordDto request)
    {
        try
        {
            var updated = await _userService.ChangePasswordAsync(id, request);

            if (!updated)
            {
                return NotFound($"User with id {id} was not found.");
            }

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("{id:int}/upload-avatar")]
    public async Task<IActionResult> UploadAvatar(int id, IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded.");

        var imageUrl = await _userService.UploadAvatarAsync(id, file);

        if (imageUrl == null)
            return NotFound($"User with id {id} was not found.");

        return Ok(new { imageUrl });
    }
}
