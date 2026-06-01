namespace BookStore.Api.Models;

public class Order
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public User? User { get; set; }

    public DateTime OrderDate { get; set; } = DateTime.UtcNow;

    public string? CustomerName { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }

    public decimal TotalAmount { get; set; }

    public string Status { get; set; } = "Pending";

    public string OrderType { get; set; } = "Online"; // Có thể là "Online", "Offline", v.v.

    public ICollection<OrderDetail> OrderDetails { get; set; } = new List<OrderDetail>();

    public Payment? Payment { get; set; }
    public string? ShippingStatus { get; set; } = "Chưa giao vận";
    public string? PaymentStatus { get; set; } = "Chưa thanh toán";
    public string? CodStatus { get; set; } = "Không áp dụng";
    public string? Issue { get; set; } = "Không có";
}