using System.ComponentModel.DataAnnotations;

namespace BookStore.Api.DTOs.Categories;

public class CreateCategoryDto
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [MaxLength(500)]

    [Required]
    public string Type { get; set; } = "sach";
}