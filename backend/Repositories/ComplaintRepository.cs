using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories;

public interface IComplaintRepository : IRepository<Complaint>
{
    Task<Complaint?> GetWithDetailsAsync(long id);
    Task<List<Complaint>> GetByRoomAsync(long roomId);
    Task<List<Complaint>> GetByStatusAsync(string status);
    Task<List<Complaint>> GetByAssignedToAsync(long assignedTo);
    Task<List<Complaint>> GetAllWithDetailsAsync();
}

public class ComplaintRepository : Repository<Complaint>, IComplaintRepository
{
    public ComplaintRepository(Data.ApplicationDbContext context) : base(context)
    {
    }

    public async Task<Complaint?> GetWithDetailsAsync(long id)
    {
        return await _context.Complaints
            .Include(c => c.Room)
            .Include(c => c.Responses.OrderBy(r => r.CreatedAt))
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<List<Complaint>> GetByRoomAsync(long roomId)
    {
        return await _context.Complaints
            .Where(c => c.RoomId == roomId)
            .Include(c => c.Room)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<Complaint>> GetByStatusAsync(string status)
    {
        return await _context.Complaints
            .Where(c => c.Status == status)
            .Include(c => c.Room)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<Complaint>> GetByAssignedToAsync(long assignedTo)
    {
        return await _context.Complaints
            .Where(c => c.AssignedTo == assignedTo)
            .Include(c => c.Room)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<Complaint>> GetAllWithDetailsAsync()
    {
        return await _context.Complaints
            .Include(c => c.Room)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();
    }
}

public interface IComplaintResponseRepository : IRepository<ComplaintResponse>
{
    Task<List<ComplaintResponse>> GetByComplaintAsync(long complaintId);
}

public class ComplaintResponseRepository : Repository<ComplaintResponse>, IComplaintResponseRepository
{
    public ComplaintResponseRepository(Data.ApplicationDbContext context) : base(context)
    {
    }

    public async Task<List<ComplaintResponse>> GetByComplaintAsync(long complaintId)
    {
        return await _context.ComplaintResponses
            .Where(r => r.ComplaintId == complaintId)
            .OrderBy(r => r.CreatedAt)
            .ToListAsync();
    }
}
