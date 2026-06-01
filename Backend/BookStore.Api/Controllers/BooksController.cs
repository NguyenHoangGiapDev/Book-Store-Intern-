using BookStore.Api.DTOs.Books;
using BookStore.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Hosting;
using System.IO;

namespace BookStore.Api.Controllers
{
    [ApiController]
    [Route("api/books")]
    public class BooksController : ControllerBase
    {
        private readonly IBookService _bookService;
        private readonly IWebHostEnvironment _env;

        public BooksController(IBookService bookService, IWebHostEnvironment env)
        {
            _bookService = bookService;
            _env = env;
        }

        // GET: api/books
        [HttpGet]
        public async Task<ActionResult<List<BookDto>>> GetAll()
        {
            var books = await _bookService.GetAllAsync();
            return Ok(books);
        }

        // GET: api/books/{id}
        [HttpGet("{id:int}")]
        public async Task<ActionResult<BookDto>> GetById(int id)
        {
            var book = await _bookService.GetByIdAsync(id);
            if (book == null)
                return NotFound($"Book with id {id} was not found.");

            return Ok(book);
        }

        // GET: api/books/{id}/sales-summary
        [HttpGet("{id:int}/sales-summary")]
        public async Task<IActionResult> GetBookSalesSummary(int id)
        {
            try
            {
                var book = await _bookService.GetByIdAsync(id);
                if (book == null)
                    return NotFound(new { message = $"Book with id {id} was not found." });

                return Ok(new
                {
                    bookId = id,
                    totalSold = 0,
                    soldToday = 0,
                    soldThisMonth = 0,
                    soldThisQuarter = 0,
                    soldThisYear = 0,
                    totalRevenue = 0,
                    totalOrders = 0,
                    totalBuyers = 0,
                    onlineOrders = 0,
                    offlineOrders = 0,
                    averageQuantityPerOrder = 0,
                    lastSoldAt = (DateTime?)null,
                    topCustomers = new List<object>(),
                    recentPurchases = new List<object>()
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Error fetching book sales summary.",
                    error = ex.Message,
                    innerError = ex.InnerException?.Message
                });
            }
        }

        // POST: api/books
        [HttpPost]
        public async Task<ActionResult<BookDto>> Create(CreateBookDto request)
        {
            try
            {
                var createdBook = await _bookService.CreateAsync(request);
                return CreatedAtAction(nameof(GetById), new { id = createdBook.Id }, createdBook);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // PUT: api/books/{id}
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, UpdateBookDto request)
        {
            try
            {
                var updated = await _bookService.UpdateAsync(id, request);
                if (!updated)
                    return NotFound($"Book with id {id} was not found.");

                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // DELETE: api/books/{id}
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var deleted = await _bookService.DeleteAsync(id);
            if (!deleted)
                return NotFound($"Book with id {id} was not found.");

            return NoContent();
        }

        // POST: api/books/upload-image
        [HttpPost("upload-image")]
        public async Task<IActionResult> UploadImageOnly(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded.");

            var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var uploadsFolder = Path.Combine(webRoot, "images/books");
            Directory.CreateDirectory(uploadsFolder);

            var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
                await file.CopyToAsync(stream);

            var imageUrl = $"{Request.Scheme}://{Request.Host}/images/books/{fileName}";
            return Ok(new { imageUrl });
        }

        // POST: api/books/{id}/upload-image
        [HttpPost("{id:int}/upload-image")]
        public async Task<IActionResult> UploadImage(int id, IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded.");

            var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var uploadsFolder = Path.Combine(webRoot, "images/books");
            Directory.CreateDirectory(uploadsFolder);

            var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
                await file.CopyToAsync(stream);

            var imageUrl = $"{Request.Scheme}://{Request.Host}/images/books/{fileName}";

            var book = await _bookService.GetByIdAsync(id);
            if (book == null) return NotFound();

            var updateDto = new UpdateBookDto
            {
                Title = book.Title ?? string.Empty,
                Author = book.Author ?? string.Empty,
                Publisher = book.Publisher,
                Description = book.Description,
                Price = book.Price,
                StockQuantity = book.StockQuantity,
                CategoryId = book.CategoryId,
                ImageUrl = imageUrl
            };

            var updated = await _bookService.UpdateAsync(id, updateDto);
            if (!updated) return NotFound();

            return Ok(new { imageUrl });
        }
    }
}