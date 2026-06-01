using BookStore.Api.DTOs.Books;
using BookStore.Api.Models;
using BookStore.Api.Repositories;

namespace BookStore.Api.Services;

public class BookService : IBookService // Triển khai IBookService để quản lý nghiệp vụ liên quan đến sách
{
    private readonly IBookRepository _bookRepository; // Sử dụng IBookRepository để tương tác với dữ liệu sách
    private readonly ICategoryRepository _categoryRepository; // Sử dụng ICategoryRepository để tương tác với dữ liệu danh mục

    public BookService( // Khởi tạo BookService với IBookRepository và ICategoryRepository được tiêm vào qua Dependency Injection
        IBookRepository bookRepository,
        ICategoryRepository categoryRepository)
    {
        _bookRepository = bookRepository;
        _categoryRepository = categoryRepository;
    }

    public async Task<List<BookDto>> GetAllAsync() // Lấy tất cả các sách và ánh xạ chúng thành BookDto để trả về cho client
    {
        var books = await _bookRepository.GetAllAsync();

        return books.Select(MapToDto).ToList();
    }

    public async Task<BookDto?> GetByIdAsync(int id) // Lấy một sách theo ID, nếu không tìm thấy trả về null, nếu tìm thấy thì ánh xạ thành BookDto để trả về cho client
    {
        var book = await _bookRepository.GetByIdAsync(id);

        if (book == null)
        {
            return null;
        }

        return MapToDto(book);
    }

    public async Task<BookDto> CreateAsync(CreateBookDto request) // Thêm một sách mới dựa trên CreateBookDto, đảm bảo rằng danh mục tồn tại trước khi tạo sách, sau đó ánh xạ sách đã tạo thành BookDto để trả về cho client
    {
        await EnsureCategoryExistsAsync(request.CategoryId);

        var book = new Book
        {
            Title = request.Title.Trim(),
            Author = request.Author.Trim(),
            Publisher = request.Publisher?.Trim(),
            Description = request.Description?.Trim(),
            ImageUrl = request.ImageUrl?.Trim(),
            Price = request.Price,
            StockQuantity = request.StockQuantity,
            CategoryId = request.CategoryId,
            Status = request.Status.Trim(),
        };

        var createdBook = await _bookRepository.CreateAsync(book);

        return MapToDto(createdBook);
    }

    public async Task<bool> UpdateAsync(int id, UpdateBookDto request) // Cập nhật thông tin của một sách đã tồn tại dựa trên ID và UpdateBookDto, đảm bảo rằng sách tồn tại trước khi cập nhật, đảm bảo rằng danh mục tồn tại trước khi cập nhật, sau đó ánh xạ sách đã cập nhật thành BookDto để trả về cho client, trả về true nếu cập nhật thành công, false nếu không tìm thấy sách
    {
        var book = await _bookRepository.GetByIdAsync(id);

        if (book == null)
        {
            return false;
        }

        await EnsureCategoryExistsAsync(request.CategoryId);

        book.Title = request.Title.Trim();
        book.Author = request.Author.Trim();
        book.Publisher = request.Publisher?.Trim();
        book.Description = request.Description?.Trim();
        book.Price = request.Price;
        book.StockQuantity = request.StockQuantity;
        book.ImageUrl = request.ImageUrl?.Trim();
        book.CategoryId = request.CategoryId;
        book.UpdatedAt = DateTime.UtcNow;

        await _bookRepository.UpdateAsync(book);

        return true;
    }

    public async Task<bool> DeleteAsync(int id) // Xóa một sách khỏi cơ sở dữ liệu dựa trên ID, đảm bảo rằng sách tồn tại trước khi xóa, trả về true nếu xóa thành công, false nếu không tìm thấy sách
    {
        var book = await _bookRepository.GetByIdAsync(id);

        if (book == null)
        {
            return false;
        }

        await _bookRepository.DeleteAsync(book);

        return true;
    }

    private async Task EnsureCategoryExistsAsync(int categoryId) // Kiểm tra xem một danh mục có tồn tại trong cơ sở dữ liệu hay không dựa trên ID, nếu không tồn tại thì ném ra InvalidOperationException với thông báo lỗi chi tiết
    {
        var categoryExists = await _categoryRepository.ExistsAsync(categoryId);

        if (!categoryExists)
        {
            throw new InvalidOperationException($"Category with id {categoryId} was not found.");
        }
    }
    private static BookDto MapToDto(Book book)
    {
        return new BookDto
        {
            Id = book.Id,
            Title = book.Title,
            Author = book.Author,
            Description = book.Description,
            Price = book.Price,
            StockQuantity = book.StockQuantity,
            ImageUrl = book.ImageUrl,
            CategoryId = book.CategoryId,
            CategoryName = book.Category?.Name,
            Publisher = book.Publisher
        };
    }
}