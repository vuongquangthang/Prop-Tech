using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories;

public class KnowledgeBaseRepository : Repository<KnowledgeBase>, IKnowledgeBaseRepository
{
    public KnowledgeBaseRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<List<KnowledgeBase>> GetAllActiveAsync()
    {
        return await _context.KnowledgeBases
            .Include(x => x.UpdatedByUser)
            .Where(x => x.IsActive)
            .OrderByDescending(x => x.UpdatedAt)
            .ToListAsync();
    }

    public async Task<List<KnowledgeBase>> GetByCategoryAsync(string category)
    {
        return await _context.KnowledgeBases
            .Include(x => x.UpdatedByUser)
            .Where(x => x.Category == category && x.IsActive)
            .OrderByDescending(x => x.UpdatedAt)
            .ToListAsync();
    }

    public async Task<List<KnowledgeBase>> SearchAsync(string keyword)
    {
        var lowerKeyword = keyword.ToLower();
        return await _context.KnowledgeBases
            .Include(x => x.UpdatedByUser)
            .Where(x => x.IsActive && (
                x.Title.ToLower().Contains(lowerKeyword) ||
                x.Content.ToLower().Contains(lowerKeyword) ||
                (x.Tags != null && x.Tags.ToLower().Contains(lowerKeyword))
            ))
            .OrderByDescending(x => x.UpdatedAt)
            .ToListAsync();
    }

    public async Task<KnowledgeBase?> GetByIdAsync(int id)
    {
        return await _context.KnowledgeBases
            .Include(x => x.UpdatedByUser)
            .FirstOrDefaultAsync(x => x.Id == id);
    }
}
