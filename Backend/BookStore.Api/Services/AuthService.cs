using BookStore.Api.DTOs.Auth;
using BookStore.Api.Models;
using BookStore.Api.Repositories;

namespace BookStore.Api.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IRoleRepository _roleRepository;
    private readonly IEmailService _emailService;

    public AuthService(
        IUserRepository userRepository,
        IRoleRepository roleRepository,
        IEmailService emailService)
    {
        _userRepository = userRepository;
        _roleRepository = roleRepository;
        _emailService = emailService;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto request)
    {
        var email = request.Email.Trim().ToLower();

        var existingUser = await _userRepository.GetByEmailAsync(email);

        if (existingUser != null)
        {
            throw new InvalidOperationException("Email already exists.");
        }

        var customerRole = await GetRoleByNameAsync("Customer");

        var user = new User
        {
            FullName = request.FullName.Trim(),
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password.Trim()),
            PhoneNumber = request.PhoneNumber?.Trim(),
            Address = request.Address?.Trim(),
            RoleId = customerRole.Id,
            IsActive = true
        };

        var createdUser = await _userRepository.CreateAsync(user);

        return new AuthResponseDto
        {
            UserId = createdUser.Id,
            FullName = createdUser.FullName,
            Email = createdUser.Email,
            RoleName = customerRole.Name,
            RoleId = createdUser.RoleId
        };
    }

    public async Task<AuthResponseDto> CreateStaffAsync(RegisterDto request)
    {
        var email = request.Email.Trim().ToLower();

        var existingUser = await _userRepository.GetByEmailAsync(email);

        if (existingUser != null)
        {
            throw new InvalidOperationException("Email already exists.");
        }

        var staffRole = await GetRoleByNameAsync("Staff");

        var user = new User
        {
            FullName = request.FullName.Trim(),
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password.Trim()),
            PhoneNumber = request.PhoneNumber?.Trim(),
            Address = request.Address?.Trim(),
            RoleId = staffRole.Id,
            IsActive = true
        };

        var createdUser = await _userRepository.CreateAsync(user);

        return new AuthResponseDto
        {
            UserId = createdUser.Id,
            FullName = createdUser.FullName,
            Email = createdUser.Email ?? string.Empty,
            RoleName = staffRole.Name,
            RoleId = createdUser.RoleId
        };
    }

    public async Task<AuthResponseDto?> LoginAsync(LoginDto request)
    {
        var identifier = request.Email.Trim();

        Console.WriteLine($"[AuthService] LoginAsync called with identifier: '{identifier}'");

        var user = await _userRepository.GetByIdentifierAsync(identifier);

        Console.WriteLine(user == null
            ? "[AuthService] No user found for identifier."
            : $"[AuthService] Found user: Id={user.Id}, Email='{user.Email}', FullName='{user.FullName}', IsActive={user.IsActive}");

        if (user == null)
        {
            return null;
        }

        // Chặn tài khoản đã bị admin khóa (ngoại trừ tài khoản admin)
        bool isAdmin = user.Role?.Name == "Admin" || user.RoleId == 2 || (user.Email != null && user.Email.ToLower().Contains("admin"));
        if (!user.IsActive && !isAdmin)
        {
            Console.WriteLine($"[AuthService] Login blocked because user is inactive: userId={user.Id}, email={user.Email}");

            throw new UnauthorizedAccessException("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.");
        }

        var isPasswordValid = false;
        var isPlainTextPassword = false;

        try
        {
            isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password.Trim(), user.PasswordHash);
        }
        catch
        {
            isPasswordValid = user.PasswordHash == request.Password.Trim();
            isPlainTextPassword = isPasswordValid;
        }

        Console.WriteLine($"[AuthService] isPasswordValid={isPasswordValid}, isPlainTextPassword={isPlainTextPassword}");

        if (!isPasswordValid)
        {
            return null;
        }

        // Nếu mật khẩu trong database đang là plain text thì tự động mã hóa lại bằng BCrypt
        if (isPlainTextPassword)
        {
            try
            {
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password.Trim());
                user.UpdatedAt = DateTime.UtcNow;

                await _userRepository.UpdateAsync(user);

                Console.WriteLine($"[AuthService] Plain text password was re-hashed for userId={user.Id}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AuthService] Failed to re-hash plain text password for userId={user.Id}. Error: {ex.Message}");
            }
        }

        return new AuthResponseDto
        {
            UserId = user.Id,
            FullName = user.FullName,
            Email = user.Email ?? string.Empty,
            RoleName = user.Role?.Name ?? string.Empty,
            RoleId = user.RoleId
        };
    }

    private async Task<Role> GetRoleByNameAsync(string roleName)
    {
        var roles = await _roleRepository.GetAllAsync();

        var role = roles.FirstOrDefault(item =>
            item.Name.Equals(roleName, StringComparison.OrdinalIgnoreCase));

        if (role == null)
        {
            throw new InvalidOperationException($"{roleName} role was not found.");
        }

        return role;
    }

    public async Task ForgotPasswordAsync(ForgotPasswordDto request, string frontendUrl)
    {
        var email = request.Email.Trim().ToLower();
        var user = await _userRepository.GetByEmailAsync(email);

        if (user == null)
        {
            // Do not reveal that the user does not exist
            return;
        }

        var token = Guid.NewGuid().ToString("N");
        user.ResetPasswordToken = token;
        user.ResetPasswordTokenExpiry = DateTime.UtcNow.AddMinutes(30);

        await _userRepository.UpdateAsync(user);

        var resetUrl = $"{frontendUrl}/reset-password?token={token}";

        var emailBody = $@"
            <h2>Khôi phục mật khẩu</h2>
            <p>Bạn đã yêu cầu khôi phục mật khẩu cho tài khoản Book Store.</p>
            <p>Vui lòng click vào link bên dưới để đặt lại mật khẩu mới:</p>
            <p><a href='{resetUrl}' style='padding: 10px 15px; background-color: #0d6efd; color: white; text-decoration: none; border-radius: 5px;'>Đặt lại mật khẩu</a></p>
            <p>Link này sẽ hết hạn sau 30 phút.</p>
            <p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
        ";

        await _emailService.SendEmailAsync(user.Email, "Khôi phục mật khẩu - Book Store", emailBody, true);
    }

    public async Task ResetPasswordAsync(ResetPasswordDto request)
    {
        var users = await _userRepository.GetAllAsync();
        var user = users.FirstOrDefault(u => u.ResetPasswordToken == request.Token);

        if (user == null || user.ResetPasswordTokenExpiry < DateTime.UtcNow)
        {
            throw new InvalidOperationException("Token không hợp lệ hoặc đã hết hạn.");
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword.Trim());
        user.ResetPasswordToken = null;
        user.ResetPasswordTokenExpiry = null;
        user.UpdatedAt = DateTime.UtcNow;

        await _userRepository.UpdateAsync(user);
    }
}