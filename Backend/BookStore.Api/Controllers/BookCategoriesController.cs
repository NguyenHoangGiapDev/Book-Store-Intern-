using BookStore.Api.Data;
using BookStore.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookStore.Api.Controllers;

[ApiController]
[Route("api/book-categories")]
public class BookCategoriesController : ControllerBase
{
    private readonly AppDbContext _context;

    public BookCategoriesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var categories = await _context.BookCategories
            .OrderBy(x => x.Id)
            .Select(x => new
            {
                id = x.Id,
                name = x.Name,
                description = x.Description,
                type = "sach"
            })
            .ToListAsync();

        return Ok(categories);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var category = await _context.BookCategories.FindAsync(id);

        if (category == null)
        {
            return NotFound();
        }

        return Ok(new
        {
            id = category.Id,
            name = category.Name,
            description = category.Description,
            type = "sach"
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create(BookCategory request)
    {
        var category = new BookCategory
        {
            Name = request.Name?.Trim() ?? string.Empty,
            Description = request.Description?.Trim(),
            Type = "sach",
        };

        _context.BookCategories.Add(category);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            id = category.Id,
            name = category.Name,
            description = category.Description,
            type = "sach"
        });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, BookCategory request)
    {
        var category = await _context.BookCategories.FindAsync(id);

        if (category == null)
        {
            return NotFound();
        }

        category.Name = request.Name?.Trim() ?? string.Empty;
        category.Description = request.Description?.Trim();
        category.Type = "sach";
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var category = await _context.BookCategories.FindAsync(id);

        if (category == null)
        {
            return NotFound();
        }

        _context.BookCategories.Remove(category);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}