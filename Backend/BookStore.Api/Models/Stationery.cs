namespace BookStore.Api.Models;

public class Stationery
{
    public int Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Brand { get; set; } = string.Empty;
    public string? Type { get; set; }

    public string? Manufacturer { get; set; }

    public string? Description { get; set; }

    public string? ImageUrl { get; set; }

    public decimal Price { get; set; }

    public int StockQuantity { get; set; }

    public int CategoryId { get; set; }

    public string Status { get; set; } = "Available";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public StationeryCategory? Category { get; set; }
}