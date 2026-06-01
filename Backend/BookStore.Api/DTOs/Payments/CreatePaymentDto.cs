using System.ComponentModel.DataAnnotations;

namespace BookStore.Api.DTOs.Payments;

public class CreatePaymentDto
{
    [Required]
    public int OrderId { get; set; }

    [Range(0.01, double.MaxValue)]
    public decimal Amount { get; set; }

    [Required]
    [MaxLength(50)]
    public string PaymentMethod { get; set; } = "Cash";
}