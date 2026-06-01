using BookStore.Api.Models;

namespace BookStore.Api.Repositories;

public interface ISchoolSupplyRepository
{
    Task<List<SchoolSupply>> GetAllAsync();

    Task<SchoolSupply?> GetByIdAsync(int id);

    Task<SchoolSupply> CreateAsync(SchoolSupply schoolSupply);

    Task UpdateAsync(SchoolSupply schoolSupply);

    Task DeleteAsync(SchoolSupply schoolSupply);
}