namespace BookStore.Api.Models;

public class BookCategory
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public string Type { get; set; } = "sach";
}