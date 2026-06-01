namespace BookStore.Api.Models;

public class User
{
    public int Id { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;
    public string? Avatar { get; set; }
    public string? PhoneNumber { get; set; }

    public string? ResetPasswordToken { get; set; }
    public DateTime? ResetPasswordTokenExpiry { get; set; }

    public string? Address { get; set; }

    public string? Gender { get; set; }

    public DateTime? DateOfBirth { get; set; }

    public string? BankName { get; set; }

    public string? BankAccountName { get; set; }

    public string? BankAccountNumber { get; set; }

    public int RoleId { get; set; }

    public Role? Role { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<Order> Orders { get; set; } = new List<Order>();

    public Cart? Cart { get; set; }
    public string? AvatarUrl { get; set; }
}