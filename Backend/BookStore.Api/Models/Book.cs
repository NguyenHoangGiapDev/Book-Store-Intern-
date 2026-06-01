namespace BookStore.Api.Models;

public class Book // Lớp Book đại diện cho một cuốn sách trong cửa hàng, chứa thông tin chi tiết về sách và mối quan hệ với các thực thể khác như Category và OrderDetail
{
    public int Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Author { get; set; } = string.Empty;

    public string? Publisher { get; set; }

    public string? Description { get; set; }

    public string? ImageUrl { get; set; }

    public decimal Price { get; set; }

    public int StockQuantity { get; set; }

    public string Status { get; set; } = "Available";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public int CategoryId { get; set; }

    public Category? Category { get; set; }
    public ICollection<OrderDetail> OrderDetails { get; set; } = new List<OrderDetail>(); // Quan hệ một-nhiều với OrderDetail
    public ICollection<CartItem> CartItems { get; set; } = new List<CartItem>(); // Quan hệ một-nhiều với CartItem
}