using System.ComponentModel.DataAnnotations;

namespace BookStore.Api.DTOs.Orders;

public class UpdateOrderStatusDto
{
    [Required]
    public string Status { get; set; } = string.Empty;
}