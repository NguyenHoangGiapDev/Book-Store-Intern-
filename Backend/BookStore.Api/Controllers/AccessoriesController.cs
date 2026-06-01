using BookStore.Api.DTOs.Accessory;
using BookStore.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace BookStore.Api.Controllers;

[ApiController]
[Route("api/accessories")]
public class AccessoriesController : ControllerBase
{
    private readonly IAccessoryService _accessoryService;

    public AccessoriesController(IAccessoryService accessoryService)
    {
        _accessoryService = accessoryService;
    }

    [HttpGet]
    public async Task<ActionResult<List<AccessoryDto>>> GetAll()
    {
        var items = await _accessoryService.GetAllAsync();
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<AccessoryDto>> GetById(int id)
    {
        var item = await _accessoryService.GetByIdAsync(id);
        if (item == null) return NotFound();
        return Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<AccessoryDto>> Create(CreateAccessoryDto request)
    {
        try
        {
            var created = await _accessoryService.CreateAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateAccessoryDto request)
    {
        try
        {
            var updated = await _accessoryService.UpdateAsync(id, request);
            if (!updated) return NotFound();
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _accessoryService.DeleteAsync(id);
        if (!deleted) return NotFound();
        return NoContent();
    }
}
