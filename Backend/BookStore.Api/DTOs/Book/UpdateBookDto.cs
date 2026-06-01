using System.ComponentModel.DataAnnotations;

namespace BookStore.Api.DTOs.Books;

public class UpdateBookDto
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    public string Author { get; set; } = string.Empty;

    [MaxLength(150)]
    public string? Publisher { get; set; }

    public string? Description { get; set; }

    public string? ImageUrl { get; set; }

    [Range(0.01, double.MaxValue)]
    public decimal Price { get; set; }

    [Range(0, int.MaxValue)]
    public int StockQuantity { get; set; }

    public string Status { get; set; } = "Available";

    [Required]
    public int CategoryId { get; set; }
}