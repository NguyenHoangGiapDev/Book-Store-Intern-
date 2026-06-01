using System.ComponentModel.DataAnnotations;

namespace BookStore.Api.DTOs.Users;

public class CreateUserDto
{
    [Required]
    [MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(150)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string? Password { get; set; } 

    [MaxLength(20)]
    public string? PhoneNumber { get; set; }

    [MaxLength(255)]
    public string? Address { get; set; }

    [Required]
    public int RoleId { get; set; }
    public bool IsActive { get; set; } = true;
}