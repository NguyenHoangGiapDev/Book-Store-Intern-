using BookStore.Api.Data;
using BookStore.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookStore.Api.Controllers;

[ApiController]
[Route("api/brands")]
public class BrandsController : ControllerBase
{
    private readonly AppDbContext _context;

    public BrandsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            var brands = await _context.BrandCategories
                .OrderBy(x => x.Id)
                .Select(x => new
                {
                    id = x.Id,
                    name = x.Name,
                    description = x.Description,
                    phone = x.Phone,
                    country = x.Country,
                    email = x.Email,
                    createdAt = x.CreatedAt,
                    updatedAt = x.UpdatedAt
                })
                .ToListAsync();

            return Ok(brands);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "Lỗi khi tải danh sách thương hiệu.",
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
            var brand = await _context.BrandCategories
                .Where(x => x.Id == id)
                .Select(x => new
                {
                    id = x.Id,
                    name = x.Name,
                    description = x.Description,
                    phone = x.Phone,
                    country = x.Country,
                    email = x.Email,
                    createdAt = x.CreatedAt,
                    updatedAt = x.UpdatedAt
                })
                .FirstOrDefaultAsync();

            if (brand == null)
            {
                return NotFound(new
                {
                    message = $"Brand with id {id} was not found."
                });
            }

            return Ok(brand);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "Lỗi khi tải chi tiết thương hiệu.",
                error = ex.Message,
                innerError = ex.InnerException?.Message
            });
        }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] BrandCategory request)
    {
        try
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest(new
                {
                    message = "Tên thương hiệu không được để trống."
                });
            }

            var brand = new BrandCategory
            {
                Name = request.Name.Trim(),
                Description = request.Description?.Trim(),
                Phone = request.Phone?.Trim(),
                Country = request.Country?.Trim(),
                Email = request.Email?.Trim(),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = null
            };

            _context.BrandCategories.Add(brand);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = brand.Id }, new
            {
                id = brand.Id,
                name = brand.Name,
                description = brand.Description,
                phone = brand.Phone,
                country = brand.Country,
                email = brand.Email,
                createdAt = brand.CreatedAt,
                updatedAt = brand.UpdatedAt
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "Lỗi khi thêm thương hiệu.",
                error = ex.Message,
                innerError = ex.InnerException?.Message
            });
        }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] BrandCategory request)
    {
        try
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest(new
                {
                    message = "Tên thương hiệu không được để trống."
                });
            }

            var brand = await _context.BrandCategories.FindAsync(id);

            if (brand == null)
            {
                return NotFound(new
                {
                    message = $"Brand with id {id} was not found."
                });
            }

            brand.Name = request.Name.Trim();
            brand.Description = request.Description?.Trim();
            brand.Phone = request.Phone?.Trim();
            brand.Country = request.Country?.Trim();
            brand.Email = request.Email?.Trim();
            brand.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Cập nhật thương hiệu thành công."
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "Lỗi khi cập nhật thương hiệu.",
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
            var brand = await _context.BrandCategories.FindAsync(id);

            if (brand == null)
            {
                return NotFound(new
                {
                    message = $"Brand with id {id} was not found."
                });
            }

            _context.BrandCategories.Remove(brand);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Xóa thương hiệu thành công."
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "Lỗi khi xóa thương hiệu.",
                error = ex.Message,
                innerError = ex.InnerException?.Message
            });
        }
    }
}