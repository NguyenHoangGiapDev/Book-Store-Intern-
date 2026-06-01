namespace BookStore.Api.DTOs.Categories;

public class CategoryDto
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }


    public string Type { get; set; } = "sach";

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
}