using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories;

public interface IComplaintAttachmentRepository : IRepository<ComplaintAttachment>
{
    Task<List<ComplaintAttachment>> GetByComplaintAsync(long complaintId);
    Task<ComplaintAttachment?> GetByIdAsync(long id);
}

public class ComplaintAttachmentRepository : Repository<ComplaintAttachment>, IComplaintAttachmentRepository
{
    public ComplaintAttachmentRepository(Data.ApplicationDbContext context) : base(context)
    {
    }

    public async Task<List<ComplaintAttachment>> GetByComplaintAsync(long complaintId)
    {
        return await _context.Set<ComplaintAttachment>()
            .Where(a => a.ComplaintId == complaintId)
            .OrderByDescending(a => a.UploadedAt)
            .ToListAsync();
    }

    public async Task<ComplaintAttachment?> GetByIdAsync(long id)
    {
        return await _context.Set<ComplaintAttachment>()
            .FirstOrDefaultAsync(a => a.Id == id);
    }
}
