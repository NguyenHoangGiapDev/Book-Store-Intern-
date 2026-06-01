using BookStore.Api.DTOs.Carts;
using BookStore.Api.Models;
using BookStore.Api.Repositories;

namespace BookStore.Api.Services;

public class CartService : ICartService
{
    private readonly ICartRepository _cartRepository;
    private readonly IUserRepository _userRepository;
    private readonly IBookRepository _bookRepository;
    private readonly IToyRepository _toyRepository;
    private readonly IStationeryRepository _stationeryRepository;
    private readonly ISchoolSupplyRepository _schoolSupplyRepository;
    private readonly IAccessoryRepository _accessoryRepository;
    private readonly ISouvenirRepository _souvenirRepository;

    public CartService(
        ICartRepository cartRepository,
        IUserRepository userRepository,
        IBookRepository bookRepository,
        IToyRepository toyRepository,
        IStationeryRepository stationeryRepository,
        ISchoolSupplyRepository schoolSupplyRepository,
        IAccessoryRepository accessoryRepository,
        ISouvenirRepository souvenirRepository)
    {
        _cartRepository = cartRepository;
        _userRepository = userRepository;
        _bookRepository = bookRepository;
        _toyRepository = toyRepository;
        _stationeryRepository = stationeryRepository;
        _schoolSupplyRepository = schoolSupplyRepository;
        _accessoryRepository = accessoryRepository;
        _souvenirRepository = souvenirRepository;
    }

    public async Task<CartDto> GetOrCreateCartAsync(int userId)
    {
        var userExists = await _userRepository.ExistsAsync(userId);
        if (!userExists)
        {
            throw new InvalidOperationException($"User with id {userId} was not found.");
        }

        var cart = await _cartRepository.GetByUserIdAsync(userId);
        if (cart != null)
        {
            return MapToDto(cart);
        }

        cart = new Cart { UserId = userId };
        var createdCart = await _cartRepository.CreateAsync(cart);
        var fullCart = await _cartRepository.GetByIdAsync(createdCart.Id);
        return MapToDto(fullCart!);
    }

    public async Task<CartDto> AddItemAsync(AddCartItemDto request)
    {
        var userExists = await _userRepository.ExistsAsync(request.UserId);
        if (!userExists)
        {
            throw new InvalidOperationException($"User with id {request.UserId} was not found.");
        }

        // Determine product and price
        string title = "";
        decimal price = 0;
        int stock = 0;

        if (request.BookId.HasValue)
        {
            var p = await _bookRepository.GetByIdAsync(request.BookId.Value);
            if (p == null) throw new InvalidOperationException("Book not found.");
            title = p.Title; price = p.Price; stock = p.StockQuantity;
        }
        else if (request.ToyId.HasValue)
        {
            var p = await _toyRepository.GetByIdAsync(request.ToyId.Value);
            if (p == null) throw new InvalidOperationException("Toy not found.");
            title = p.Title; price = p.Price; stock = p.StockQuantity;
        }
        else if (request.StationeryId.HasValue)
        {
            var p = await _stationeryRepository.GetByIdAsync(request.StationeryId.Value);
            if (p == null) throw new InvalidOperationException("Stationery not found.");
            title = p.Title; price = p.Price; stock = p.StockQuantity;
        }
        else if (request.SchoolSupplyId.HasValue)
        {
            var p = await _schoolSupplyRepository.GetByIdAsync(request.SchoolSupplyId.Value);
            if (p == null) throw new InvalidOperationException("School supply not found.");
            title = p.Title; price = p.Price; stock = p.StockQuantity;
        }
        else if (request.AccessoryId.HasValue)
        {
            var p = await _accessoryRepository.GetByIdAsync(request.AccessoryId.Value);
            if (p == null) throw new InvalidOperationException("Accessory not found.");
            title = p.Title; price = p.Price; stock = p.StockQuantity;
        }
        else if (request.SouvenirId.HasValue)
        {
            var p = await _souvenirRepository.GetByIdAsync(request.SouvenirId.Value);
            if (p == null) throw new InvalidOperationException("Souvenir not found.");
            title = p.Title; price = p.Price; stock = p.StockQuantity;
        }
        else
        {
            throw new InvalidOperationException("No product ID provided.");
        }

        if (request.Quantity > stock)
        {
            throw new InvalidOperationException($"Product '{title}' does not have enough stock.");
        }

        var cart = await _cartRepository.GetByUserIdAsync(request.UserId);
        if (cart == null)
        {
            cart = new Cart { UserId = request.UserId };
            cart = await _cartRepository.CreateAsync(cart);
            cart = await _cartRepository.GetByIdAsync(cart.Id);
        }

        // Check if item exists in cart
        var existingItem = cart!.CartItems.FirstOrDefault(item =>
            (request.BookId.HasValue && item.BookId == request.BookId) ||
            (request.ToyId.HasValue && item.ToyId == request.ToyId) ||
            (request.StationeryId.HasValue && item.StationeryId == request.StationeryId) ||
            (request.SchoolSupplyId.HasValue && item.SchoolSupplyId == request.SchoolSupplyId) ||
            (request.AccessoryId.HasValue && item.AccessoryId == request.AccessoryId) ||
            (request.SouvenirId.HasValue && item.SouvenirId == request.SouvenirId)
        );

        if (existingItem == null)
        {
            cart.CartItems.Add(new CartItem
            {
                BookId = request.BookId,
                ToyId = request.ToyId,
                StationeryId = request.StationeryId,
                SchoolSupplyId = request.SchoolSupplyId,
                AccessoryId = request.AccessoryId,
                SouvenirId = request.SouvenirId,
                Quantity = request.Quantity,
                UnitPrice = price
            });
        }
        else
        {
            existingItem.Quantity += request.Quantity;
            existingItem.UnitPrice = price;
        }

        await _cartRepository.UpdateAsync(cart);
        var updatedCart = await _cartRepository.GetByUserIdAsync(request.UserId);
        return MapToDto(updatedCart!);
    }

    public async Task<bool> UpdateItemAsync(int userId, int cartItemId, UpdateCartItemDto request)
    {
        var cart = await _cartRepository.GetByUserIdAsync(userId);
        if (cart == null) return false;

        var item = cart.CartItems.FirstOrDefault(i => i.Id == cartItemId);
        if (item == null) return false;

        item.Quantity = request.Quantity;
        await _cartRepository.UpdateAsync(cart);
        return true;
    }

    public async Task<bool> RemoveItemAsync(int userId, int cartItemId)
    {
        var cart = await _cartRepository.GetByUserIdAsync(userId);
        if (cart == null) return false;

        var item = cart.CartItems.FirstOrDefault(i => i.Id == cartItemId);
        if (item == null) return false;

        cart.CartItems.Remove(item);
        await _cartRepository.UpdateAsync(cart);
        return true;
    }

    public async Task<bool> ClearCartAsync(int userId)
    {
        var cart = await _cartRepository.GetByUserIdAsync(userId);
        if (cart == null) return false;

        cart.CartItems.Clear();
        await _cartRepository.UpdateAsync(cart);
        return true;
    }

    private static CartDto MapToDto(Cart cart)
    {
        var items = cart.CartItems.Select(item => {
            string title = "Sản phẩm";
            string? imageUrl = null;

            if (item.Book != null) { title = item.Book.Title; imageUrl = item.Book.ImageUrl; }
            else if (item.Toy != null) { title = item.Toy.Title; imageUrl = item.Toy.ImageUrl; }
            else if (item.Stationery != null) { title = item.Stationery.Title; imageUrl = item.Stationery.ImageUrl; }
            else if (item.SchoolSupply != null) { title = item.SchoolSupply.Title; imageUrl = item.SchoolSupply.ImageUrl; }
            else if (item.Accessory != null) { title = item.Accessory.Title; imageUrl = item.Accessory.ImageUrl; }
            else if (item.Souvenir != null) { title = item.Souvenir.Title; imageUrl = item.Souvenir.ImageUrl; }

            return new CartItemDto
            {
                Id = item.Id,
                BookId = item.BookId,
                ToyId = item.ToyId,
                StationeryId = item.StationeryId,
                SchoolSupplyId = item.SchoolSupplyId,
                AccessoryId = item.AccessoryId,
                SouvenirId = item.SouvenirId,
                ProductTitle = title,
                ProductImageUrl = imageUrl,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                TotalPrice = item.UnitPrice * item.Quantity
            };
        }).ToList();

        return new CartDto
        {
            Id = cart.Id,
            UserId = cart.UserId,
            CustomerName = cart.User?.FullName,
            CreatedAt = cart.CreatedAt,
            Items = items,
            TotalAmount = items.Sum(item => item.TotalPrice)
        };
    }
}