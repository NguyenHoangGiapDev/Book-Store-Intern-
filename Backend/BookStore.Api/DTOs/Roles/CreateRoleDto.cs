using System.ComponentModel.DataAnnotations;

namespace BookStore.Api.DTOs.Roles;

public class CreateRoleDto
{
    [Required]
    [MaxLength(50)]
    public string Name { get; set; } = string.Empty;
}