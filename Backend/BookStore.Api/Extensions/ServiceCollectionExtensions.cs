using BookStore.Api.Data;
using BookStore.Api.Repositories;
using BookStore.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace BookStore.Api.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddDatabaseConfig(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddDbContext<AppDbContext>(options =>
        {
            options.UseNpgsql(
                configuration.GetConnectionString("DefaultConnection"),
                npgsqlOptions =>
                {
                    npgsqlOptions.MigrationsHistoryTable("EFMigrationsHistory");
                }
            );
        });

        return services;
    }

    public static IServiceCollection AddRepositoryConfig(this IServiceCollection services)
    {
        services.AddScoped<IAccessoryRepository, AccessoryRepository>();
        services.AddScoped<IBookRepository, BookRepository>();
        services.AddScoped<ICartRepository, CartRepository>();
        services.AddScoped<ICategoryRepository, CategoryRepository>();
        services.AddScoped<IOrderRepository, OrderRepository>();
        services.AddScoped<IPaymentRepository, PaymentRepository>();
        services.AddScoped<IRoleRepository, RoleRepository>();
        services.AddScoped<ISchoolSupplyRepository, SchoolSupplyRepository>();
        services.AddScoped<ISouvenirRepository, SouvenirRepository>();
        services.AddScoped<IStationeryRepository, StationeryRepository>();
        services.AddScoped<IToyRepository, ToyRepository>();
        services.AddScoped<IUserRepository, UserRepository>();

        return services;
    }

    public static IServiceCollection AddServiceConfig(this IServiceCollection services)
    {
        services.AddScoped<IAccessoryService, AccessoryService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IEmailService, EmailService>();
        services.AddScoped<IBookService, BookService>();
        services.AddScoped<ICartService, CartService>();
        services.AddScoped<ICategoryService, CategoryService>();
        services.AddScoped<IOrderService, OrderService>();
        services.AddScoped<IPaymentService, PaymentService>();
        services.AddScoped<IRoleService, RoleService>();
        services.AddScoped<ISchoolSupplyService, SchoolSupplyService>();
        services.AddScoped<ISouvenirService, SouvenirService>();
        services.AddScoped<IStationeryService, StationeryService>();
        services.AddScoped<IToyService, ToyService>();
        services.AddScoped<IUserService, UserService>();

        return services;
    }
}