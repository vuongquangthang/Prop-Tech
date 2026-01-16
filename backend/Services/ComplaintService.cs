using backend.DTOs;
using backend.Models;
using backend.Repositories;

namespace backend.Services;

public interface IComplaintService
{
    Task<ComplaintDto?> GetByIdAsync(long id);
    Task<ComplaintDetailDto?> GetDetailAsync(long id);
    Task<List<ComplaintDto>> GetAllAsync();
    Task<List<ComplaintDto>> GetByRoomAsync(long roomId);
    Task<List<ComplaintDto>> GetByStatusAsync(string status);
    Task<List<ComplaintDto>> GetByAssignedToAsync(long assignedTo);
    Task<ComplaintDto> CreateAsync(CreateComplaintDto dto, long createdBy);
    Task<ComplaintDto> UpdateAsync(long id, UpdateComplaintDto dto, long userId);
    Task<ComplaintDetailDto> AddResponseAsync(long id, AddComplaintResponseDto dto, long respondedBy);
}

public class ComplaintService : IComplaintService
{
    private readonly IComplaintRepository _complaintRepository;
    private readonly IComplaintResponseRepository _responseRepository;
    private readonly IRoomRepository _roomRepository;
    private readonly ILogger<ComplaintService> _logger;

    public ComplaintService(
        IComplaintRepository complaintRepository,
        IComplaintResponseRepository responseRepository,
        IRoomRepository roomRepository,
        ILogger<ComplaintService> logger)
    {
        _complaintRepository = complaintRepository;
        _responseRepository = responseRepository;
        _roomRepository = roomRepository;
        _logger = logger;
    }

    public async Task<ComplaintDto?> GetByIdAsync(long id)
    {
        var complaint = await _complaintRepository.GetByIdAsync(id);
        return complaint == null ? null : MapToDto(complaint);
    }

    public async Task<ComplaintDetailDto?> GetDetailAsync(long id)
    {
        var complaint = await _complaintRepository.GetWithDetailsAsync(id);
        return complaint == null ? null : MapToDetailDto(complaint);
    }

    public async Task<List<ComplaintDto>> GetAllAsync()
    {
        var complaints = await _complaintRepository.GetAllWithDetailsAsync();
        return complaints.Select(MapToDto).ToList();
    }

    public async Task<List<ComplaintDto>> GetByRoomAsync(long roomId)
    {
        var complaints = await _complaintRepository.GetByRoomAsync(roomId);
        return complaints.Select(MapToDto).ToList();
    }

    public async Task<List<ComplaintDto>> GetByStatusAsync(string status)
    {
        var complaints = await _complaintRepository.GetByStatusAsync(status);
        return complaints.Select(MapToDto).ToList();
    }

    public async Task<List<ComplaintDto>> GetByAssignedToAsync(long assignedTo)
    {
        var complaints = await _complaintRepository.GetByAssignedToAsync(assignedTo);
        return complaints.Select(MapToDto).ToList();
    }

    public async Task<ComplaintDto> CreateAsync(CreateComplaintDto dto, long createdBy)
    {
        var room = await _roomRepository.GetByIdAsync(dto.RoomId);
        if (room == null)
        {
            throw new InvalidOperationException("Không tìm thấy phòng");
        }

        var complaintCode = $"CPL-{DateTime.UtcNow:yyyyMMddHHmmss}-{new Random().Next(1000, 9999)}";
        
        var complaint = new Complaint
        {
            ComplaintCode = complaintCode,
            RoomId = dto.RoomId,
            ResidentId = createdBy,
            Subject = dto.Title,
            Description = dto.Description,
            Category = dto.Category,
            Priority = dto.Priority,
            Status = "OPEN",
            SubmittedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };

        await _complaintRepository.AddAsync(complaint);
        await _complaintRepository.SaveChangesAsync();

        return MapToDto(complaint);
    }

    public async Task<ComplaintDto> UpdateAsync(long id, UpdateComplaintDto dto, long userId)
    {
        var complaint = await _complaintRepository.GetByIdAsync(id);
        if (complaint == null)
        {
            throw new InvalidOperationException("Không tìm thấy khiếu nại");
        }

        if (dto.Status != null)
        {
            complaint.Status = dto.Status;
            if (dto.Status == "RESOLVED" || dto.Status == "CLOSED")
            {
                complaint.ResolvedAt = DateTime.UtcNow;
            }
        }

        if (dto.AssignedTo.HasValue)
        {
            complaint.AssignedTo = dto.AssignedTo.Value;
        }

        _complaintRepository.Update(complaint);
        await _complaintRepository.SaveChangesAsync();

        return MapToDto(complaint);
    }

    public async Task<ComplaintDetailDto> AddResponseAsync(long id, AddComplaintResponseDto dto, long respondedBy)
    {
        var complaint = await _complaintRepository.GetWithDetailsAsync(id);
        if (complaint == null)
        {
            throw new InvalidOperationException("Không tìm thấy khiếu nại");
        }

        var response = new ComplaintResponse
        {
            ComplaintId = id,
            ResponseText = dto.Response,
            RespondedBy = respondedBy,
            RespondedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };

        await _responseRepository.AddAsync(response);
        await _responseRepository.SaveChangesAsync();

        // Update complaint status to IN_PROGRESS if still OPEN
        if (complaint.Status == "OPEN")
        {
            complaint.Status = "IN_PROGRESS";
            _complaintRepository.Update(complaint);
            await _complaintRepository.SaveChangesAsync();
        }

        // Reload with responses
        complaint = await _complaintRepository.GetWithDetailsAsync(id);
        return MapToDetailDto(complaint!);
    }

    private ComplaintDto MapToDto(Complaint complaint)
    {
        return new ComplaintDto
        {
            Id = complaint.Id,
            RoomId = complaint.RoomId,
            RoomCode = complaint.Room?.RoomCode ?? "",
            Title = complaint.Subject,
            Description = complaint.Description,
            Category = complaint.Category,
            Priority = complaint.Priority,
            Status = complaint.Status,
            CreatedBy = complaint.ResidentId,
            CreatedByName = "",
            AssignedTo = complaint.AssignedTo,
            AssignedToName = null,
            ResolvedAt = complaint.ResolvedAt,
            CreatedAt = complaint.CreatedAt
        };
    }

    private ComplaintDetailDto MapToDetailDto(Complaint complaint)
    {
        var dto = new ComplaintDetailDto
        {
            Id = complaint.Id,
            RoomId = complaint.RoomId,
            RoomCode = complaint.Room?.RoomCode ?? "",
            Title = complaint.Subject,
            Description = complaint.Description,
            Category = complaint.Category,
            Priority = complaint.Priority,
            Status = complaint.Status,
            CreatedBy = complaint.ResidentId,
            CreatedByName = "",
            AssignedTo = complaint.AssignedTo,
            AssignedToName = null,
            ResolvedAt = complaint.ResolvedAt,
            CreatedAt = complaint.CreatedAt,
            Resolution = null,
            Responses = complaint.Responses?.Select(r => new ComplaintResponseDto
            {
                Id = r.Id,
                ComplaintId = r.ComplaintId,
                Response = r.ResponseText,
                RespondedBy = r.RespondedBy,
                RespondedByName = "",
                CreatedAt = r.CreatedAt
            }).ToList() ?? new()
        };

        return dto;
    }
}
