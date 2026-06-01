namespace BookStore.Api.Models;
public class Cart // Lớp Cart đại diện cho giỏ hàng của người dùng, chứa thông tin về người dùng và các mặt hàng trong giỏ hàng
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public User? User { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<CartItem> CartItems { get; set; } = new List<CartItem>();
}