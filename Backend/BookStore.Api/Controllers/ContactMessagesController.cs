using BookStore.Api.Data;
using BookStore.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookStore.Api.Controllers;

[ApiController]
[Route("api/ContactMessages")]
public class ContactMessagesController : ControllerBase
{
    private readonly AppDbContext _context;

    public ContactMessagesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<ActionResult<ContactMessage>> PostContactMessage([FromBody] ContactMessage message)
    {
        try
        {
            Console.WriteLine("=== CONTACT MESSAGE RECEIVED ===");
            Console.WriteLine($"Name: {message.Name}");
            Console.WriteLine($"Email: {message.Email}");
            Console.WriteLine($"Phone: {message.Phone}");
            Console.WriteLine($"Subject: {message.Subject}");
            Console.WriteLine($"Message: {message.Message}");

            message.SentAt = DateTime.UtcNow;
            message.IsRead = false;

            _context.ContactMessages.Add(message);
            await _context.SaveChangesAsync();

            Console.WriteLine($"Saved contact message id = {message.Id}");

            return Ok(message);
        }
        catch (Exception ex)
        {
            Console.WriteLine("ERROR SAVING CONTACT MESSAGE:");
            Console.WriteLine(ex);

            return StatusCode(500, new
            {
                message = "Lỗi server khi lưu tin nhắn",
                error = ex.Message
            });
        }
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ContactMessage>>> GetContactMessages()
    {
        return await _context.ContactMessages
            .OrderByDescending(m => m.SentAt)
            .ToListAsync();
    }

    [HttpGet("email/{email}")]
    public async Task<ActionResult<IEnumerable<ContactMessage>>> GetContactMessagesByEmail(string email)
    {
        return await _context.ContactMessages
            .Where(m => m.Email.ToLower() == email.ToLower())
            .OrderBy(m => m.SentAt)
            .ToListAsync();
    }

    [HttpPatch("{id}/read")]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        var message = await _context.ContactMessages.FindAsync(id);
        if (message == null) return NotFound();

        message.IsRead = true;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteContactMessage(int id)
    {
        var message = await _context.ContactMessages.FindAsync(id);
        if (message == null) return NotFound();

        _context.ContactMessages.Remove(message);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    public class ReplyDto {
        public string Reply { get; set; } = string.Empty;
    }

    [HttpPost("{id}/reply")]
    public async Task<IActionResult> ReplyContactMessage(int id, [FromBody] ReplyDto requestBody)
    {
        var originalMsg = await _context.ContactMessages.FindAsync(id);
        if (originalMsg == null) return NotFound();

        // Mark original as read
        originalMsg.IsRead = true;

        // Create a reply message in the database so it acts as a chat
        var replyMsg = new ContactMessage
        {
            Name = "Admin",
            Email = originalMsg.Email, // keep same email to thread
            Phone = "Admin",
            Subject = originalMsg.Subject, // keep same subject
            Message = requestBody.Reply,
            SentAt = DateTime.UtcNow,
            IsRead = false // Customer hasn't read it yet
        };

        _context.ContactMessages.Add(replyMsg);
        await _context.SaveChangesAsync();

        return Ok(replyMsg);
    }
}