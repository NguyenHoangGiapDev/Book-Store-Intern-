using BookStore.Api.Data;
using BookStore.Api.DTOs.Categories;
using BookStore.Api.Models;
using BookStore.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookStore.Api.Controllers;

[ApiController]
[Route("api/categories")]
public class CategoriesController : ControllerBase
{
    private readonly ICategoryService _categoryService;
    private readonly AppDbContext _context;

    public CategoriesController(ICategoryService categoryService, AppDbContext context)
    {
        _categoryService = categoryService;
        _context = context;
    }

    private const int STATIONERY_OFFSET = 1000;
    private const int TOY_OFFSET = 2000;
    private const int SOUVENIR_OFFSET = 3000;
    private const int ACCESSORY_OFFSET = 4000;
    private const int SCHOOL_OFFSET = 5005;

    [HttpGet("stationery")]
public async Task<IActionResult> GetStationeryCategories()
{
    var categories = await _context.StationeryCategories
        .OrderBy(x => x.Name)
        .Select(x => new
        {
            id = x.Id,
            name = x.Name,
            description = x.Description
        })
        .ToListAsync();

    return Ok(categories);
}

[HttpGet("toys")]
public async Task<IActionResult> GetToyCategories()
{
    var categories = await _context.ToyCategories
        .OrderBy(x => x.Name)
        .Select(x => new
        {
            id = x.Id,
            name = x.Name,
            description = x.Description
        })
        .ToListAsync();

    return Ok(categories);
}

[HttpGet("school-supplies")]
public async Task<IActionResult> GetSchoolSupplyCategories()
{
    var categories = await _context.SchoolSupplyCategories
        .OrderBy(x => x.Name)
        .Select(x => new
        {
            id = x.Id,
            name = x.Name,
            description = x.Description
        })
        .ToListAsync();

    return Ok(categories);
}

[HttpGet("accessories")]
public async Task<IActionResult> GetAccessoryCategories()
{
    var categories = await _context.AccessoryCategories
        .OrderBy(x => x.Name)
        .Select(x => new
        {
            id = x.Id,
            name = x.Name,
            description = x.Description
        })
        .ToListAsync();

    return Ok(categories);
}

[HttpGet("souvenirs")]
public async Task<IActionResult> GetSouvenirCategories()
{
    var categories = await _context.SouvenirCategories
        .OrderBy(x => x.Name)
        .Select(x => new
        {
            id = x.Id,
            name = x.Name,
            description = x.Description
        })
        .ToListAsync();

    return Ok(categories);
}

    [HttpGet]
    public async Task<ActionResult<List<CategoryDto>>> GetAll()
    {
        try
        {
            var bookCategories = await _categoryService.GetAllAsync();
            var stationeryCategories = await _context.StationeryCategories.OrderBy(c => c.Name).ToListAsync();
            var toyCategories = await _context.ToyCategories.OrderBy(c => c.Name).ToListAsync();
            var souvenirCategories = await _context.SouvenirCategories.OrderBy(c => c.Name).ToListAsync();
            var accessoryCategories = await _context.AccessoryCategories.OrderBy(c => c.Name).ToListAsync();
            var schoolSupplyCategories = await _context.SchoolSupplyCategories.OrderBy(c => c.Name).ToListAsync();

            var all = bookCategories.ToList();

            all.AddRange(stationeryCategories.Select(c => new CategoryDto
            {
                Id = c.Id + STATIONERY_OFFSET,
                Name = c.Name,
                Description = c.Description,
                Type = "van-phong-pham",
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            }));

            all.AddRange(toyCategories.Select(c => new CategoryDto
            {
                Id = c.Id + TOY_OFFSET,
                Name = c.Name,
                Description = c.Description,
                Type = "do-choi",
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            }));

            all.AddRange(souvenirCategories.Select(c => new CategoryDto
            {
                Id = c.Id + SOUVENIR_OFFSET,
                Name = c.Name,
                Description = c.Description,
                Type = "qua-luu-niem",
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            }));

            all.AddRange(accessoryCategories.Select(c => new CategoryDto
            {
                Id = c.Id + ACCESSORY_OFFSET,
                Name = c.Name,
                Description = c.Description,
                Type = "phu-kien",
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            }));

            all.AddRange(schoolSupplyCategories.Select(c => new CategoryDto
            {
                Id = c.Id + SCHOOL_OFFSET,
                Name = c.Name,
                Description = c.Description,
                Type = "do-dung-hoc-tap",
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            }));

            return Ok(all);
        }
        catch (Exception ex)
        {
            Console.WriteLine("CategoriesController.GetAll error: " + ex);
            return StatusCode(500, new ProblemDetails { Title = "Error fetching categories", Detail = ex.Message });
        }
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<CategoryDto>> GetById(int id)
    {
        if (id > SCHOOL_OFFSET) {
            var c = await _context.SchoolSupplyCategories.FindAsync(id - SCHOOL_OFFSET);
            return c == null ? NotFound() : Ok(MapSchoolToDto(c));
        }
        if (id > ACCESSORY_OFFSET) {
            var c = await _context.AccessoryCategories.FindAsync(id - ACCESSORY_OFFSET);
            return c == null ? NotFound() : Ok(MapAccessoryToDto(c));
        }
        if (id > SOUVENIR_OFFSET) {
            var c = await _context.SouvenirCategories.FindAsync(id - SOUVENIR_OFFSET);
            return c == null ? NotFound() : Ok(MapSouvenirToDto(c));
        }
        if (id > TOY_OFFSET) {
            var c = await _context.ToyCategories.FindAsync(id - TOY_OFFSET);
            return c == null ? NotFound() : Ok(MapToyToDto(c));
        }
        if (id > STATIONERY_OFFSET) {
            var c = await _context.StationeryCategories.FindAsync(id - STATIONERY_OFFSET);
            return c == null ? NotFound() : Ok(MapStationeryToDto(c));
        }

        var category = await _categoryService.GetByIdAsync(id);
        return category == null ? NotFound() : Ok(category);
    }

    [HttpPost]
    public async Task<ActionResult<CategoryDto>> Create([FromBody] CreateCategoryDto request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Name)) return BadRequest("Tên danh mục không được để trống");

            // Route creation to the correct table based on Type
            switch (request.Type?.ToLower())
            {
                case "van-phong-pham":
                    var vpp = new StationeryCategory { Name = request.Name.Trim(), Description = request.Description?.Trim()};
                    _context.StationeryCategories.Add(vpp);
                    await _context.SaveChangesAsync();
                    return CreatedAtAction(nameof(GetById), new { id = vpp.Id + STATIONERY_OFFSET }, MapStationeryToDto(vpp));

                case "do-choi":
                    var toy = new ToyCategory { Name = request.Name.Trim(), Description = request.Description?.Trim() };
                    _context.ToyCategories.Add(toy);
                    await _context.SaveChangesAsync();
                    return CreatedAtAction(nameof(GetById), new { id = toy.Id + TOY_OFFSET }, MapToyToDto(toy));

                case "qua-luu-niem":
                    var souvenir = new SouvenirCategory { Name = request.Name.Trim(), Description = request.Description?.Trim()};
                    _context.SouvenirCategories.Add(souvenir);
                    await _context.SaveChangesAsync();
                    return CreatedAtAction(nameof(GetById), new { id = souvenir.Id + SOUVENIR_OFFSET }, MapSouvenirToDto(souvenir));

                case "phu-kien":
                    var acc = new AccessoryCategory { Name = request.Name.Trim(), Description = request.Description?.Trim() };
                    _context.AccessoryCategories.Add(acc);
                    await _context.SaveChangesAsync();
                    return CreatedAtAction(nameof(GetById), new { id = acc.Id + ACCESSORY_OFFSET }, MapAccessoryToDto(acc));

                case "do-dung-hoc-tap":
                    var school = new SchoolSupplyCategory { Name = request.Name.Trim(), Description = request.Description?.Trim()};
                    _context.SchoolSupplyCategories.Add(school);
                    await _context.SaveChangesAsync();
                    return CreatedAtAction(nameof(GetById), new { id = school.Id + SCHOOL_OFFSET }, MapSchoolToDto(school));

                case "sach":
                default:
                    var createdCategory = await _categoryService.CreateAsync(request);
                    return CreatedAtAction(nameof(GetById), new { id = createdCategory.Id }, createdCategory);
            }
        }
        catch (Exception ex) 
        { 
            Console.WriteLine("Create Category Error: " + ex);
            return BadRequest(new { message = ex.Message }); 
        }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateCategoryDto request)
    {
        try {
            if (id > SCHOOL_OFFSET) {
                var c = await _context.SchoolSupplyCategories.FindAsync(id - SCHOOL_OFFSET);
                if (c == null) return NotFound();
                c.Name = request.Name; c.Description = request.Description; c.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                return NoContent();
            }
            if (id > ACCESSORY_OFFSET) {
                var c = await _context.AccessoryCategories.FindAsync(id - ACCESSORY_OFFSET);
                if (c == null) return NotFound();
                c.Name = request.Name; c.Description = request.Description; c.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                return NoContent();
            }
            if (id > SOUVENIR_OFFSET) {
                var c = await _context.SouvenirCategories.FindAsync(id - SOUVENIR_OFFSET);
                if (c == null) return NotFound();
                c.Name = request.Name; c.Description = request.Description; c.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                return NoContent();
            }
            if (id > TOY_OFFSET) {
                var c = await _context.ToyCategories.FindAsync(id - TOY_OFFSET);
                if (c == null) return NotFound();
                c.Name = request.Name; c.Description = request.Description; c.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                return NoContent();
            }
            if (id > STATIONERY_OFFSET) {
                var c = await _context.StationeryCategories.FindAsync(id - STATIONERY_OFFSET);
                if (c == null) return NotFound();
                c.Name = request.Name; c.Description = request.Description; c.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                return NoContent();
            }

            var updated = await _categoryService.UpdateAsync(id, request);
            return updated ? NoContent() : NotFound();
        } catch (Exception ex) { return StatusCode(500, ex.Message); }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        try {
            if (id > SCHOOL_OFFSET) {
                var c = await _context.SchoolSupplyCategories.FindAsync(id - SCHOOL_OFFSET);
                if (c == null) return NotFound();
                _context.SchoolSupplyCategories.Remove(c);
                await _context.SaveChangesAsync();
                return NoContent();
            }
            if (id > ACCESSORY_OFFSET) {
                var c = await _context.AccessoryCategories.FindAsync(id - ACCESSORY_OFFSET);
                if (c == null) return NotFound();
                _context.AccessoryCategories.Remove(c);
                await _context.SaveChangesAsync();
                return NoContent();
            }
            if (id > SOUVENIR_OFFSET) {
                var c = await _context.SouvenirCategories.FindAsync(id - SOUVENIR_OFFSET);
                if (c == null) return NotFound();
                _context.SouvenirCategories.Remove(c);
                await _context.SaveChangesAsync();
                return NoContent();
            }
            if (id > TOY_OFFSET) {
                var c = await _context.ToyCategories.FindAsync(id - TOY_OFFSET);
                if (c == null) return NotFound();
                _context.ToyCategories.Remove(c);
                await _context.SaveChangesAsync();
                return NoContent();
            }
            if (id > STATIONERY_OFFSET) {
                var c = await _context.StationeryCategories.FindAsync(id - STATIONERY_OFFSET);
                if (c == null) return NotFound();
                _context.StationeryCategories.Remove(c);
                await _context.SaveChangesAsync();
                return NoContent();
            }

            var deleted = await _categoryService.DeleteAsync(id);
            return deleted ? NoContent() : NotFound();
        } catch (Exception ex) { 
            Console.WriteLine("Delete Category Error: " + ex);
            return StatusCode(500, "Cannot delete category because it is being used by products or system error."); 
        }
    }

    // Helper mapping methods
    private CategoryDto MapStationeryToDto(StationeryCategory c) => new CategoryDto { Id = c.Id + STATIONERY_OFFSET, Name = c.Name, Description = c.Description, Type = "van-phong-pham", CreatedAt = c.CreatedAt, UpdatedAt = c.UpdatedAt };
    private CategoryDto MapToyToDto(ToyCategory c) => new CategoryDto { Id = c.Id + TOY_OFFSET, Name = c.Name, Description = c.Description, Type = "do-choi", CreatedAt = c.CreatedAt, UpdatedAt = c.UpdatedAt };
    private CategoryDto MapSouvenirToDto(SouvenirCategory c) => new CategoryDto { Id = c.Id + SOUVENIR_OFFSET, Name = c.Name, Description = c.Description, Type = "qua-luu-niem", CreatedAt = c.CreatedAt, UpdatedAt = c.UpdatedAt };
    private CategoryDto MapAccessoryToDto(AccessoryCategory c) => new CategoryDto { Id = c.Id + ACCESSORY_OFFSET, Name = c.Name, Description = c.Description, Type = "phu-kien", CreatedAt = c.CreatedAt, UpdatedAt = c.UpdatedAt };
    private CategoryDto MapSchoolToDto(SchoolSupplyCategory c) => new CategoryDto { Id = c.Id + SCHOOL_OFFSET, Name = c.Name, Description = c.Description, Type = "do-dung-hoc-tap", CreatedAt = c.CreatedAt, UpdatedAt = c.UpdatedAt };

    [HttpGet("all")]
    public async Task<ActionResult<object>> GetAllCategories()
    {
        try
        {
            var bookCategories = await _categoryService.GetAllAsync();
            var stationeryCategories = await _context.StationeryCategories.OrderBy(c => c.Name).ToListAsync();
            var toyCategories = await _context.ToyCategories.OrderBy(c => c.Name).ToListAsync();
            var souvenirCategories = await _context.SouvenirCategories.OrderBy(c => c.Name).ToListAsync();
            var accessoryCategories = await _context.AccessoryCategories.OrderBy(c => c.Name).ToListAsync();
            var schoolSupplyCategories = await _context.SchoolSupplyCategories.OrderBy(c => c.Name).ToListAsync();

            return Ok(new
            {
                books = bookCategories,
                stationery = stationeryCategories.Select(c => new CategoryDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Description = c.Description,
                    Type = "van-phong-pham",
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt
                }),
                toys = toyCategories.Select(c => new CategoryDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Description = c.Description,
                    Type = "do-choi",
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt
                }),
                souvenirs = souvenirCategories.Select(c => new CategoryDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Description = c.Description,
                    Type = "qua-luu-niem",
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt
                }),
                accessories = accessoryCategories.Select(c => new CategoryDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Description = c.Description,
                    Type = "phu-kien",
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt
                }),
                schoolSupplies = schoolSupplyCategories.Select(c => new CategoryDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Description = c.Description,
                    Type = "do-dung-hoc-tap",
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt
                })
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine("CategoriesController.GetAllCategories error: " + ex);
            var pd = new ProblemDetails { Title = "Error fetching all categories", Detail = ex.Message, Status = 500 };
            return StatusCode(500, pd);
        }
    }
}