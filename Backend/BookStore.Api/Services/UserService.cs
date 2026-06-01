using BookStore.Api.DTOs.Users;
using BookStore.Api.Models;
using BookStore.Api.Repositories;

namespace BookStore.Api.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;

    public UserService(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<List<UserDto>> GetAllAsync()
    {
        var users = await _userRepository.GetAllAsync();

        return users.Select(MapToDto).ToList();
    }

    public async Task<UserDto?> GetByIdAsync(int id)
    {
        var user = await _userRepository.GetByIdAsync(id);

        if (user == null)
        {
            return null;
        }

        return MapToDto(user);
    }

    public async Task<UserDto> CreateAsync(CreateUserDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Password))
        {
            throw new InvalidOperationException("Password is required.");
        }
        var existingUser = await _userRepository.GetByEmailAsync(request.Email.Trim());

        if (existingUser != null)
        {
            throw new InvalidOperationException("Email already exists.");
        }

        var user = new User
        {
            FullName = request.FullName.Trim(),
            Email = request.Email.Trim().ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password.Trim()),
            PhoneNumber = request.PhoneNumber?.Trim(),
            Address = request.Address?.Trim(),
            RoleId = request.RoleId,
            IsActive = request.IsActive
        };

        var createdUser = await _userRepository.CreateAsync(user);

        return MapToDto(createdUser);
    }

    public async Task<bool> UpdateAsync(int id, UpdateUserDto request)
    {
        var user = await _userRepository.GetByIdAsync(id);

        if (user == null)
        {
            return false;
        }

        user.FullName = request.FullName.Trim();
        user.Email = request.Email.Trim().ToLower();
        user.Avatar = request.Avatar;
        user.PhoneNumber = request.PhoneNumber?.Trim();
        user.Address = request.Address?.Trim();
        user.Gender = request.Gender?.Trim();
        user.DateOfBirth = request.DateOfBirth.HasValue 
            ? DateTime.SpecifyKind(request.DateOfBirth.Value, DateTimeKind.Utc) 
            : null;
        user.BankName = request.BankName?.Trim();
        user.BankAccountName = request.BankAccountName?.Trim();
        user.BankAccountNumber = request.BankAccountNumber?.Trim();
        user.RoleId = request.RoleId;
        user.IsActive = request.IsActive;
        user.UpdatedAt = DateTime.UtcNow;

        await _userRepository.UpdateAsync(user);

        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var user = await _userRepository.GetByIdAsync(id);

        if (user == null)
        {
            return false;
        }

        await _userRepository.DeleteAsync(user);

        return true;
    }

    public async Task<bool> ChangePasswordAsync(int id, ChangePasswordDto request)
    {
        var user = await _userRepository.GetByIdAsync(id);

        if (user == null)
        {
            return false;
        }

        if (string.IsNullOrWhiteSpace(request.NewPassword))
        {
            throw new InvalidOperationException("New password is required.");
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword.Trim());
        user.UpdatedAt = DateTime.UtcNow;

        await _userRepository.UpdateAsync(user);

        return true;
    }

    public async Task<string?> UploadAvatarAsync(int id, IFormFile file)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null) return null;

        var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "avatars");
        if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

        var uniqueFileName = $"{id}_{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
        var filePath = Path.Combine(uploadsFolder, uniqueFileName);

        using (var fileStream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(fileStream);
        }

        user.Avatar = $"/uploads/avatars/{uniqueFileName}";
        await _userRepository.UpdateAsync(user);

        return user.Avatar;
    }

    private static UserDto MapToDto(User user)
    {
        return new UserDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Avatar = user.Avatar,
            PhoneNumber = user.PhoneNumber,
            Address = user.Address,
            Gender = user.Gender,
            DateOfBirth = user.DateOfBirth,
            BankName = user.BankName,
            BankAccountName = user.BankAccountName,
            BankAccountNumber = user.BankAccountNumber,
            RoleId = user.RoleId,
            RoleName = user.Role?.Name,
            IsActive = user.IsActive
        };
    }
}