using BookStore.Api.Data;
using BookStore.Api.DTOs.Auth;
using BookStore.Api.Models;
using BookStore.Api.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;

namespace BookStore.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthController(
        IAuthService authService,
        AppDbContext context,
        IConfiguration configuration)
    {
        _authService = authService;
        _context = context;
        _configuration = configuration;
    }

    [HttpGet("google")]
    public IActionResult GoogleLogin()
    {
        var properties = new AuthenticationProperties
        {
            RedirectUri = Url.Action(nameof(GoogleCallback))
        };

        return Challenge(properties, GoogleDefaults.AuthenticationScheme);
    }

    [HttpGet("google-callback")]
    public async Task<IActionResult> GoogleCallback()
    {
        var result = await HttpContext.AuthenticateAsync(
            CookieAuthenticationDefaults.AuthenticationScheme
        );

        if (!result.Succeeded || result.Principal == null)
        {
            return Redirect($"{GetFrontendUrl()}/login");
        }

        var email = result.Principal.FindFirst(ClaimTypes.Email)?.Value;
        var fullName = result.Principal.FindFirst(ClaimTypes.Name)?.Value;

        if (string.IsNullOrWhiteSpace(email))
        {
            return Redirect($"{GetFrontendUrl()}/login");
        }

        email = email.Trim().ToLower();

        var roleId = 1;
        var roleName = "Customer";

        if (email.Equals("staff@gmail.com", StringComparison.OrdinalIgnoreCase))
        {
            roleId = 3;
            roleName = "Staff";
        }
        else if (email.Equals("admin@gmail.com", StringComparison.OrdinalIgnoreCase))
        {
            roleId = 2;
            roleName = "Admin";
        }

        var dbUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == email);

        if (dbUser == null)
        {
            dbUser = new User
            {
                FullName = string.IsNullOrWhiteSpace(fullName) ? email : fullName.Trim(),
                Email = email,
                PasswordHash = "GOOGLE_LOGIN",
                PhoneNumber = "",
                RoleId = roleId,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(dbUser);
            await _context.SaveChangesAsync();
        }
        else
        {
            // Chặn tài khoản đã bị admin khóa (ngoại trừ tài khoản admin)
            bool isAdmin = roleName == "Admin" || roleId == 2 || email.Contains("admin");
            if (!dbUser.IsActive && !isAdmin)
            {
                return Redirect($"{GetFrontendUrl()}/login?error=account_locked");
            }

            if (string.IsNullOrWhiteSpace(dbUser.FullName))
            {
                dbUser.FullName = string.IsNullOrWhiteSpace(fullName) ? email : fullName.Trim();
            }

            dbUser.RoleId = roleId;
            dbUser.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        var userJson = JsonSerializer.Serialize(new
        {
            id = dbUser.Id,
            userId = dbUser.Id,
            fullName = dbUser.FullName,
            email = dbUser.Email,
            phoneNumber = dbUser.PhoneNumber,
            roleId = dbUser.RoleId,
            roleName = roleName
        });

        var redirectUrl =
            $"{GetFrontendUrl()}/auth/google-success?user={Uri.EscapeDataString(userJson)}";

        return Redirect(redirectUrl);
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register(RegisterDto request)
    {
        try
        {
            var result = await _authService.RegisterAsync(request);
            return Ok(result);
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new
            {
                message = exception.Message
            });
        }
    }

    [HttpPost("create-staff")]
    public async Task<ActionResult<AuthResponseDto>> CreateStaff(RegisterDto request)
    {
        try
        {
            var result = await _authService.CreateStaffAsync(request);
            return Ok(result);
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new
            {
                message = exception.Message
            });
        }
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login(LoginDto request)
    {
        try
        {
            Console.WriteLine($"[AuthController] Login attempt for identifier: '{request.Email}'");

            var result = await _authService.LoginAsync(request);

            if (result == null)
            {
                Console.WriteLine($"[AuthController] Login failed for identifier: '{request.Email}'");

                return Unauthorized(new
                {
                    message = "Email hoặc mật khẩu không đúng."
                });
            }

            Console.WriteLine($"[AuthController] Login succeeded for userId: {result.UserId}");

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, result.UserId.ToString()),
                new Claim(ClaimTypes.Name, result.FullName),
                new Claim(ClaimTypes.Email, result.Email),
                new Claim(ClaimTypes.Role, result.RoleName)
            };

            var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
            var principal = new ClaimsPrincipal(identity);

            await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, principal);

            return Ok(result);
        }
        catch (UnauthorizedAccessException exception)
        {
            Console.WriteLine($"[AuthController] Login blocked: {exception.Message}");

            return Unauthorized(new
            {
                message = exception.Message
            });
        }
        catch (Exception exception)
        {
            Console.WriteLine($"[AuthController] Login error: {exception.Message}");

            return BadRequest(new
            {
                message = "Đăng nhập thất bại. Vui lòng thử lại."
            });
        }
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);

        return Ok(new
        {
            message = "Đăng xuất thành công"
        });
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(ForgotPasswordDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest(new { message = "Email không được để trống." });
        }

        var frontendUrl = GetFrontendUrl();
        
        try
        {
            await _authService.ForgotPasswordAsync(request, frontendUrl);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = $"Không thể gửi email: Vui lòng kiểm tra lại cấu hình SMTP/Mật khẩu ứng dụng. Chi tiết lỗi: {ex.Message}" });
        }

        return Ok(new { message = "Nếu email hợp lệ, link khôi phục mật khẩu sẽ được gửi đến hòm thư của bạn." });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(ResetPasswordDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Token) || string.IsNullOrWhiteSpace(request.NewPassword))
        {
            return BadRequest(new { message = "Token và mật khẩu mới không được để trống." });
        }

        try
        {
            await _authService.ResetPasswordAsync(request);
            return Ok(new { message = "Đặt lại mật khẩu thành công." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    private string GetFrontendUrl()
    {
        return _configuration["FrontendUrl"] ?? "http://localhost:5173";
    }
}