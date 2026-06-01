namespace BookStore.Api.Models;

public class DeliveryCategory
{
    public int Id { get; set; }

    public int? OrderId { get; set; }

    public string ReceiverName { get; set; } = string.Empty;

    public string? ReceiverPhone { get; set; }

    public string DeliveryAddress { get; set; } = string.Empty;

    public string DeliveryStatus { get; set; } = "pending_handover";

    public DateTime? ShippedAt { get; set; }

    public DateTime? DeliveredAt { get; set; }

    public string? ShippingProvider { get; set; }

    public decimal? CustomTotalAmount { get; set; }
    public Order? Order { get; set; }
}