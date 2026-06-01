using System.ComponentModel.DataAnnotations;

namespace BookStore.Api.DTOs.Payments;

public class UpdatePaymentStatusDto
{
    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = string.Empty;
}