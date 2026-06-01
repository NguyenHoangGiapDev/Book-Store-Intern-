using BookStore.Api.Data;
using BookStore.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookStore.Api.Controllers;

[ApiController]
[Route("api/shifts")]
public class ShiftsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ShiftsController(AppDbContext context)
    {
        _context = context;
    }

    // GET api/shifts?staffId=1  – lấy tất cả ca (hoặc theo nhân viên)
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? staffId)
    {
        var query = _context.Shifts
            .Include(s => s.Staff)
            .Include(s => s.Transactions)
            .AsNoTracking()
            .AsQueryable();

        if (staffId.HasValue)
            query = query.Where(s => s.StaffId == staffId.Value);

        var shifts = await query
            .OrderByDescending(s => s.OpenedAt)
            .Select(s => new
            {
                s.Id,
                s.StaffId,
                StaffName = s.Staff != null ? s.Staff.FullName : "Không rõ",
                s.OpenedAt,
                s.ClosedAt,
                s.OpeningCash,
                s.IsOpen,
                Transactions = s.Transactions.Select(t => new
                {
                    t.Id,
                    t.Type,
                    t.Reason,
                    t.Amount,
                    t.CreatedAt
                }).ToList()
            })
            .ToListAsync();

        return Ok(shifts);
    }

    // GET api/shifts/open?staffId=1  – ca đang mở của nhân viên
    [HttpGet("open")]
    public async Task<IActionResult> GetOpenShift([FromQuery] int? staffId)
    {
        var query = _context.Shifts
            .Include(s => s.Staff)
            .Include(s => s.Transactions)
            .Where(s => s.IsOpen)
            .AsNoTracking()
            .AsQueryable();

        if (staffId.HasValue)
            query = query.Where(s => s.StaffId == staffId.Value);

        var shift = await query
            .OrderByDescending(s => s.OpenedAt)
            .Select(s => new
            {
                s.Id,
                s.StaffId,
                StaffName = s.Staff != null ? s.Staff.FullName : "Không rõ",
                s.OpenedAt,
                s.ClosedAt,
                s.OpeningCash,
                s.IsOpen,
                Transactions = s.Transactions.Select(t => new
                {
                    t.Id,
                    t.Type,
                    t.Reason,
                    t.Amount,
                    t.CreatedAt
                }).ToList()
            })
            .FirstOrDefaultAsync();

        if (shift == null)
            return NotFound(new { message = "Không có ca nào đang mở." });

        return Ok(shift);
    }

    // GET api/shifts/{id}
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var shift = await _context.Shifts
            .Include(s => s.Staff)
            .Include(s => s.Transactions)
            .AsNoTracking()
            .Where(s => s.Id == id)
            .Select(s => new
            {
                s.Id,
                s.StaffId,
                StaffName = s.Staff != null ? s.Staff.FullName : "Không rõ",
                s.OpenedAt,
                s.ClosedAt,
                s.OpeningCash,
                s.IsOpen,
                Transactions = s.Transactions.Select(t => new
                {
                    t.Id,
                    t.Type,
                    t.Reason,
                    t.Amount,
                    t.CreatedAt
                }).ToList()
            })
            .FirstOrDefaultAsync();

        if (shift == null)
            return NotFound(new { message = $"Ca #{id} không tồn tại." });

        return Ok(shift);
    }

    // POST api/shifts  – mở ca mới
    [HttpPost]
    public async Task<IActionResult> OpenShift([FromBody] OpenShiftRequest request)
    {
        // Kiểm tra đã có ca đang mở chưa
        var existing = await _context.Shifts
            .AnyAsync(s => s.StaffId == request.StaffId && s.IsOpen);

        if (existing)
            return BadRequest(new { message = "Nhân viên đang có ca chưa đóng." });

        var userExists = await _context.Users.AnyAsync(u => u.Id == request.StaffId);
        if (!userExists)
            return BadRequest(new { message = $"Không tìm thấy nhân viên Id={request.StaffId}." });

        var shift = new Shift
        {
            StaffId = request.StaffId,
            OpeningCash = request.OpeningCash,
            OpenedAt = DateTime.UtcNow,
            IsOpen = true
        };

        _context.Shifts.Add(shift);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = shift.Id }, new
        {
            shift.Id,
            shift.StaffId,
            shift.OpenedAt,
            shift.OpeningCash,
            shift.IsOpen,
            Transactions = new List<object>()
        });
    }

    // PUT api/shifts/{id}/close  – đóng ca
    [HttpPut("{id:int}/close")]
    public async Task<IActionResult> CloseShift(int id)
    {
        var shift = await _context.Shifts.FindAsync(id);
        if (shift == null)
            return NotFound(new { message = $"Ca #{id} không tồn tại." });

        if (!shift.IsOpen)
            return BadRequest(new { message = "Ca này đã đóng rồi." });

        shift.IsOpen = false;
        shift.ClosedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Đã đóng ca thành công.", closedAt = shift.ClosedAt });
    }

    // POST api/shifts/{id}/transactions  – thêm giao dịch thu/chi
    [HttpPost("{id:int}/transactions")]
    public async Task<IActionResult> AddTransaction(int id, [FromBody] AddTransactionRequest request)
    {
        var shift = await _context.Shifts.FindAsync(id);
        if (shift == null)
            return NotFound(new { message = $"Ca #{id} không tồn tại." });

        if (!shift.IsOpen)
            return BadRequest(new { message = "Không thể thêm giao dịch vào ca đã đóng." });

        if (string.IsNullOrWhiteSpace(request.Reason))
            return BadRequest(new { message = "Vui lòng nhập lý do." });

        if (request.Amount <= 0)
            return BadRequest(new { message = "Số tiền phải lớn hơn 0." });

        var tx = new ShiftTransaction
        {
            ShiftId = id,
            Type = request.Type?.Trim() == "Thu" ? "Thu" : "Chi",
            Reason = request.Reason.Trim(),
            Amount = request.Amount,
            CreatedAt = DateTime.UtcNow
        };

        _context.ShiftTransactions.Add(tx);
        await _context.SaveChangesAsync();

        return Ok(new { tx.Id, tx.ShiftId, tx.Type, tx.Reason, tx.Amount, tx.CreatedAt });
    }

    // DELETE api/shifts/{id}/transactions/{txId}
    [HttpDelete("{id:int}/transactions/{txId:int}")]
    public async Task<IActionResult> DeleteTransaction(int id, int txId)
    {
        var tx = await _context.ShiftTransactions
            .FirstOrDefaultAsync(t => t.Id == txId && t.ShiftId == id);

        if (tx == null)
            return NotFound(new { message = "Không tìm thấy giao dịch." });

        _context.ShiftTransactions.Remove(tx);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Đã xóa giao dịch." });
    }

    public class OpenShiftRequest
    {
        public int StaffId { get; set; }
        public decimal OpeningCash { get; set; }
    }

    public class AddTransactionRequest
    {
        public string Type { get; set; } = "Chi";
        public string Reason { get; set; } = string.Empty;
        public decimal Amount { get; set; }
    }
}
