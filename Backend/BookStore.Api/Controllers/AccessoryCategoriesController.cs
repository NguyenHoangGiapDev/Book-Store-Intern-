using BookStore.Api.Data;
using BookStore.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookStore.Api.Controllers;

[ApiController]
[Route("api/accessory-categories")]
public class AccessoryCategoriesController : ControllerBase
{
    private readonly AppDbContext _context;

    public AccessoryCategoriesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var categories = await _context.AccessoryCategories
            .OrderBy(x => x.Id)
            .Select(x => new
            {
                id = x.Id,
                name = x.Name,
                description = x.Description,
                createdAt = x.CreatedAt,
                updatedAt = x.UpdatedAt,
                type = "phu-kien"
            })
            .ToListAsync();

        return Ok(categories);
    }

    [HttpPost]
    public async Task<IActionResult> Create(AccessoryCategory request)
    {
        var category = new AccessoryCategory
        {
            Name = request.Name?.Trim() ?? string.Empty,
            Description = request.Description?.Trim(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = null
        };

        _context.AccessoryCategories.Add(category);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            id = category.Id,
            name = category.Name,
            description = category.Description,
            createdAt = category.CreatedAt,
            updatedAt = category.UpdatedAt,
            type = "phu-kien"
        });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, AccessoryCategory request)
    {
        var category = await _context.AccessoryCategories.FindAsync(id);

        if (category == null)
        {
            return NotFound();
        }

        category.Name = request.Name?.Trim() ?? string.Empty;
        category.Description = request.Description?.Trim();
        category.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var category = await _context.AccessoryCategories.FindAsync(id);

        if (category == null)
        {
            return NotFound();
        }

        _context.AccessoryCategories.Remove(category);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}