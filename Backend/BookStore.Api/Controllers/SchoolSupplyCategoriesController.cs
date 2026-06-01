using BookStore.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookStore.Api.Controllers;

[ApiController]
[Route("api/school-supply-categories")]
public class SchoolSupplyCategoriesController : ControllerBase
{
    private readonly AppDbContext _context;

    public SchoolSupplyCategoriesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var categories = await _context.SchoolSupplyCategories
            .OrderBy(x => x.Id)
            .Select(x => new
            {
                id = x.Id,
                name = x.Name,
                description = x.Description,
                createdAt = x.CreatedAt,
                updatedAt = x.UpdatedAt,
                type = "do-dung-hoc-tap"
            })
            .ToListAsync();

        return Ok(categories);
    }
}