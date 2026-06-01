using BookStore.Api.DTOs.Books;

namespace BookStore.Api.Services;

public interface IBookService
{
    Task<List<BookDto>> GetAllAsync();

    Task<BookDto?> GetByIdAsync(int id);

    Task<BookDto> CreateAsync(CreateBookDto request);

    Task<bool> UpdateAsync(int id, UpdateBookDto request);

    Task<bool> DeleteAsync(int id);
}