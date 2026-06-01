using System.ComponentModel.DataAnnotations;

namespace BookStore.Api.DTOs.Orders;

public class CreateOrderDto
{
    [Required]
    public int UserId { get; set; }

    public string OrderType { get; set; } = "Online";
    
    public string? CustomerName { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }

    [Required]
    [MinLength(1)]
    public List<CreateOrderItemDto> Items { get; set; } = new();
}