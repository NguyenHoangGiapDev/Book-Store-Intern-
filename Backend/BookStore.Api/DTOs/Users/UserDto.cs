namespace BookStore.Api.DTOs.Users;

public class UserDto
{
    public int Id { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;
    public string? Avatar { get; set; }
    public string? Password { get; set; }
    public string? PhoneNumber { get; set; }

    public string? Address { get; set; }

    public string? Gender { get; set; }

    public DateTime? DateOfBirth { get; set; }

    public string? BankName { get; set; }

    public string? BankAccountName { get; set; }

    public string? BankAccountNumber { get; set; }

    public int RoleId { get; set; }

    public string? RoleName { get; set; }
    public bool IsActive { get; set; } = true;
}