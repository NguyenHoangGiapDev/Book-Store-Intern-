namespace BookStore.Api.Models;

public class Shift
{
    public int Id { get; set; }
    public int StaffId { get; set; }
    public User? Staff { get; set; }
    public DateTime OpenedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ClosedAt { get; set; }
    public decimal OpeningCash { get; set; }
    public bool IsOpen { get; set; } = true;
    public ICollection<ShiftTransaction> Transactions { get; set; } = new List<ShiftTransaction>();
}
