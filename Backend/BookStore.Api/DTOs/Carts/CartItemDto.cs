namespace BookStore.Api.DTOs.Carts;

public class CartItemDto
{
    public int Id { get; set; }

    public int? BookId { get; set; }
    public int? ToyId { get; set; }
    public int? StationeryId { get; set; }
    public int? SchoolSupplyId { get; set; }
    public int? AccessoryId { get; set; }
    public int? SouvenirId { get; set; }

    public string? ProductTitle { get; set; }
    public string? ProductImageUrl { get; set; }

    public int Quantity { get; set; }

    public decimal UnitPrice { get; set; }

    public decimal TotalPrice { get; set; }
}