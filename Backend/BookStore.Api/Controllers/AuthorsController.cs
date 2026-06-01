using BookStore.Api.Data;
using BookStore.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookStore.Api.Controllers;

[ApiController]
[Route("api/authors")]
public class AuthorsController : ControllerBase
{
    private readonly AppDbContext _context;

    public AuthorsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            var authors = await _context.AuthorCategories
                .OrderBy(x => x.Id)
                .Select(x => new
                {
                    id = x.Id,
                    name = x.Name,
                    bio = x.Bio,
                    penName = x.PenName,
                    hometown = x.Hometown,
                    birthDate = x.BirthDate,
                    nationality = x.Nationality,
                    createdAt = x.CreatedAt,
                    updatedAt = x.UpdatedAt
                })
                .ToListAsync();

            return Ok(authors);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "Lỗi khi tải danh sách tác giả.",
                error = ex.Message,
                innerError = ex.InnerException?.Message
            });
        }
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        try
        {
            var author = await _context.AuthorCategories
                .Where(x => x.Id == id)
                .Select(x => new
                {
                    id = x.Id,
                    name = x.Name,
                    bio = x.Bio,
                    penName = x.PenName,
                    hometown = x.Hometown,
                    birthDate = x.BirthDate,
                    nationality = x.Nationality,
                    createdAt = x.CreatedAt,
                    updatedAt = x.UpdatedAt
                })
                .FirstOrDefaultAsync();

            if (author == null)
            {
                return NotFound(new
                {
                    message = $"Author with id {id} was not found."
                });
            }

            return Ok(author);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "Lỗi khi tải chi tiết tác giả.",
                error = ex.Message,
                innerError = ex.InnerException?.Message
            });
        }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AuthorCategory request)
    {
        try
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest(new
                {
                    message = "Tên tác giả không được để trống."
                });
            }

            var author = new AuthorCategory
            {
                Name = request.Name.Trim(),
                Bio = request.Bio?.Trim(),
                PenName = request.PenName?.Trim(),
                Hometown = request.Hometown?.Trim(),
                BirthDate = request.BirthDate,
                Nationality = request.Nationality?.Trim(),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.AuthorCategories.Add(author);
            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetById),
                new { id = author.Id },
                new
                {
                    id = author.Id,
                    name = author.Name,
                    bio = author.Bio,
                    penName = author.PenName,
                    hometown = author.Hometown,
                    birthDate = author.BirthDate,
                    nationality = author.Nationality,
                    createdAt = author.CreatedAt,
                    updatedAt = author.UpdatedAt
                }
            );
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "Lỗi khi thêm tác giả.",
                error = ex.Message,
                innerError = ex.InnerException?.Message
            });
        }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] AuthorCategory request)
    {
        try
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest(new
                {
                    message = "Tên tác giả không được để trống."
                });
            }

            var author = await _context.AuthorCategories.FindAsync(id);

            if (author == null)
            {
                return NotFound(new
                {
                    message = $"Author with id {id} was not found."
                });
            }

            author.Name = request.Name.Trim();
            author.Bio = request.Bio?.Trim();
            author.PenName = request.PenName?.Trim();
            author.Hometown = request.Hometown?.Trim();
            author.BirthDate = request.BirthDate;
            author.Nationality = request.Nationality?.Trim();
            author.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Cập nhật tác giả thành công."
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "Lỗi khi cập nhật tác giả.",
                error = ex.Message,
                innerError = ex.InnerException?.Message
            });
        }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            var author = await _context.AuthorCategories.FindAsync(id);

            if (author == null)
            {
                return NotFound(new
                {
                    message = $"Author with id {id} was not found."
                });
            }

            _context.AuthorCategories.Remove(author);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Xóa tác giả thành công."
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "Lỗi khi xóa tác giả.",
                error = ex.Message,
                innerError = ex.InnerException?.Message
            });
        }
    }
}