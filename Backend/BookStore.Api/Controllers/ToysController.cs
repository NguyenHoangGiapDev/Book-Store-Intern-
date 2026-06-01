using BookStore.Api.DTOs.Toy;
using BookStore.Api.Services;
using Microsoft.AspNetCore.Mvc;
using BookStore.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace BookStore.Api.Controllers;

[ApiController]
[Route("api/toys")]
public class ToysController : ControllerBase
{
   private readonly IToyService _toyService;
private readonly AppDbContext _context;

public ToysController(IToyService toyService, AppDbContext context)
{
    _toyService = toyService;
    _context = context;
}

    [HttpGet]
    public async Task<ActionResult<List<ToyDto>>> GetAll()
    {
        try
        {
            var items = await _toyService.GetAllAsync();
            return Ok(items);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "Lỗi khi tải danh sách đồ chơi.",
                error = ex.Message,
                innerError = ex.InnerException?.Message
            });
        }
    }

    [HttpGet("debug-count")]
public async Task<IActionResult> DebugCount()
{
    var count = await _context.Toys.CountAsync();

    return Ok(new
    {
        toysCount = count,
        database = _context.Database.GetDbConnection().Database,
        dataSource = _context.Database.GetDbConnection().DataSource
    });
}

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ToyDto>> GetById(int id)
    {
        try
        {
            var item = await _toyService.GetByIdAsync(id);

            if (item == null)
            {
                return NotFound(new
                {
                    message = $"Toy with id {id} was not found."
                });
            }

            return Ok(item);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "Lỗi khi tải chi tiết đồ chơi.",
                error = ex.Message,
                innerError = ex.InnerException?.Message
            });
        }
    }

    [HttpPost]
    public async Task<ActionResult<ToyDto>> Create([FromBody] CreateToyDto request)
    {
        try
        {
            if (request == null)
            {
                return BadRequest(new
                {
                    message = "Dữ liệu gửi lên không hợp lệ."
                });
            }

            var created = await _toyService.CreateAsync(request);

            return CreatedAtAction(
                nameof(GetById),
                new { id = created.Id },
                created
            );
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "Lỗi khi thêm đồ chơi.",
                error = ex.Message,
                innerError = ex.InnerException?.Message
            });
        }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateToyDto request)
    {
        try
        {
            if (request == null)
            {
                return BadRequest(new
                {
                    message = "Dữ liệu gửi lên không hợp lệ."
                });
            }

            var updated = await _toyService.UpdateAsync(id, request);

            if (!updated)
            {
                return NotFound(new
                {
                    message = $"Toy with id {id} was not found."
                });
            }

            return Ok(new
            {
                message = "Cập nhật đồ chơi thành công."
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "Lỗi khi cập nhật đồ chơi.",
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
            var deleted = await _toyService.DeleteAsync(id);

            if (!deleted)
            {
                return NotFound(new
                {
                    message = $"Toy with id {id} was not found."
                });
            }

            return Ok(new
            {
                message = "Xóa đồ chơi thành công."
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "Lỗi khi xóa đồ chơi.",
                error = ex.Message,
                innerError = ex.InnerException?.Message
            });
        }
    }
}