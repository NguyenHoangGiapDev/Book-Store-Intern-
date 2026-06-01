using System.ComponentModel.DataAnnotations;

namespace BookStore.Api.DTOs.Stationery;

public class CreateStationeryDto
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    public string Brand { get; set; } = string.Empty;
    public string? Type { get; set; }

    [MaxLength(150)]
    public string? Manufacturer { get; set; }

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
