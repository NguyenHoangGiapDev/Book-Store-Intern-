using BookStore.Api.DTOs.Souvenir;

namespace BookStore.Api.Services;

public interface ISouvenirService
{
    Task<List<SouvenirDto>> GetAllAsync();
    Task<SouvenirDto?> GetByIdAsync(int id);
    Task<SouvenirDto> CreateAsync(CreateSouvenirDto request);
    Task<bool> UpdateAsync(int id, UpdateSouvenirDto request);
    Task<bool> DeleteAsync(int id);
}
