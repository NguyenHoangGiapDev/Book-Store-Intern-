// File: Backend/BookStore.Api/Models/Payment.cs
namespace BookStore.Api.Models; // Lớp Payment đại diện cho thông tin thanh toán của một đơn hàng, chứa thông tin về số tiền, phương thức thanh toán, trạng thái thanh toán và thời gian thanh toán
public class Payment
{
    public int Id { get; set; }

    public int OrderId { get; set; }

    public Order? Order { get; set; }

    public decimal Amount { get; set; }

    public string PaymentMethod { get; set; } = "Cash";

    public string Status { get; set; } = "Unpaid";

    public DateTime? PaidAt { get; set; }
}