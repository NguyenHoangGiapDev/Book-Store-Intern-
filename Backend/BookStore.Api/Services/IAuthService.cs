using BookStore.Api.DTOs.Auth;

namespace BookStore.Api.Services;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterDto request);

    Task<AuthResponseDto?> LoginAsync(LoginDto request);
    Task<AuthResponseDto> CreateStaffAsync(RegisterDto request);

    Task ForgotPasswordAsync(ForgotPasswordDto request, string frontendUrl);
    Task ResetPasswordAsync(ResetPasswordDto request);
}