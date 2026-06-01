namespace BookStore.Api.Models;

public class ShiftTransaction
{
    public int Id { get; set; }
    public int ShiftId { get; set; }
    public Shift? Shift { get; set; }
    // "Thu" hoặc "Chi"
    public string Type { get; set; } = "Chi";
    public string Reason { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
