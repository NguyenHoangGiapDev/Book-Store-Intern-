using BookStore.Api.DTOs.Stationery;
using BookStore.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace BookStore.Api.Controllers;

[ApiController]
[Route("api/stationery")]
public class StationeryController : ControllerBase
{
    private readonly IStationeryService _stationeryService;

    public StationeryController(IStationeryService stationeryService)
    {
        _stationeryService = stationeryService;
    }

    [HttpGet]
    public async Task<ActionResult<List<StationeryDto>>> GetAll([FromQuery] string? type)
    {
        var items = await _stationeryService.GetAllAsync(type);

        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<StationeryDto>> GetById(int id)
    {
        var item = await _stationeryService.GetByIdAsync(id);

        if (item == null)
        {
            return NotFound($"Stationery with id {id} was not found.");
        }

        return Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<StationeryDto>> Create(CreateStationeryDto request)
    {
        try
        {
            var created = await _stationeryService.CreateAsync(request);

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
    public async Task<IActionResult> Update(int id, UpdateStationeryDto request)
    {
        try
        {
            var updated = await _stationeryService.UpdateAsync(id, request);

            if (!updated)
            {
                return NotFound($"Stationery with id {id} was not found.");
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
        var deleted = await _stationeryService.DeleteAsync(id);

        if (!deleted)
        {
            return NotFound($"Stationery with id {id} was not found.");
        }

        return NoContent();
    }
}
