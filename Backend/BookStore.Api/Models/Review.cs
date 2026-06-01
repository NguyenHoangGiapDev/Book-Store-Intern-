using System.ComponentModel.DataAnnotations.Schema;

namespace BookStore.Api.Models;

[Table("ReviewCategories")]
public class Review
{
    public int Id { get; set; }

    public int CustomerId { get; set; }

    public string? CustomerName { get; set; }

    public int? BookId { get; set; }
    
    public string? ProductTitle { get; set; }

    public int Rating { get; set; }

    public string? Comment { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public string? Status { get; set; } = "pending";

    public User? Customer { get; set; }

    public Book? Book { get; set; }

}