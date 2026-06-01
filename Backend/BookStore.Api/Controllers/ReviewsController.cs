using BookStore.Api.Data;
using BookStore.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookStore.Api.Controllers;

[ApiController]
[Route("api/reviews")]
public class ReviewsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ReviewsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetReviews()
    {
        try
        {
            var databaseName = _context.Database.GetDbConnection().Database;
            var count = await _context.Reviews.CountAsync();

            var reviews = await _context.Reviews
                .AsNoTracking()
                .Include(x => x.Book)
                .OrderByDescending(x => x.CreatedAt)
                .Select(x => new
                {
                    x.Id,
                    x.CustomerId,
                    CustomerName = !string.IsNullOrEmpty(x.CustomerName)
                        ? x.CustomerName
                        : "Khách hàng " + x.CustomerId,
                    x.BookId,
                    BookTitle = !string.IsNullOrEmpty(x.ProductTitle)
                        ? x.ProductTitle
                        : x.Book != null
                            ? x.Book.Title
                            : "Sản phẩm #" + x.BookId,
                    x.Rating,
                    x.Comment,
                    x.CreatedAt,
                    x.Status
                })
                .ToListAsync();

            return Ok(new
            {
                databaseName,
                count,
                reviews
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "Lỗi khi lấy danh sách đánh giá",
                error = ex.Message
            });
        }
    }

    [HttpGet("product/{id:int}")]
    public async Task<IActionResult> GetProductReviews(int id)
    {
        try
        {
            var reviews = await _context.Reviews
                .AsNoTracking()
                .Where(x => x.BookId == id && x.Status == "approved")
                .OrderByDescending(x => x.CreatedAt)
                .Select(x => new
                {
                    x.Id,
                    x.CustomerId,
                    CustomerName = !string.IsNullOrEmpty(x.CustomerName)
                        ? x.CustomerName
                        : "Khách hàng " + x.CustomerId,
                    x.Rating,
                    x.Comment,
                    x.CreatedAt
                })
                .ToListAsync();

            return Ok(reviews);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "Lỗi khi lấy đánh giá sản phẩm",
                error = ex.Message
            });
        }
    }

    [HttpPost]
    public async Task<IActionResult> CreateReview([FromBody] CreateReviewRequest request)
    {
        try
        {
            if (request == null)
            {
                return BadRequest(new { message = "Dữ liệu không hợp lệ" });
            }

            if (request.Rating < 1 || request.Rating > 5)
            {
                return BadRequest(new { message = "Đánh giá phải từ 1 đến 5 sao" });
            }

            if (string.IsNullOrWhiteSpace(request.Comment))
            {
                return BadRequest(new { message = "Vui lòng nhập nội dung đánh giá" });
            }

            User? customer = null;
            if (request.CustomerId > 0)
            {
                customer = await _context.Users
                    .AsNoTracking()
                    .FirstOrDefaultAsync(x => x.Id == request.CustomerId);
            }

            var resolvedName = !string.IsNullOrWhiteSpace(request.CustomerName)
                ? request.CustomerName
                : customer?.FullName ?? "Khách hàng";

            var safeCustomerName = resolvedName.Trim();
            if (safeCustomerName.Length > 100)
            {
                safeCustomerName = safeCustomerName[..100];
            }

            var safeProductTitle = (request.ProductTitle ?? string.Empty).Trim();
            if (safeProductTitle.Length > 200)
            {
                safeProductTitle = safeProductTitle[..200];
            }

            int? bookId = null;
            if (request.BookId.HasValue && request.BookId.Value > 0)
            {
                bookId = request.BookId.Value;

                // Nếu client không gửi ProductTitle thì lấy tên sách từ DB.
                if (string.IsNullOrWhiteSpace(safeProductTitle))
                {
                    var book = await _context.Books
                        .AsNoTracking()
                        .FirstOrDefaultAsync(x => x.Id == bookId.Value);

                    if (book == null)
                    {
                        return NotFound(new { message = "Không tìm thấy sách" });
                    }

                    safeProductTitle = book.Title;
                }
            }

            var review = new Review
            {
                CustomerId = request.CustomerId > 0 ? request.CustomerId : 0,
                CustomerName = safeCustomerName,
                BookId = bookId,
                ProductTitle = safeProductTitle,
                Rating = request.Rating,
                Comment = request.Comment.Trim(),
                CreatedAt = DateTime.UtcNow,
                Status = "pending"
            };

            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Gửi đánh giá thành công, đang chờ duyệt",
                review
            });
        }
        catch (DbUpdateException dbEx)
        {
            Console.WriteLine("DbUpdateException when saving review: " + dbEx);

            return StatusCode(500, new
            {
                message = "Lỗi server khi lưu đánh giá",
                error = dbEx.Message,
                dbError = dbEx.InnerException?.Message
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine("CreateReview error: " + ex);

            return StatusCode(500, new
            {
                message = "Lỗi server khi lưu đánh giá",
                error = ex.Message,
                innerError = ex.InnerException?.Message
            });
        }
    }

    [HttpPut("{id:int}/approve")]
    public async Task<IActionResult> ApproveReview(int id)
    {
        try
        {
            var review = await _context.Reviews.FindAsync(id);

            if (review == null)
            {
                return NotFound(new { message = "Không tìm thấy đánh giá" });
            }

            review.Status = "approved";
            await _context.SaveChangesAsync();

            return Ok(review);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "Lỗi khi duyệt đánh giá",
                error = ex.Message
            });
        }
    }

    [HttpPut("{id:int}/reject")]
    public async Task<IActionResult> RejectReview(int id)
    {
        try
        {
            var review = await _context.Reviews.FindAsync(id);

            if (review == null)
            {
                return NotFound(new { message = "Không tìm thấy đánh giá" });
            }

            review.Status = "rejected";
            await _context.SaveChangesAsync();

            return Ok(review);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "Lỗi khi từ chối đánh giá",
                error = ex.Message
            });
        }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteReview(int id)
    {
        try
        {
            var review = await _context.Reviews.FindAsync(id);

            if (review == null)
            {
                return NotFound(new { message = "Không tìm thấy đánh giá" });
            }

            _context.Reviews.Remove(review);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã xóa đánh giá" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "Lỗi khi xóa đánh giá",
                error = ex.Message,
                innerError = ex.InnerException?.Message
            });
        }
    }

    public class CreateReviewRequest
    {
        public int CustomerId { get; set; }

        public string? CustomerName { get; set; }

        public int? BookId { get; set; }

        public string? ProductTitle { get; set; }

        public int Rating { get; set; }

        public string Comment { get; set; } = string.Empty;
    }
}
