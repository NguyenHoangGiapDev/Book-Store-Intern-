using BookStore.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookStore.Api.Controllers;

[ApiController]
[Route("api/stationery-categories")]
public class StationeryCategoriesController : ControllerBase
{
    private readonly AppDbContext _context;

    public StationeryCategoriesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var categories = await _context.StationeryCategories
            .OrderBy(x => x.Id)
            .Select(x => new
            {
                id = x.Id,
                name = x.Name,
                description = x.Description,
                createdAt = x.CreatedAt,
                updatedAt = x.UpdatedAt,
                type = "van-phong-pham"
            })
            .ToListAsync();

        return Ok(categories);
    }
}