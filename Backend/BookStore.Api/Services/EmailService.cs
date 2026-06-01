using System.Net;
using System.Net.Mail;

namespace BookStore.Api.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;

    public EmailService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task SendEmailAsync(string toEmail, string subject, string body, bool isHtml = false)
    {
        var emailSettings = _configuration.GetSection("EmailSettings");
        var smtpServer = emailSettings["SmtpServer"] ?? "smtp.gmail.com";
        var port = int.Parse(emailSettings["Port"] ?? "587");
        var senderEmail = emailSettings["SenderEmail"];
        var senderName = emailSettings["SenderName"] ?? "BookStore";
        var password = emailSettings["Password"];

        if (string.IsNullOrEmpty(senderEmail) || 
            string.IsNullOrEmpty(password) || 
            senderEmail.Contains("YOUR_EMAIL_HERE") || 
            password.Contains("YOUR_APP_PASSWORD_HERE"))
        {
            Console.WriteLine("Cấu hình Email bị thiếu hoặc đang sử dụng placeholder trong appsettings.json. Đang log email ra console thay vì gửi.");
            Console.WriteLine($"To: {toEmail}\nSubject: {subject}\nBody: {body}");
            return;
        }

        using var client = new SmtpClient(smtpServer, port)
        {
            Credentials = new NetworkCredential(senderEmail, password),
            EnableSsl = true,
        };

        var mailMessage = new MailMessage
        {
            From = new MailAddress(senderEmail, senderName),
            Subject = subject,
            Body = body,
            IsBodyHtml = isHtml,
        };
        mailMessage.To.Add(toEmail);

        try
        {
            await client.SendMailAsync(mailMessage);
            Console.WriteLine($"Đã gửi email thành công tới {toEmail}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Lỗi khi gửi email: {ex.Message}");
            throw;
        }
    }
}
