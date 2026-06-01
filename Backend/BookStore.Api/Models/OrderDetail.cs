namespace BookStore.Api.Models;

public class OrderDetail
{
    public int Id { get; set; }

    public int OrderId { get; set; }

    public Order? Order { get; set; }

    public int? BookId { get; set; }
    public Book? Book { get; set; }

    public int? ToyId { get; set; }
    public Toy? Toy { get; set; }

    public int? StationeryId { get; set; }
    public Stationery? Stationery { get; set; }

    public int? SchoolSupplyId { get; set; }
    public SchoolSupply? SchoolSupply { get; set; }

    public int? AccessoryId { get; set; }
    public Accessory? Accessory { get; set; }

    public int? SouvenirId { get; set; }
    public Souvenir? Souvenir { get; set; }

    public int Quantity { get; set; }

    public decimal UnitPrice { get; set; }

    public decimal TotalPrice { get; set; }
}