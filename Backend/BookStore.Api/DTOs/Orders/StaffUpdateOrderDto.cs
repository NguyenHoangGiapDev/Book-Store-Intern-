namespace BookStore.Api.DTOs.Orders;

public class StaffUpdateOrderDto
{
    public string? CustomerName { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? OrderStatus { get; set; }
    public string? ShippingStatus { get; set; }
    public string? PaymentStatus { get; set; }
    public string? CodStatus { get; set; }
    public string? Issue { get; set; }
}