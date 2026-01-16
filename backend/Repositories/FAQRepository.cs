using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories;

public interface IFAQRepository : IRepository<FAQ>
{
    Task<List<FAQ>> SearchFullTextAsync(string searchTerm, string? category = null);
    Task<List<FAQ>> GetActiveFAQsAsync(string? category = null);
}

public class FAQRepository : Repository<FAQ>, IFAQRepository
{
    public FAQRepository(ApplicationDbContext context) : base(context)
    {
    }

    /// <summary>
    /// Tìm kiếm FAQ sử dụng Full-Text Search
    /// </summary>
    public async Task<List<FAQ>> SearchFullTextAsync(string searchTerm, string? category = null)
    {
        if (string.IsNullOrWhiteSpace(searchTerm))
        {
            return await GetActiveFAQsAsync(category);
        }

        var query = _context.FAQs
            .FromSqlRaw(@"
                SELECT * FROM faqs
                WHERE is_active = 1
                AND CONTAINS((question, answer, keywords), {0})
                ORDER BY display_order, id
            ", searchTerm)
            .AsNoTracking();

        if (!string.IsNullOrEmpty(category))
        {
            query = query.Where(f => f.Category == category);
        }

        return await query.ToListAsync();
    }

    /// <summary>
    /// Lấy danh sách FAQs đang active
    /// </summary>
    public async Task<List<FAQ>> GetActiveFAQsAsync(string? category = null)
    {
        var query = _context.FAQs
            .Where(f => f.IsActive)
            .OrderBy(f => f.DisplayOrder)
            .ThenBy(f => f.Id)
            .AsNoTracking();

        if (!string.IsNullOrEmpty(category))
        {
            query = query.Where(f => f.Category == category);
        }

        return await query.ToListAsync();
    }
}
