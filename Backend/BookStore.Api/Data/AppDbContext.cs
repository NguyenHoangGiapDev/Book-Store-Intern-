    using BookStore.Api.Models;
    using Microsoft.EntityFrameworkCore;

    namespace BookStore.Api.Data;

    public class AppDbContext : DbContext
    {
        // Cấu hình DbContext để sử dụng với Entity Framework Core
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }
        // Định nghĩa các DbSet cho các thực thể trong ứng dụng để Entity Framework Core có thể quản lý và truy vấn dữ liệu từ cơ sở dữ liệu
        public DbSet<Book> Books => Set<Book>();

        public DbSet<Category> Categories => Set<Category>();

        public DbSet<User> Users => Set<User>();

        public DbSet<Role> Roles => Set<Role>();

        public DbSet<Cart> Carts => Set<Cart>();

        public DbSet<CartItem> CartItems => Set<CartItem>();

        public DbSet<Order> Orders => Set<Order>();

        public DbSet<OrderDetail> OrderDetails => Set<OrderDetail>();

        public DbSet<Payment> Payments => Set<Payment>();

        public DbSet<Stationery> Stationeries => Set<Stationery>();
        
        public DbSet<StationeryCategory> StationeryCategories { get; set; } = null!;
        public DbSet<ToyCategory> ToyCategories { get; set; } = null!;
        public DbSet<AccessoryCategory> AccessoryCategories { get; set; } = null!;
        public DbSet<SchoolSupplyCategory> SchoolSupplyCategories { get; set; } = null!;
        public DbSet<Toy> Toys { get; set; } = null!;
        public DbSet<SouvenirCategory> SouvenirCategories { get; set; } = null!;
        public DbSet<Accessory> Accessories { get; set; } = null!;
        public DbSet<Souvenir> Souvenirs { get; set; } = null!;

        public DbSet<SchoolSupply> SchoolSupplies { get; set; } = null!;
        public DbSet<BookCategory> BookCategories { get; set; } = null!;
        public DbSet<Promotion> Promotions { get; set; } = null!;
        public DbSet<DeliveryCategory> DeliveryCategories { get; set; } = null!;
        public DbSet<Review> Reviews { get; set; } = null!;
        public DbSet<ReportCategory> ReportCategories { get; set; } = null!;
        public DbSet<ContactMessage> ContactMessages { get; set; } = null!;
        public DbSet<AuthorCategory> AuthorCategories { get; set; } = null!;
        public DbSet<PublisherCategory> PublisherCategories { get; set; } = null!;
        public DbSet<BrandCategory> BrandCategories { get; set; } = null!;
        public DbSet<Manufacturer> Manufacturers { get; set; } = null!;
        public DbSet<RecruitmentApplication> RecruitmentApplications { get; set; } = null!;
        public DbSet<Shift> Shifts { get; set; } = null!;
        public DbSet<ShiftTransaction> ShiftTransactions { get; set; } = null!;

        private static void ConfigureToy(ModelBuilder modelBuilder)
{
    modelBuilder.Entity<Toy>(entity =>
    {
        entity.ToTable("Toys");

        entity.HasKey(t => t.Id);

        entity.Property(t => t.Id).HasColumnName("Id").ValueGeneratedOnAdd();
        entity.Property(t => t.Title).HasColumnName("Title").IsRequired().HasMaxLength(200);
        entity.Property(t => t.Brand).HasColumnName("Brand").IsRequired().HasMaxLength(150);
        entity.Property(t => t.Manufacturer).HasColumnName("Manufacturer").HasMaxLength(150);
        entity.Property(t => t.Description).HasColumnName("Description").HasColumnType("text");
        entity.Property(t => t.ImageUrl).HasColumnName("ImageUrl").HasColumnType("text");
        entity.Property(t => t.Price).HasColumnName("Price").HasColumnType("numeric(18,2)").IsRequired();
        entity.Property(t => t.StockQuantity).HasColumnName("StockQuantity").IsRequired();
        entity.Property(t => t.Status).HasColumnName("Status").HasMaxLength(50).HasDefaultValue("Available");
        entity.Property(t => t.CategoryId).HasColumnName("CategoryId").IsRequired();
        entity.Property(t => t.CreatedAt).HasColumnName("CreatedAt");
        entity.Property(t => t.UpdatedAt).HasColumnName("UpdatedAt");

        entity.HasOne(t => t.Category)
            .WithMany()
            .HasForeignKey(t => t.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);
    });
}

        // Cấu hình mô hình dữ liệu
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Gọi các phương thức cấu hình chi tiết cho từng thực thể
            ConfigureRole(modelBuilder);
            ConfigureBook(modelBuilder);
            ConfigureCategory(modelBuilder);
            ConfigureUser(modelBuilder);
            ConfigureOrder(modelBuilder);
            ConfigureOrderDetail(modelBuilder);
            ConfigurePayment(modelBuilder);
            ConfigureCart(modelBuilder);
            ConfigureCartItem(modelBuilder);
            ConfigureStationery(modelBuilder);
            ConfigureStationeryCategory(modelBuilder);
            ConfigureToyCategory(modelBuilder);
            ConfigureSouvenirCategory(modelBuilder);
            ConfigureAccessoryCategory(modelBuilder);
            ConfigureSchoolSupplyCategory(modelBuilder);

            // Cấu hình bảng cho các thực thể mới
            ConfigureToy(modelBuilder);
            modelBuilder.Entity<SchoolSupply>().ToTable("SchoolSupplies");
            modelBuilder.Entity<Accessory>().ToTable("Accessories");
            modelBuilder.Entity<Souvenir>(entity =>
            {
                entity.ToTable("Souvenirs");
                entity.HasOne(x => x.Category)
                    .WithMany()
                    .HasForeignKey(x => x.CategoryId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<BookCategory>(entity =>
            {
                entity.ToTable("BookCategories");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("Id");
                entity.Property(e => e.Name).HasColumnName("Name");
                entity.Property(e => e.Description).HasColumnName("Description");
                entity.Property(e => e.Type).HasColumnName("Type");
            });

            modelBuilder.Entity<Promotion>(entity =>
            {
                entity.ToTable("PromotionCategories");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("Id");
                entity.Property(e => e.Code).HasColumnName("Code");
                entity.Property(e => e.Name).HasColumnName("Name");
                entity.Property(e => e.DiscountPercent).HasColumnName("DiscountPercent");
                entity.Property(e => e.StartDate).HasColumnName("StartDate");
                entity.Property(e => e.EndDate).HasColumnName("EndDate");
                entity.Property(e => e.Description).HasColumnName("Description");
                entity.Property(e => e.IsActive).HasColumnName("IsActive");
            });

            modelBuilder.Entity<DeliveryCategory>(entity =>
            {
                entity.ToTable("DeliveryCategories");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("Id");
                entity.Property(e => e.OrderId).HasColumnName("OrderId");
                entity.Property(e => e.ReceiverName).HasColumnName("ReceiverName");
                entity.Property(e => e.ReceiverPhone).HasColumnName("ReceiverPhone");
                entity.Property(e => e.DeliveryAddress).HasColumnName("DeliveryAddress");
                entity.Property(e => e.DeliveryStatus).HasColumnName("DeliveryStatus");
                entity.Property(e => e.ShippedAt).HasColumnName("ShippedAt");
                entity.Property(e => e.DeliveredAt).HasColumnName("DeliveredAt");
                entity.Property(e => e.ShippingProvider).HasColumnName("ShippingProvider");
                entity.Property(e => e.CustomTotalAmount).HasColumnName("CustomTotalAmount").HasColumnType("numeric(18,2)");
            });

            modelBuilder.Entity<Review>(entity =>
            {
                entity.ToTable("ReviewCategories");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("Id");
                entity.Property(e => e.CustomerId).HasColumnName("CustomerId");
                entity.Property(e => e.CustomerName).HasColumnName("CustomerName").HasMaxLength(100);
                entity.Property(e => e.BookId).HasColumnName("BookId").IsRequired(false);
                entity.Property(e => e.ProductTitle).HasColumnName("ProductTitle").HasMaxLength(200);
                entity.Property(e => e.Rating).HasColumnName("Rating");
                entity.Property(e => e.Comment).HasColumnName("Comment");
                entity.Property(e => e.CreatedAt).HasColumnName("CreatedAt");
                entity.Property(e => e.Status).HasColumnName("Status");

                // CustomerId là số nguyên thuần, KHÔNG có FK constraint vào Users
                // Tránh lỗi FK violation khi userId không tồn tại trong DB
                entity.Ignore(e => e.Customer);

                // Make the relationship with Book optional
                entity.HasOne(e => e.Book)
                    .WithMany()
                    .HasForeignKey(e => e.BookId)
                    .IsRequired(false)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<ReportCategory>(entity =>
            {
                entity.ToTable("ReportCategories");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("Id");
                entity.Property(e => e.ReportCode).HasColumnName("ReportCode");
                entity.Property(e => e.ReportName).HasColumnName("ReportName");
                entity.Property(e => e.ReportType).HasColumnName("ReportType");
                entity.Property(e => e.PeriodType).HasColumnName("PeriodType");
                entity.Property(e => e.DateFrom).HasColumnName("DateFrom");
                entity.Property(e => e.DateTo).HasColumnName("DateTo");
                entity.Property(e => e.TotalRevenue).HasColumnName("TotalRevenue").HasColumnType("numeric(18,2)");
                entity.Property(e => e.TotalOrders).HasColumnName("TotalOrders");
                entity.Property(e => e.TotalCustomers).HasColumnName("TotalCustomers");
                entity.Property(e => e.TotalProducts).HasColumnName("TotalProducts");
                entity.Property(e => e.FileType).HasColumnName("FileType");
                entity.Property(e => e.FileUrl).HasColumnName("FileUrl");
                entity.Property(e => e.Status).HasColumnName("Status");
                entity.Property(e => e.CreatedBy).HasColumnName("CreatedBy");
                entity.Property(user => user.CreatedAt).HasColumnName("CreatedAt");
            });

            modelBuilder.Entity<ContactMessage>(entity =>
            {
                entity.ToTable("ContactMessages");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("Id");
                entity.Property(e => e.Name).HasColumnName("Name").HasMaxLength(100);
                entity.Property(e => e.Email).HasColumnName("Email").HasMaxLength(150);
                entity.Property(e => e.Phone).HasColumnName("Phone").HasMaxLength(20);
                entity.Property(e => e.Subject).HasColumnName("Subject").HasMaxLength(200);
                entity.Property(e => e.Message).HasColumnName("Message");
                entity.Property(e => e.SentAt).HasColumnName("SentAt");
                entity.Property(e => e.IsRead).HasColumnName("IsRead");
            });

            // Shift
            modelBuilder.Entity<Shift>(entity =>
            {
                entity.ToTable("Shifts");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.OpeningCash).HasColumnType("numeric(18,2)");
                entity.HasOne(e => e.Staff)
                    .WithMany()
                    .HasForeignKey(e => e.StaffId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // ShiftTransaction
            modelBuilder.Entity<ShiftTransaction>(entity =>
            {
                entity.ToTable("ShiftTransactions");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Type).HasMaxLength(10);
                entity.Property(e => e.Reason).HasMaxLength(300);
                entity.Property(e => e.Amount).HasColumnType("numeric(18,2)");
                entity.HasOne(e => e.Shift)
                    .WithMany(s => s.Transactions)
                    .HasForeignKey(e => e.ShiftId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }
        private static void ConfigureRole(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Role>(entity =>
            {
                entity.ToTable("Roles");

                entity.HasKey(role => role.Id);

                entity.Property(role => role.Name)
                    .IsRequired()
                    .HasMaxLength(50);
            });
        }
        // Cấu hình chi tiết cho bảng Books
        private static void ConfigureBook(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Book>(entity =>
            {
                entity.ToTable("Books");

                entity.HasKey(book => book.Id);

                entity.Property(book => book.Title)
                    .IsRequired()
                    .HasMaxLength(200);

                entity.Property(book => book.Author)
                    .IsRequired()
                    .HasMaxLength(150);

                entity.Property(book => book.Description)
                    .HasColumnType("text");

                entity.Property(book => book.Price)
                    .HasColumnType("numeric(18,2)")
                    .IsRequired();

                entity.Property(book => book.StockQuantity)
                    .IsRequired();

                entity.Property(book => book.ImageUrl)
                    .HasColumnName("ImageUrl")
                    .HasColumnType("text");

                entity.HasOne(book => book.Category)
                    .WithMany(category => category.Books)
                    .HasForeignKey(book => book.CategoryId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
        }
    // Cấu hình chi tiết cho bảng Categories
        private static void ConfigureCategory(ModelBuilder modelBuilder)
{
    modelBuilder.Entity<Category>(entity =>
    {
        entity.ToTable("Categories");

        entity.HasKey(category => category.Id);

        entity.Property(category => category.Id)
            .HasColumnName("Id")
            .ValueGeneratedOnAdd();

        entity.Property(category => category.Name)
            .HasColumnName("Name")
            .IsRequired()
            .HasMaxLength(100);

        entity.Property(category => category.Description)
            .HasColumnName("Description")
            .HasMaxLength(500);

        entity.Property(category => category.Type)
            .HasColumnName("Type")
            .HasDefaultValue("sach");

        entity.Property(category => category.CreatedAt)
            .HasColumnName("CreatedAt");

        entity.Property(category => category.UpdatedAt)
            .HasColumnName("UpdatedAt");
    });
}
        // Cấu hình payment 
        private static void ConfigurePayment(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Payment>(entity =>
            {
                entity.ToTable("Payments");

                entity.HasKey(payment => payment.Id);

                entity.Property(payment => payment.Amount)
                    .HasColumnType("numeric(18,2)")
                    .IsRequired();

                entity.Property(payment => payment.PaymentMethod)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(payment => payment.Status)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.HasOne(payment => payment.Order)
                    .WithOne(order => order.Payment)
                    .HasForeignKey<Payment>(payment => payment.OrderId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }
        // Cấu hình Cart
        private static void ConfigureCart(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Cart>(entity =>
            {
                entity.ToTable("Carts");

                entity.HasKey(cart => cart.Id);

                entity.HasOne(cart => cart.User)
                    .WithOne(user => user.Cart)
                    .HasForeignKey<Cart>(cart => cart.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }
        // Cấu hình CartItem
        private static void ConfigureCartItem(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<CartItem>(entity =>
            {
                entity.ToTable("CartItems");

                entity.HasKey(cartItem => cartItem.Id);

                entity.Property(cartItem => cartItem.UnitPrice)
                    .HasColumnType("numeric(18,2)")
                    .IsRequired();

                entity.Property(cartItem => cartItem.Quantity)
                    .IsRequired();

                entity.HasOne(cartItem => cartItem.Cart)
                    .WithMany(cart => cart.CartItems)
                    .HasForeignKey(cartItem => cartItem.CartId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(cartItem => cartItem.Book)
                    .WithMany(book => book.CartItems)
                    .HasForeignKey(cartItem => cartItem.BookId)
                    .IsRequired(false)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(cartItem => cartItem.Toy)
                    .WithMany()
                    .HasForeignKey(cartItem => cartItem.ToyId)
                    .IsRequired(false)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(cartItem => cartItem.Stationery)
                    .WithMany()
                    .HasForeignKey(cartItem => cartItem.StationeryId)
                    .IsRequired(false)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(cartItem => cartItem.SchoolSupply)
                    .WithMany()
                    .HasForeignKey(cartItem => cartItem.SchoolSupplyId)
                    .IsRequired(false)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(cartItem => cartItem.Accessory)
                    .WithMany()
                    .HasForeignKey(cartItem => cartItem.AccessoryId)
                    .IsRequired(false)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(cartItem => cartItem.Souvenir)
                    .WithMany()
                    .HasForeignKey(cartItem => cartItem.SouvenirId)
                    .IsRequired(false)
                    .OnDelete(DeleteBehavior.Restrict);
            });
        }
        // Cấu hình OrderDetail
        private static void ConfigureOrderDetail(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<OrderDetail>(entity =>
            {
                entity.ToTable("OrderDetails");

                entity.HasKey(orderDetail => orderDetail.Id);

                entity.Property(orderDetail => orderDetail.UnitPrice)
                    .HasColumnType("numeric(18,2)")
                    .IsRequired();

                entity.Property(orderDetail => orderDetail.TotalPrice)
                    .HasColumnType("numeric(18,2)")
                    .IsRequired();

                entity.Property(orderDetail => orderDetail.Quantity)
                    .IsRequired();

                entity.HasOne(orderDetail => orderDetail.Order)
                    .WithMany(order => order.OrderDetails)
                    .HasForeignKey(orderDetail => orderDetail.OrderId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(orderDetail => orderDetail.Book)
                    .WithMany(book => book.OrderDetails)
                    .HasForeignKey(orderDetail => orderDetail.BookId)
                    .IsRequired(false)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(orderDetail => orderDetail.Toy)
                    .WithMany()
                    .HasForeignKey(orderDetail => orderDetail.ToyId)
                    .IsRequired(false)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(orderDetail => orderDetail.Stationery)
                    .WithMany()
                    .HasForeignKey(orderDetail => orderDetail.StationeryId)
                    .IsRequired(false)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(orderDetail => orderDetail.SchoolSupply)
                    .WithMany()
                    .HasForeignKey(orderDetail => orderDetail.SchoolSupplyId)
                    .IsRequired(false)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(orderDetail => orderDetail.Accessory)
                    .WithMany()
                    .HasForeignKey(orderDetail => orderDetail.AccessoryId)
                    .IsRequired(false)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(orderDetail => orderDetail.Souvenir)
                    .WithMany()
                    .HasForeignKey(orderDetail => orderDetail.SouvenirId)
                    .IsRequired(false)
                    .OnDelete(DeleteBehavior.Restrict);
            });
        }
        // cấu hình user
        private static void ConfigureUser(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>(entity =>
            {
                entity.ToTable("Users");

                entity.HasKey(user => user.Id);

                entity.Property(user => user.FullName)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(user => user.Email)
                    .IsRequired()
                    .HasMaxLength(150);

                entity.Property(user => user.PasswordHash)
                    .IsRequired();

                entity.Property(user => user.PhoneNumber)
                    .HasMaxLength(20);

                entity.Property(user => user.Address)
                    .HasMaxLength(255);

                entity.HasOne(user => user.Role)
                    .WithMany(role => role.Users)
                    .HasForeignKey(user => user.RoleId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
        }
        // Cấu hình Stationery
        private static void ConfigureStationery(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Stationery>(entity =>
            {
                entity.ToTable("Stationeries");

                entity.HasKey(s => s.Id);

                entity.Property(s => s.Title)
                    .IsRequired()
                    .HasMaxLength(200);

                entity.Property(s => s.Brand)
                    .IsRequired()
                    .HasMaxLength(150);

                entity.Property(s => s.Manufacturer)
                    .HasMaxLength(150);

                entity.Property(s => s.Description)
                    .HasColumnType("text");

                entity.Property(s => s.Price)
                    .HasColumnType("numeric(18,2)")
                    .IsRequired();

                entity.Property(s => s.StockQuantity)
                    .IsRequired();

                entity.Property(s => s.ImageUrl)
                    .HasColumnName("ImageUrl")
                    .HasColumnType("text");

                entity.HasOne(s => s.Category)
                    .WithMany()
                    .HasForeignKey(s => s.CategoryId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
        }
        // Cấu hình Order
        private static void ConfigureOrder(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Order>(entity =>
            {
                entity.ToTable("Orders");

                entity.HasKey(order => order.Id);

                entity.Property(order => order.TotalAmount)
                    .HasColumnType("numeric(18,2)")
                    .IsRequired();

                entity.Property(order => order.Status)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(order => order.OrderType)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.HasOne(order => order.User)
                    .WithMany(user => user.Orders)
                    .HasForeignKey(order => order.UserId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
        }

        // Cấu hình StationeryCategory
        private static void ConfigureStationeryCategory(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<StationeryCategory>(entity =>
            {
                entity.ToTable("StationeryCategories");

                entity.HasKey(e => e.Id);

                entity.Property(e => e.Id).HasColumnName("Id").ValueGeneratedOnAdd();
                entity.Property(e => e.Name).HasColumnName("Name").IsRequired().HasMaxLength(100);
                entity.Property(e => e.Description).HasColumnName("Description").HasMaxLength(500);
                entity.Property(e => e.CreatedAt).HasColumnName("CreatedAt");
                entity.Property(e => e.UpdatedAt).HasColumnName("UpdatedAt");
            });
        }

        // Cấu hình ToyCategory
        private static void ConfigureToyCategory(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<ToyCategory>(entity =>
            {
                entity.ToTable("ToyCategories");

                entity.HasKey(e => e.Id);

                entity.Property(e => e.Id).HasColumnName("Id").ValueGeneratedOnAdd();
                entity.Property(e => e.Name).HasColumnName("Name").IsRequired().HasMaxLength(100);
                entity.Property(e => e.Description).HasColumnName("Description").HasMaxLength(500);
                entity.Property(e => e.CreatedAt).HasColumnName("CreatedAt");
                entity.Property(e => e.UpdatedAt).HasColumnName("UpdatedAt");
            });
        }

        // Cấu hình SouvenirCategory
        private static void ConfigureSouvenirCategory(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<SouvenirCategory>(entity =>
            {
                entity.ToTable("SouvenirCategories");

                entity.HasKey(e => e.Id);

                entity.Property(e => e.Id).HasColumnName("Id").ValueGeneratedOnAdd();
                entity.Property(e => e.Name).HasColumnName("Name").IsRequired().HasMaxLength(100);
                entity.Property(e => e.Description).HasColumnName("Description").HasMaxLength(500);
                entity.Property(e => e.CreatedAt).HasColumnName("CreatedAt");
                entity.Property(e => e.UpdatedAt).HasColumnName("UpdatedAt");
            });
        }

        // Cấu hình AccessoryCategory
        private static void ConfigureAccessoryCategory(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<AccessoryCategory>(entity =>
            {
                entity.ToTable("AccessoryCategories");

                entity.HasKey(e => e.Id);

                entity.Property(e => e.Id).HasColumnName("Id").ValueGeneratedOnAdd();
                entity.Property(e => e.Name).HasColumnName("Name").IsRequired().HasMaxLength(100);
                entity.Property(e => e.Description).HasColumnName("Description").HasMaxLength(500);
                entity.Property(e => e.CreatedAt).HasColumnName("CreatedAt");
                entity.Property(e => e.UpdatedAt).HasColumnName("UpdatedAt");
            });
        }

        // Cấu hình SchoolSupplyCategory
        private static void ConfigureSchoolSupplyCategory(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<SchoolSupplyCategory>(entity =>
            {
                entity.ToTable("SchoolSupplyCategories");

                entity.HasKey(e => e.Id);

                entity.Property(e => e.Id).HasColumnName("Id").ValueGeneratedOnAdd();
                entity.Property(e => e.Name).HasColumnName("Name").IsRequired().HasMaxLength(100);
                entity.Property(e => e.Description).HasColumnName("Description").HasMaxLength(500);
                entity.Property(e => e.CreatedAt).HasColumnName("CreatedAt");
                entity.Property(e => e.UpdatedAt).HasColumnName("UpdatedAt");
            });
        }

    }