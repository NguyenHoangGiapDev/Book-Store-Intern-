using BookStore.Api.DTOs.Souvenir;
using BookStore.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace BookStore.Api.Controllers;

[ApiController]
[Route("api/souvenirs")]
public class SouvenirsController : ControllerBase
{
    private readonly ISouvenirService _souvenirService;

    public SouvenirsController(ISouvenirService souvenirService)
    {
        _souvenirService = souvenirService;
    }

    [HttpGet]
    public async Task<ActionResult<List<SouvenirDto>>> GetAll()
    {
        var items = await _souvenirService.GetAllAsync();
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<SouvenirDto>> GetById(int id)
    {
        var item = await _souvenirService.GetByIdAsync(id);
        if (item == null) return NotFound();
        return Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<SouvenirDto>> Create(CreateSouvenirDto request)
    {
        try
        {
            var created = await _souvenirService.CreateAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateSouvenirDto request)
    {
        try
        {
            var updated = await _souvenirService.UpdateAsync(id, request);
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
        var deleted = await _souvenirService.DeleteAsync(id);
        if (!deleted) return NotFound();
        return NoContent();
    }
}
