namespace BookStore.Api.DTOs.Orders;

public class OrderDto
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public string? StaffName { get; set; }
    public string? CustomerName { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }

    public DateTime OrderDate { get; set; }

    public decimal TotalAmount { get; set; }

    public string Status { get; set; } = string.Empty;

    public string OrderType { get; set; } = string.Empty;

    public List<OrderDetailDto> OrderDetails { get; set; } = new();
    public string? ShippingStatus { get; set; }
    public string? PaymentStatus { get; set; }
    public string? CodStatus { get; set; }
    public string? Issue { get; set; }
}