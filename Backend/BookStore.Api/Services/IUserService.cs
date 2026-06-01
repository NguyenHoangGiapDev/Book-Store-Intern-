using BookStore.Api.DTOs.Users;

namespace BookStore.Api.Services;

public interface IUserService
{
    Task<List<UserDto>> GetAllAsync();

    Task<UserDto?> GetByIdAsync(int id);

    Task<UserDto> CreateAsync(CreateUserDto request);

    Task<bool> UpdateAsync(int id, UpdateUserDto request);

    Task<bool> DeleteAsync(int id);

    Task<bool> ChangePasswordAsync(int id, ChangePasswordDto request);

    Task<string?> UploadAvatarAsync(int id, IFormFile file);
}