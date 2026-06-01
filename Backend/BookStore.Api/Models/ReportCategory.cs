using System.ComponentModel.DataAnnotations.Schema;

namespace BookStore.Api.Models;

[Table("ReportCategories")]
public class ReportCategory
{
    public int Id { get; set; }

    public string ReportCode { get; set; } = string.Empty;

    public string ReportName { get; set; } = string.Empty;

    public string ReportType { get; set; } = string.Empty;

    public string PeriodType { get; set; } = string.Empty;

    public DateTime? DateFrom { get; set; }

    public DateTime? DateTo { get; set; }

    public decimal TotalRevenue { get; set; }

    public int TotalOrders { get; set; }

    public int TotalCustomers { get; set; }

    public int TotalProducts { get; set; }

    public string? FileType { get; set; }

    public string? FileUrl { get; set; }

    public string Status { get; set; } = "created";

    public int? CreatedBy { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}