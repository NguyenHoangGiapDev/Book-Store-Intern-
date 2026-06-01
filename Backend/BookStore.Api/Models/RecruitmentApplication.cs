namespace BookStore.Api.Models;

public class RecruitmentApplication
{
    public int Id { get; set; }

    public string FullName { get; set; } = "";
    public string Email { get; set; } = "";
    public string Phone { get; set; } = "";
    public string Position { get; set; } = "";
    public string Message { get; set; } = "";

    public string Status { get; set; } = "pending";

    public DateTime CreatedAt { get; set; }
}