using System.ComponentModel.DataAnnotations;

namespace BookStore.Api.DTOs.Orders;

public class CreateOrderItemDto
{
    public int? BookId { get; set; }
    public int? ToyId { get; set; }
    public int? StationeryId { get; set; }
    public int? SchoolSupplyId { get; set; }
    public int? AccessoryId { get; set; }
    public int? SouvenirId { get; set; }

    [Range(1, int.MaxValue)]
    public int Quantity { get; set; }
}