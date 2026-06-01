namespace BookStore.Api.DTOs.Toy;

public class CreateToyDto
{
    public string Title { get; set; } = string.Empty;

    public string Brand { get; set; } = string.Empty;

    public string? Manufacturer { get; set; }

    public string? Description { get; set; }

    public string? ImageUrl { get; set; }

    public decimal Price { get; set; }

    public int StockQuantity { get; set; }

    public string? Status { get; set; }

    public int CategoryId { get; set; }
}