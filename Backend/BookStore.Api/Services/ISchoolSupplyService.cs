using BookStore.Api.DTOs.SchoolSupply;

namespace BookStore.Api.Services;

public interface ISchoolSupplyService
{
    Task<List<SchoolSupplyDto>> GetAllAsync();

    Task<SchoolSupplyDto?> GetByIdAsync(int id);

    Task<SchoolSupplyDto> CreateAsync(CreateSchoolSupplyDto request);

    Task<bool> UpdateAsync(int id, UpdateSchoolSupplyDto request);

    Task<bool> DeleteAsync(int id);
}