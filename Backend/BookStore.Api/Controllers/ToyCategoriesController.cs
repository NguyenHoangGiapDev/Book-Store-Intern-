
using BookStore.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookStore.Api.Controllers;

[ApiController]
[Route("api/toy-categories")]
public class ToyCategoriesController : ControllerBase
{
    private readonly AppDbContext _context;

    public ToyCategoriesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var categories = await _context.ToyCategories
            .OrderBy(x => x.Id)
            .Select(x => new
            {
                id = x.Id,
                name = x.Name,
                description = x.Description,
                createdAt = x.CreatedAt,
                updatedAt = x.UpdatedAt,
                type = "do-choi"
            })
            .ToListAsync();

        return Ok(categories);
    }
}