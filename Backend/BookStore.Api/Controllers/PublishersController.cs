using BookStore.Api.Data;
using BookStore.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookStore.Api.Controllers;

[ApiController]
[Route("api/publishers")]
public class PublishersController : ControllerBase
{
    private readonly AppDbContext _context;

    public PublishersController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            var publishers = await _context.PublisherCategories
                .OrderBy(x => x.Id)
                .Select(x => new
                {
                    id = x.Id,
                    name = x.Name,
                    address = x.Address,
                    phone = x.Phone,
                    email = x.Email,
                    createdAt = x.CreatedAt,
                    updatedAt = x.UpdatedAt
                })
                .ToListAsync();

            return Ok(publishers);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "Lỗi khi tải danh sách nhà xuất bản.",
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
            var publisher = await _context.PublisherCategories
                .Where(x => x.Id == id)
                .Select(x => new
                {
                    id = x.Id,
                    name = x.Name,
                    address = x.Address,
                    phone = x.Phone,
                    email = x.Email,
                    createdAt = x.CreatedAt,
                    updatedAt = x.UpdatedAt
                })
                .FirstOrDefaultAsync();

            if (publisher == null)
            {
                return NotFound(new
                {
                    message = $"Publisher with id {id} was not found."
                });
            }

            return Ok(publisher);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "Lỗi khi tải chi tiết nhà xuất bản.",
                error = ex.Message,
                innerError = ex.InnerException?.Message
            });
        }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] PublisherCategory request)
    {
        try
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest(new
                {
                    message = "Tên nhà xuất bản không được để trống."
                });
            }

            var publisher = new PublisherCategory
            {
                Name = request.Name.Trim(),
                Address = request.Address?.Trim(),
                Phone = request.Phone?.Trim(),
                Email = request.Email?.Trim(),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.PublisherCategories.Add(publisher);
            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetById),
                new { id = publisher.Id },
                new
                {
                    id = publisher.Id,
                    name = publisher.Name,
                    address = publisher.Address,
                    phone = publisher.Phone,
                    email = publisher.Email,
                    createdAt = publisher.CreatedAt,
                    updatedAt = publisher.UpdatedAt
                }
            );
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "Lỗi khi thêm nhà xuất bản.",
                error = ex.Message,
                innerError = ex.InnerException?.Message
            });
        }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] PublisherCategory request)
    {
        try
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest(new
                {
                    message = "Tên nhà xuất bản không được để trống."
                });
            }

            var publisher = await _context.PublisherCategories.FindAsync(id);

            if (publisher == null)
            {
                return NotFound(new
                {
                    message = $"Publisher with id {id} was not found."
                });
            }

            publisher.Name = request.Name.Trim();
            publisher.Address = request.Address?.Trim();
            publisher.Phone = request.Phone?.Trim();
            publisher.Email = request.Email?.Trim();
            publisher.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Cập nhật nhà xuất bản thành công."
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "Lỗi khi cập nhật nhà xuất bản.",
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
            var publisher = await _context.PublisherCategories.FindAsync(id);

            if (publisher == null)
            {
                return NotFound(new
                {
                    message = $"Publisher with id {id} was not found."
                });
            }

            _context.PublisherCategories.Remove(publisher);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Xóa nhà xuất bản thành công."
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "Lỗi khi xóa nhà xuất bản.",
                error = ex.Message,
                innerError = ex.InnerException?.Message
            });
        }
    }
}