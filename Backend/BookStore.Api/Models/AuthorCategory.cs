namespace BookStore.Api.Models;

public class AuthorCategory
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? Bio { get; set; }

    public string? PenName { get; set; }
    public string? Hometown { get; set; }
    public DateTime? BirthDate { get; set; }
    public string? Nationality { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}