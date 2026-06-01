using BookStore.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BookStore.Api.Data;

public static class DataSeeder
{
    public static async Task SeedAsync(AppDbContext context)
    {
        // Seed Roles
        if (!await context.Roles.AnyAsync())
        {
            var roles = new List<Role>
            {
                new Role { Name = "Admin" },
                new Role { Name = "Customer" }
            };
            await context.Roles.AddRangeAsync(roles);
            await context.SaveChangesAsync();
            Console.WriteLine("Roles seeded successfully.");
        }

        // Seed Categories (if no book categories exist)
        if (!await context.Categories.AnyAsync(c => c.Type == "sach"))
        {
            var categories = new List<Category>
            {
                new Category { Name = "Sách Văn Học", Type = "sach", Description = "Tiểu thuyết, truyện ngắn, thơ..." },
                new Category { Name = "Sách Kinh Tế", Type = "sach", Description = "Kinh doanh, quản trị, tài chính..." },
                new Category { Name = "Sách Kỹ Năng", Type = "sach", Description = "Phát triển bản thân, kỹ năng sống..." },
                new Category { Name = "Sách Thiếu Nhi", Type = "sach", Description = "Truyện tranh, sách màu cho bé..." },
                new Category { Name = "Sách Ngoại Ngữ", Type = "sach", Description = "Từ điển, giáo trình tiếng Anh, Nhật, Trung..." },
                new Category { Name = "Văn Phòng Phẩm", Type = "vpp", Description = "Bút, thước, dụng cụ văn phòng..." },
                new Category { Name = "Đồ Chơi", Type = "do-choi", Description = "Lego, búp bê, đồ chơi giáo dục..." }
            };
            await context.Categories.AddRangeAsync(categories);
            await context.SaveChangesAsync();
            Console.WriteLine("Categories seeded successfully.");
        }

        // Seed Admin User
        if (!await context.Users.AnyAsync(u => u.Email == "admin@bookstore.com"))
        {
            var adminRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "Admin");
            var defaultCategory = await context.Categories.FirstOrDefaultAsync(); // Just to ensure categories exist

            if (adminRole != null)
            {
                var adminUser = new User
                {
                    FullName = "Administrator",
                    Email = "admin@bookstore.com",
                    PasswordHash = "Admin123", // In production, use hashed passwords
                    RoleId = adminRole.Id,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                await context.Users.AddAsync(adminUser);
                await context.SaveChangesAsync();
                Console.WriteLine("Admin user seeded successfully.");
            }
        }
    }
}
