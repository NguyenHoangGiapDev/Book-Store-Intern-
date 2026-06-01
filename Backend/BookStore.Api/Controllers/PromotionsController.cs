using BookStore.Api.Data;
using BookStore.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookStore.Api.Controllers;

[ApiController]
[Route("api/promotions")]
public class PromotionsController : ControllerBase
{
    private readonly AppDbContext _context;

    public PromotionsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var promotions = await _context.Promotions
            .OrderBy(x => x.Id)
            .Select(x => new
            {
                id = x.Id,
                code = x.Code,
                name = x.Name,
                discountPercent = x.DiscountPercent,
                startDate = x.StartDate,
                endDate = x.EndDate,
                description = x.Description,
                isActive = x.IsActive
            })
            .ToListAsync();

        return Ok(promotions);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var promotion = await _context.Promotions.FindAsync(id);

        if (promotion == null)
        {
            return NotFound();
        }

        return Ok(new
        {
            id = promotion.Id,
            code = promotion.Code,
            name = promotion.Name,
            discountPercent = promotion.DiscountPercent,
            startDate = promotion.StartDate,
            endDate = promotion.EndDate,
            description = promotion.Description,
            isActive = promotion.IsActive
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create(Promotion request)
    {
        if (string.IsNullOrWhiteSpace(request.Code))
        {
            return BadRequest(new { message = "Mã khuyến mãi không được để trống." });
        }

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new { message = "Tên chương trình không được để trống." });
        }

        if (request.DiscountPercent <= 0 || request.DiscountPercent > 100)
        {
            return BadRequest(new { message = "Giảm giá phải từ 1 đến 100." });
        }

        if (request.StartDate > request.EndDate)
        {
            return BadRequest(new { message = "Ngày bắt đầu không được lớn hơn ngày kết thúc." });
        }

        var code = request.Code.Trim().ToUpper();

        var codeExists = await _context.Promotions.AnyAsync(x => x.Code == code);
        if (codeExists)
        {
            return BadRequest(new { message = "Mã khuyến mãi đã tồn tại." });
        }

        var promotion = new Promotion
        {
            Code = code,
            Name = request.Name.Trim(),
            DiscountPercent = request.DiscountPercent,
            StartDate = DateTime.SpecifyKind(request.StartDate, DateTimeKind.Utc),
            EndDate = DateTime.SpecifyKind(request.EndDate, DateTimeKind.Utc),
            Description = request.Description?.Trim(),
            IsActive = request.IsActive
        };

        _context.Promotions.Add(promotion);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            id = promotion.Id,
            code = promotion.Code,
            name = promotion.Name,
            discountPercent = promotion.DiscountPercent,
            startDate = promotion.StartDate,
            endDate = promotion.EndDate,
            description = promotion.Description,
            isActive = promotion.IsActive
        });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, Promotion request)
    {
        var promotion = await _context.Promotions.FindAsync(id);

        if (promotion == null)
        {
            return NotFound();
        }

        if (string.IsNullOrWhiteSpace(request.Code))
        {
            return BadRequest(new { message = "Mã khuyến mãi không được để trống." });
        }

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new { message = "Tên chương trình không được để trống." });
        }

        if (request.DiscountPercent <= 0 || request.DiscountPercent > 100)
        {
            return BadRequest(new { message = "Giảm giá phải từ 1 đến 100." });
        }

        if (request.StartDate > request.EndDate)
        {
            return BadRequest(new { message = "Ngày bắt đầu không được lớn hơn ngày kết thúc." });
        }

        var code = request.Code.Trim().ToUpper();

        var codeExists = await _context.Promotions
            .AnyAsync(x => x.Code == code && x.Id != id);

        if (codeExists)
        {
            return BadRequest(new { message = "Mã khuyến mãi đã tồn tại." });
        }

        promotion.Code = code;
        promotion.Name = request.Name.Trim();
        promotion.DiscountPercent = request.DiscountPercent;
        promotion.StartDate = DateTime.SpecifyKind(request.StartDate, DateTimeKind.Utc);
        promotion.EndDate = DateTime.SpecifyKind(request.EndDate, DateTimeKind.Utc);
        promotion.Description = request.Description?.Trim();
        promotion.IsActive = request.IsActive;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var promotion = await _context.Promotions.FindAsync(id);

        if (promotion == null)
        {
            return NotFound();
        }

        _context.Promotions.Remove(promotion);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}