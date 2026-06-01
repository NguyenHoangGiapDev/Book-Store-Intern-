using BookStore.Api.Data;
using BookStore.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookStore.Api.Controllers;

[ApiController]
[Route("api/reports")]
public class ReportsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ReportsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetReports()
    {
        var reports = await _context.ReportCategories
            .AsNoTracking()
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new
            {
                x.Id,
                x.ReportCode,
                x.ReportName,
                x.ReportType,
                x.PeriodType,
                x.DateFrom,
                x.DateTo,
                x.TotalRevenue,
                x.TotalOrders,
                x.TotalCustomers,
                x.TotalProducts,
                x.FileType,
                x.FileUrl,
                x.Status,
                x.CreatedBy,
                x.CreatedAt
            })
            .ToListAsync();

        return Ok(reports);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetReportById(int id)
    {
        var report = await _context.ReportCategories
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id);

        if (report == null)
        {
            return NotFound(new { message = "Không tìm thấy báo cáo" });
        }

        return Ok(report);
    }

    [HttpPost]
    public async Task<IActionResult> CreateReport([FromBody] CreateReportRequest request)
    {
        try
        {
            if (request == null)
            {
                return BadRequest(new { message = "Dữ liệu không hợp lệ" });
            }

            if (string.IsNullOrWhiteSpace(request.ReportName))
            {
                return BadRequest(new { message = "Vui lòng nhập tên báo cáo" });
            }

            var nextNumber = await _context.ReportCategories.CountAsync() + 1;
            var reportCode = $"BC-{nextNumber:000}";

            var report = new ReportCategory
            {
                ReportCode = reportCode,
                ReportName = request.ReportName.Trim(),
                ReportType = string.IsNullOrWhiteSpace(request.ReportType)
                    ? "general"
                    : request.ReportType.Trim(),
                PeriodType = string.IsNullOrWhiteSpace(request.PeriodType)
                    ? "month"
                    : request.PeriodType.Trim(),
                DateFrom = request.DateFrom,
                DateTo = request.DateTo,
                TotalRevenue = request.TotalRevenue,
                TotalOrders = request.TotalOrders,
                TotalCustomers = request.TotalCustomers,
                TotalProducts = request.TotalProducts,
                FileType = request.FileType,
                FileUrl = request.FileUrl,
                Status = string.IsNullOrWhiteSpace(request.Status)
                    ? "created"
                    : request.Status.Trim(),
                CreatedBy = request.CreatedBy,
                CreatedAt = DateTime.UtcNow
            };

            _context.ReportCategories.Add(report);
            await _context.SaveChangesAsync();

            return Ok(report);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "Lỗi server khi tạo báo cáo",
                error = ex.Message,
                innerError = ex.InnerException?.Message
            });
        }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteReport(int id)
    {
        var report = await _context.ReportCategories.FindAsync(id);

        if (report == null)
        {
            return NotFound(new { message = "Không tìm thấy báo cáo" });
        }

        _context.ReportCategories.Remove(report);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Đã xóa báo cáo" });
    }

    public class CreateReportRequest
    {
        public string ReportName { get; set; } = string.Empty;

        public string ReportType { get; set; } = "general";

        public string PeriodType { get; set; } = "month";

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
    }
}