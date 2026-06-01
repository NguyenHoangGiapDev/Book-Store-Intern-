using BookStore.Api.DTOs.SchoolSupply;
using BookStore.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace BookStore.Api.Controllers;

[ApiController]
[Route("api/school-supplies")]
public class SchoolSuppliesController : ControllerBase
{
    private readonly ISchoolSupplyService _schoolSupplyService;

    public SchoolSuppliesController(ISchoolSupplyService schoolSupplyService)
    {
        _schoolSupplyService = schoolSupplyService;
    }

    [HttpGet]
    public async Task<ActionResult<List<SchoolSupplyDto>>> GetAll()
    {
        var items = await _schoolSupplyService.GetAllAsync();

        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<SchoolSupplyDto>> GetById(int id)
    {
        var item = await _schoolSupplyService.GetByIdAsync(id);

        if (item == null)
        {
            return NotFound($"School supply with id {id} was not found.");
        }

        return Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<SchoolSupplyDto>> Create(CreateSchoolSupplyDto request)
    {
        try
        {
            var created = await _schoolSupplyService.CreateAsync(request);

            return CreatedAtAction(
                nameof(GetById),
                new { id = created.Id },
                created
            );
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(exception.Message);
        }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateSchoolSupplyDto request)
    {
        try
        {
            var updated = await _schoolSupplyService.UpdateAsync(id, request);

            if (!updated)
            {
                return NotFound($"School supply with id {id} was not found.");
            }

            return NoContent();
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(exception.Message);
        }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _schoolSupplyService.DeleteAsync(id);

        if (!deleted)
        {
            return NotFound($"School supply with id {id} was not found.");
        }

        return NoContent();
    }
}