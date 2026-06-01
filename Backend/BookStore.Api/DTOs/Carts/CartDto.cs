namespace BookStore.Api.DTOs.Carts;

public class CartDto
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public string? CustomerName { get; set; }

    public DateTime CreatedAt { get; set; }

    public List<CartItemDto> Items { get; set; } = new();

    public decimal TotalAmount { get; set; }
}