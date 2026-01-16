using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories;

public interface IRegulationRepository : IRepository<Regulation>
{
    Task<List<Regulation>> SearchFullTextAsync(string searchTerm, string? category = null);
    Task<List<Regulation>> GetActiveRegulationsAsync(string? category = null);
}

public class RegulationRepository : Repository<Regulation>, IRegulationRepository
{
    public RegulationRepository(ApplicationDbContext context) : base(context)
    {
    }

    /// <summary>
    /// Tìm kiếm Regulations sử dụng Full-Text Search
    /// </summary>
    public async Task<List<Regulation>> SearchFullTextAsync(string searchTerm, string? category = null)
    {
        if (string.IsNullOrWhiteSpace(searchTerm))
        {
            return await GetActiveRegulationsAsync(category);
        }

        var query = _context.Regulations
            .FromSqlRaw(@"
                SELECT * FROM regulations
                WHERE is_active = 1
                AND CONTAINS((title, content), {0})
                ORDER BY effective_date DESC, id
            ", searchTerm)
            .AsNoTracking();

        if (!string.IsNullOrEmpty(category))
        {
            query = query.Where(r => r.Category == category);
        }

        return await query.ToListAsync();
    }

    /// <summary>
    /// Lấy danh sách Regulations đang active
    /// </summary>
    public async Task<List<Regulation>> GetActiveRegulationsAsync(string? category = null)
    {
        var query = _context.Regulations
            .Where(r => r.IsActive)
            .OrderByDescending(r => r.EffectiveDate)
            .ThenBy(r => r.Id)
            .AsNoTracking();

        if (!string.IsNullOrEmpty(category))
        {
            query = query.Where(r => r.Category == category);
        }

        return await query.ToListAsync();
    }
}
