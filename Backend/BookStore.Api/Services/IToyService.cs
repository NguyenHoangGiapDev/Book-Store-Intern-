using BookStore.Api.DTOs.Toy;

namespace BookStore.Api.Services;

public interface IToyService
{
    Task<List<ToyDto>> GetAllAsync();

    Task<ToyDto?> GetByIdAsync(int id);

    Task<ToyDto> CreateAsync(CreateToyDto request);

    Task<bool> UpdateAsync(int id, UpdateToyDto request);

    Task<bool> DeleteAsync(int id);
}