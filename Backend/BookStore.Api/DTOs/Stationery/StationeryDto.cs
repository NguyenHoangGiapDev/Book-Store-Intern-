namespace BookStore.Api.DTOs.Stationery;

public class StationeryDto
{
    public int Id { get; set; }

    public string? Title { get; set; }

    public string? Brand { get; set; }

    public string? Description { get; set; }

    public decimal Price { get; set; }

    public int StockQuantity { get; set; }

    public string? ImageUrl { get; set; }

    public int CategoryId { get; set; }

    public string? CategoryName { get; set; }
}
