using BookStore.Api.DTOs.Orders;
using BookStore.Api.Models;
using BookStore.Api.Repositories;

namespace BookStore.Api.Services;

public class OrderService : IOrderService
{
    private readonly IOrderRepository _orderRepository;
    private readonly IUserRepository _userRepository;
    private readonly IBookRepository _bookRepository;
    private readonly IToyRepository _toyRepository;
    private readonly IStationeryRepository _stationeryRepository;
    private readonly ISchoolSupplyRepository _schoolSupplyRepository;
    private readonly IAccessoryRepository _accessoryRepository;
    private readonly ISouvenirRepository _souvenirRepository;

    public OrderService(
        IOrderRepository orderRepository,
        IUserRepository userRepository,
        IBookRepository bookRepository,
        IToyRepository toyRepository,
        IStationeryRepository stationeryRepository,
        ISchoolSupplyRepository schoolSupplyRepository,
        IAccessoryRepository accessoryRepository,
        ISouvenirRepository souvenirRepository)
    {
        _orderRepository = orderRepository;
        _userRepository = userRepository;
        _bookRepository = bookRepository;
        _toyRepository = toyRepository;
        _stationeryRepository = stationeryRepository;
        _schoolSupplyRepository = schoolSupplyRepository;
        _accessoryRepository = accessoryRepository;
        _souvenirRepository = souvenirRepository;
    }

    public async Task<List<OrderDto>> GetAllAsync()
    {
        var orders = await _orderRepository.GetAllAsync();
        var tasks = orders.Select(o => MapToDtoAsync(o));
        return (await Task.WhenAll(tasks)).ToList();
    }

    public async Task<OrderDto?> GetByIdAsync(int id)
    {
        var order = await _orderRepository.GetByIdAsync(id);
        return order != null ? await MapToDtoAsync(order) : null;
    }

    public async Task<List<OrderDto>> GetByUserIdAsync(int userId)
    {
        var orders = await _orderRepository.GetByUserIdAsync(userId);
        var tasks = orders.Select(o => MapToDtoAsync(o));
        return (await Task.WhenAll(tasks)).ToList();
    }

    public async Task<OrderDto> CreateAsync(CreateOrderDto request)
    {
        var orderDetails = new List<OrderDetail>();
        decimal totalAmount = 0;

        foreach (var item in request.Items)
        {
            decimal price = 0;
            if (item.BookId.HasValue) price = (await _bookRepository.GetByIdAsync(item.BookId.Value))?.Price ?? 0;
            else if (item.ToyId.HasValue) price = (await _toyRepository.GetByIdAsync(item.ToyId.Value))?.Price ?? 0;
            else if (item.StationeryId.HasValue) price = (await _stationeryRepository.GetByIdAsync(item.StationeryId.Value))?.Price ?? 0;
            else if (item.SchoolSupplyId.HasValue) price = (await _schoolSupplyRepository.GetByIdAsync(item.SchoolSupplyId.Value))?.Price ?? 0;
            else if (item.AccessoryId.HasValue) price = (await _accessoryRepository.GetByIdAsync(item.AccessoryId.Value))?.Price ?? 0;
            else if (item.SouvenirId.HasValue) price = (await _souvenirRepository.GetByIdAsync(item.SouvenirId.Value))?.Price ?? 0;

            var detail = new OrderDetail
            {
                BookId = item.BookId,
                ToyId = item.ToyId,
                StationeryId = item.StationeryId,
                SchoolSupplyId = item.SchoolSupplyId,
                AccessoryId = item.AccessoryId,
                SouvenirId = item.SouvenirId,
                Quantity = item.Quantity,
                UnitPrice = price,
                TotalPrice = price * item.Quantity
            };
            orderDetails.Add(detail);
            totalAmount += detail.TotalPrice;
        }

        var order = new Order
        {
            UserId = request.UserId,
            OrderDate = DateTime.UtcNow,
            TotalAmount = totalAmount,
            Status = "Đơn mới",
            OrderType = request.OrderType,
            CustomerName = request.CustomerName,
            Phone = request.Phone,
            Address = request.Address,
            OrderDetails = orderDetails,

            ShippingStatus = "Chưa giao vận",
            PaymentStatus = "Chưa thanh toán",
            CodStatus = "Không áp dụng",
            Issue = "Không có",
        };

        var createdOrder = await _orderRepository.CreateAsync(order);
        var fullOrder = await _orderRepository.GetByIdAsync(createdOrder.Id);
        return await MapToDtoAsync(fullOrder!);
    }

    public async Task<bool> UpdateStatusAsync(int id, UpdateOrderStatusDto request)
    {
        var order = await _orderRepository.GetByIdAsync(id);
        if (order == null) return false;

        order.Status = request.Status;
        await _orderRepository.UpdateAsync(order);
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var order = await _orderRepository.GetByIdAsync(id);
        if (order == null) return false;

        await _orderRepository.DeleteAsync(order);
        return true;
    }

    private async Task<OrderDto> MapToDtoAsync(Order order)
    {
        var detailTasks = order.OrderDetails.Select(async detail => {
            string title = "Sản phẩm";
            string? imageUrl = null;

            // Priority 1: Navigation Property (Eager Loaded)
            if (detail.Book != null) { title = detail.Book.Title; imageUrl = detail.Book.ImageUrl; }
            else if (detail.Toy != null) { title = detail.Toy.Title; imageUrl = detail.Toy.ImageUrl; }
            else if (detail.Stationery != null) { title = detail.Stationery.Title; imageUrl = detail.Stationery.ImageUrl; }
            else if (detail.SchoolSupply != null) { title = detail.SchoolSupply.Title; imageUrl = detail.SchoolSupply.ImageUrl; }
            else if (detail.Accessory != null) { title = detail.Accessory.Title; imageUrl = detail.Accessory.ImageUrl; }
            else if (detail.Souvenir != null) { title = detail.Souvenir.Title; imageUrl = detail.Souvenir.ImageUrl; }
            
            // Priority 2: Manual Fetch if Image is still null but ID exists
            if (string.IsNullOrEmpty(imageUrl))
            {
                if (detail.BookId.HasValue) 
                { 
                    var b = await _bookRepository.GetByIdAsync(detail.BookId.Value); 
                    if (b != null) { title = b.Title; imageUrl = b.ImageUrl; }
                }
                else if (detail.ToyId.HasValue)
                {
                    var t = await _toyRepository.GetByIdAsync(detail.ToyId.Value);
                    if (t != null) { title = t.Title; imageUrl = t.ImageUrl; }
                }
                else if (detail.StationeryId.HasValue)
                {
                    var s = await _stationeryRepository.GetByIdAsync(detail.StationeryId.Value);
                    if (s != null) { title = s.Title; imageUrl = s.ImageUrl; }
                }
                else if (detail.SchoolSupplyId.HasValue)
                {
                    var s = await _schoolSupplyRepository.GetByIdAsync(detail.SchoolSupplyId.Value);
                    if (s != null) { title = s.Title; imageUrl = s.ImageUrl; }
                }
                else if (detail.AccessoryId.HasValue)
                {
                    var a = await _accessoryRepository.GetByIdAsync(detail.AccessoryId.Value);
                    if (a != null) { title = a.Title; imageUrl = a.ImageUrl; }
                }
                else if (detail.SouvenirId.HasValue)
                {
                    var s = await _souvenirRepository.GetByIdAsync(detail.SouvenirId.Value);
                    if (s != null) { title = s.Title; imageUrl = s.ImageUrl; }
                }
            }

            return new OrderDetailDto
            {
                Id = detail.Id,
                BookId = detail.BookId,
                ToyId = detail.ToyId,
                StationeryId = detail.StationeryId,
                SchoolSupplyId = detail.SchoolSupplyId,
                AccessoryId = detail.AccessoryId,
                SouvenirId = detail.SouvenirId,
                ProductTitle = title,
                ProductImageUrl = imageUrl,
                Quantity = detail.Quantity,
                UnitPrice = detail.UnitPrice,
                TotalPrice = detail.TotalPrice
            };
        });

        var details = await Task.WhenAll(detailTasks);

        return new OrderDto
        {
            Id = order.Id,
            UserId = order.UserId,
            StaffName = (order.OrderType == "Tại quầy" || order.OrderType == "Offline") ? (!string.IsNullOrWhiteSpace(order.User?.FullName) ? order.User.FullName : order.User?.Email) : null,
            CustomerName = order.CustomerName ?? (!string.IsNullOrWhiteSpace(order.User?.FullName) ? order.User.FullName : order.User?.Email),
            Phone = order.Phone,
            Address = order.Address,
            OrderDate = order.OrderDate,
            TotalAmount = order.TotalAmount,
            Status = order.Status,
            OrderType = order.OrderType,

            ShippingStatus = order.ShippingStatus,
            PaymentStatus = order.PaymentStatus,
            CodStatus = order.CodStatus,
            Issue = order.Issue,

            OrderDetails = details.ToList()
            };
    }
    public async Task<bool> StaffUpdateAsync(int id, StaffUpdateOrderDto request)
    {
        var order = await _orderRepository.GetByIdAsync(id);

        if (order == null)
        {
            return false;
        }

        if (request.CustomerName != null)
        {
            order.CustomerName = request.CustomerName;
        }

        if (request.Phone != null)
        {
            order.Phone = request.Phone;
        }

        if (request.Address != null)
        {
            order.Address = request.Address;
        }

        if (!string.IsNullOrWhiteSpace(request.OrderStatus))
        {
            order.Status = request.OrderStatus;
        }

        if (!string.IsNullOrWhiteSpace(request.ShippingStatus))
        {
            order.ShippingStatus = request.ShippingStatus;
        }

        if (!string.IsNullOrWhiteSpace(request.PaymentStatus))
        {
            order.PaymentStatus = request.PaymentStatus;
        }

        if (!string.IsNullOrWhiteSpace(request.CodStatus))
        {
            order.CodStatus = request.CodStatus;
        }

        if (!string.IsNullOrWhiteSpace(request.Issue))
        {
            order.Issue = request.Issue;
        }

        await _orderRepository.UpdateAsync(order);

        return true;
    }
}