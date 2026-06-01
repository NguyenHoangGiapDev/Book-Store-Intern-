using BookStore.Api.Data;
using BookStore.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookStore.Api.Controllers;

[ApiController]
[Route("api/deliverycategories")]
public class DeliveryCategoriesController : ControllerBase
{
    private readonly AppDbContext _context;

    public DeliveryCategoriesController(AppDbContext context)
    {
        _context = context;
    }

    // GET: /api/deliverycategories
    [HttpGet]
    public async Task<IActionResult> GetDeliveryCategories()
    {
        var data = await _context.DeliveryCategories
            .OrderBy(x => x.Id)
            .Select(x => new
            {
                x.Id,
                x.OrderId,
                x.ReceiverName,
                x.ReceiverPhone,
                x.DeliveryAddress,
                x.DeliveryStatus,
                x.ShippedAt,
                x.DeliveredAt,
                x.ShippingProvider,
                TotalAmount = x.CustomTotalAmount.HasValue ? x.CustomTotalAmount.Value : (x.Order != null ? x.Order.TotalAmount : 0)
            })
            .ToListAsync();

        return Ok(data);
    }

    // GET: /api/deliverycategories/5
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetDeliveryCategoryById(int id)
    {
        var delivery = await _context.DeliveryCategories
            .Where(x => x.Id == id)
            .Select(x => new
            {
                x.Id,
                x.OrderId,
                x.ReceiverName,
                x.ReceiverPhone,
                x.DeliveryAddress,
                x.DeliveryStatus,
                x.ShippedAt,
                x.DeliveredAt,
                x.ShippingProvider,
                TotalAmount = x.CustomTotalAmount.HasValue ? x.CustomTotalAmount.Value : (x.Order != null ? x.Order.TotalAmount : 0)
            })
            .FirstOrDefaultAsync();

        if (delivery == null)
        {
            return NotFound(new { message = "Không tìm thấy vận đơn" });
        }

        return Ok(delivery);
    }

    // POST: /api/deliverycategories
    [HttpPost]
public async Task<IActionResult> CreateDeliveryCategory([FromBody] CreateDeliveryCategoryRequest request)
{
    try
    {
        if (request == null)
        {
            return BadRequest(new { message = "Dữ liệu gửi lên không hợp lệ" });
        }

        if (string.IsNullOrWhiteSpace(request.ReceiverName))
        {
            return BadRequest(new { message = "Vui lòng nhập tên người nhận" });
        }

        if (string.IsNullOrWhiteSpace(request.ReceiverPhone))
        {
            return BadRequest(new { message = "Vui lòng nhập số điện thoại" });
        }

        if (string.IsNullOrWhiteSpace(request.DeliveryAddress))
        {
            return BadRequest(new { message = "Vui lòng nhập địa chỉ giao hàng" });
        }

        if (request.OrderId.HasValue)
        {
            var orderExists = await _context.Orders.AnyAsync(o => o.Id == request.OrderId.Value);

            if (!orderExists)
            {
                return BadRequest(new { message = "OrderId không tồn tại trong bảng Orders" });
            }
        }

        var delivery = new DeliveryCategory
        {
            OrderId = request.OrderId,
            ReceiverName = request.ReceiverName.Trim(),
            ReceiverPhone = request.ReceiverPhone.Trim(),
            DeliveryAddress = request.DeliveryAddress.Trim(),
            DeliveryStatus = string.IsNullOrWhiteSpace(request.DeliveryStatus)
                ? "Processing"
                : request.DeliveryStatus.Trim(),
            ShippingProvider = request.ShippingProvider?.Trim(),
            CustomTotalAmount = request.TotalAmount,
            ShippedAt = DateTime.UtcNow,
            DeliveredAt = null
        };

        _context.DeliveryCategories.Add(delivery);
        await _context.SaveChangesAsync();

        return Ok(delivery);
    }
    catch (Exception ex)
    {
        return StatusCode(500, new
        {
            message = "Lỗi server khi tạo vận đơn",
            error = ex.Message,
            innerError = ex.InnerException?.Message
        });
    }
}

    // PUT: /api/deliverycategories/5/status
    [HttpPut("{id:int}/status")]
    public async Task<IActionResult> UpdateDeliveryStatus(int id, [FromBody] UpdateDeliveryStatusRequest request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.DeliveryStatus))
        {
            return BadRequest(new { message = "Vui lòng nhập trạng thái giao hàng" });
        }

        var delivery = await _context.DeliveryCategories.FindAsync(id);

        if (delivery == null)
        {
            return NotFound(new { message = "Không tìm thấy vận đơn" });
        }

        var nextStatus = request.DeliveryStatus.Trim();

        delivery.DeliveryStatus = nextStatus;

        if (nextStatus.Equals("Completed", StringComparison.OrdinalIgnoreCase) ||
            nextStatus.Equals("delivered", StringComparison.OrdinalIgnoreCase))
        {
            delivery.DeliveredAt = DateTime.UtcNow;
        }
        else
        {
            delivery.DeliveredAt = null;
        }

        await _context.SaveChangesAsync();

        return Ok(delivery);
    }

    public class CreateDeliveryCategoryRequest
    {
        public int? OrderId { get; set; }

        public string ReceiverName { get; set; } = string.Empty;

        public string? ReceiverPhone { get; set; }

        public string DeliveryAddress { get; set; } = string.Empty;

        public string DeliveryStatus { get; set; } = "Processing";

        public string? ShippingProvider { get; set; }

        public decimal? TotalAmount { get; set; }
    }

    public class UpdateDeliveryStatusRequest
    {
        public string DeliveryStatus { get; set; } = string.Empty;
    }
}