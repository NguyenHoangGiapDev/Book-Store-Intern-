using System.ComponentModel.DataAnnotations;

namespace BookStore.Api.DTOs.Carts;

public class UpdateCartItemDto
{
    [Range(1, int.MaxValue)]
    public int Quantity { get; set; }
}