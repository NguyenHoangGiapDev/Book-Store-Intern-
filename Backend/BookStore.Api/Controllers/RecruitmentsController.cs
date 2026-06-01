using BookStore.Api.Data;
using BookStore.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookStore.Api.Controllers;

[ApiController]
[Route("api/recruitments")]
public class RecruitmentsController : ControllerBase
{
    private readonly AppDbContext _context;

    public RecruitmentsController(AppDbContext context)
    {
        _context = context;
    }
    
    [HttpGet("my")]
    public async Task<ActionResult<IEnumerable<RecruitmentApplication>>> GetMyApplications([FromQuery] string email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return BadRequest(new
            {
                message = "Email không hợp lệ."
            });
        }

        var applications = await _context.RecruitmentApplications
            .Where(x => x.Email.ToLower() == email.ToLower())
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

        return Ok(applications);
    }

    [HttpPost]
    public async Task<ActionResult<RecruitmentApplication>> Create(RecruitmentApplication request)
    {
        if (string.IsNullOrWhiteSpace(request.FullName) ||
            string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Phone) ||
            string.IsNullOrWhiteSpace(request.Position) ||
            string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest(new
            {
                message = "Vui lòng nhập đầy đủ thông tin ứng tuyển."
            });
        }

        var application = new RecruitmentApplication
        {
            FullName = request.FullName,
            Email = request.Email,
            Phone = request.Phone,
            Position = request.Position,
            Message = request.Message,
            Status = "pending",
            CreatedAt = DateTime.UtcNow
        };

        _context.RecruitmentApplications.Add(application);
        await _context.SaveChangesAsync();

        return Ok(application);
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<RecruitmentApplication>>> GetAll()
    {
        var applications = await _context.RecruitmentApplications
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

        return Ok(applications);
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, UpdateRecruitmentStatusRequest request)
    {
        var application = await _context.RecruitmentApplications.FindAsync(id);

        if (application == null)
        {
            return NotFound();
        }

        application.Status = request.Status;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var application = await _context.RecruitmentApplications.FindAsync(id);

        if (application == null)
        {
            return NotFound();
        }

        _context.RecruitmentApplications.Remove(application);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}

public class UpdateRecruitmentStatusRequest
{
    public string Status { get; set; } = "pending";
}