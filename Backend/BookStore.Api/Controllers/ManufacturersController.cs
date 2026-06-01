using BookStore.Api.Data;
using BookStore.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookStore.Api.Controllers;

[ApiController]
[Route("api/manufacturers")]
public class ManufacturersController : ControllerBase
{
    private readonly AppDbContext _context;

    public ManufacturersController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            var manufacturers = await _context.Manufacturers
                .OrderBy(x => x.Id)
                .Select(x => new
                {
                    id = x.Id,
                    name = x.Name,
                    description = x.Description,
                    address = x.Address,
                    phone = x.Phone,
                    email = x.Email,
                    createdAt = x.CreatedAt,
                    updatedAt = x.UpdatedAt
                })
                .ToListAsync();

            return Ok(manufacturers);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "Lỗi khi tải danh sách nhà sản xuất.",
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
            var manufacturer = await _context.Manufacturers
                .Where(x => x.Id == id)
                .Select(x => new
                {
                    id = x.Id,
                    name = x.Name,
                    description = x.Description,
                    address = x.Address,
                    phone = x.Phone,
                    email = x.Email,
                    createdAt = x.CreatedAt,
                    updatedAt = x.UpdatedAt
                })
                .FirstOrDefaultAsync();

            if (manufacturer == null)
            {
                return NotFound(new
                {
                    message = $"Manufacturer with id {id} was not found."
                });
            }

            return Ok(manufacturer);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "Lỗi khi tải chi tiết nhà sản xuất.",
                error = ex.Message,
                innerError = ex.InnerException?.Message
            });
        }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Manufacturer request)
    {
        try
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest(new
                {
                    message = "Tên nhà sản xuất không được để trống."
                });
            }

            var manufacturer = new Manufacturer
            {
                Name = request.Name.Trim(),
                Description = request.Description?.Trim(),
                Address = request.Address?.Trim(),
                Phone = request.Phone?.Trim(),
                Email = request.Email?.Trim(),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = null
            };

            _context.Manufacturers.Add(manufacturer);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = manufacturer.Id }, new
            {
                id = manufacturer.Id,
                name = manufacturer.Name,
                description = manufacturer.Description,
                address = manufacturer.Address,
                phone = manufacturer.Phone,
                email = manufacturer.Email,
                createdAt = manufacturer.CreatedAt,
                updatedAt = manufacturer.UpdatedAt
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "Lỗi khi thêm nhà sản xuất.",
                error = ex.Message,
                innerError = ex.InnerException?.Message
            });
        }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] Manufacturer request)
    {
        try
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest(new
                {
                    message = "Tên nhà sản xuất không được để trống."
                });
            }

            var manufacturer = await _context.Manufacturers.FindAsync(id);

            if (manufacturer == null)
            {
                return NotFound(new
                {
                    message = $"Manufacturer with id {id} was not found."
                });
            }

            manufacturer.Name = request.Name.Trim();
            manufacturer.Description = request.Description?.Trim();
            manufacturer.Address = request.Address?.Trim();
            manufacturer.Phone = request.Phone?.Trim();
            manufacturer.Email = request.Email?.Trim();
            manufacturer.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Cập nhật nhà sản xuất thành công."
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "Lỗi khi cập nhật nhà sản xuất.",
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
            var manufacturer = await _context.Manufacturers.FindAsync(id);

            if (manufacturer == null)
            {
                return NotFound(new
                {
                    message = $"Manufacturer with id {id} was not found."
                });
            }

            _context.Manufacturers.Remove(manufacturer);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Xóa nhà sản xuất thành công."
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "Lỗi khi xóa nhà sản xuất.",
                error = ex.Message,
                innerError = ex.InnerException?.Message
            });
        }
    }
}