using System.ComponentModel.DataAnnotations;

namespace BookStore.Api.DTOs.Users;

public class UpdateUserDto
{
    [Required]
    [MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(150)]
    public string Email { get; set; } = string.Empty;
    public string? Avatar { get; set; }
    [MaxLength(20)]
    public string? PhoneNumber { get; set; }

    [MaxLength(255)]
    public string? Address { get; set; }

    [MaxLength(20)]
    public string? Gender { get; set; }

    public DateTime? DateOfBirth { get; set; }

    [MaxLength(100)]
    public string? BankName { get; set; }

    [MaxLength(100)]
    public string? BankAccountName { get; set; }

    [MaxLength(50)]
    public string? BankAccountNumber { get; set; }

    [Required]
    public int RoleId { get; set; }
    public bool IsActive { get; set; } = true;
}