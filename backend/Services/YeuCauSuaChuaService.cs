using backend.DTOs;
using backend.Models;
using backend.Repositories;
using backend.Data;
using backend.Hubs;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;

namespace backend.Services;

public interface IYeuCauSuaChuaService
{
    Task<List<YeuCauSuaChuaDto>> GetAllAsync(int ownerUserId);
    Task<List<YeuCauSuaChuaDto>> GetByStatusAsync(string status, int ownerUserId);
    Task<List<YeuCauSuaChuaDto>> GetByRoomIdAsync(int roomId, int ownerUserId);
    Task<List<YeuCauSuaChuaDto>> GetByUserIdAsync(int userId);
    Task<YeuCauSuaChuaDto?> GetByIdAsync(int id, int? ownerUserId = null);
    Task<YeuCauSuaChuaDto> CreateAsync(int userId, CreateYeuCauSuaChuaDto dto);
    Task<YeuCauSuaChuaDto> UpdateAsync(int id, UpdateYeuCauSuaChuaDto dto, int? ownerUserId = null);
    Task<YeuCauSuaChuaDto> CloseAsync(int id, CloseYeuCauSuaChuaDto dto, int? ownerUserId = null);
    Task DeleteAsync(int id, int ownerUserId);
}

public class YeuCauSuaChuaService : IYeuCauSuaChuaService
{
    private static string NormalizeStatus(string? status)
    {
        var s = (status ?? string.Empty).Trim().ToLowerInvariant();
        return s switch
        {
            "chờ xử lý" or "cho xu ly" or "choxuly" or "pending" => "Chờ xử lý",
            "đang xử lý" or "dang xu ly" or "dangxuly" or "in-progress" or "inprogress" => "Đang xử lý",
            "chờ nghiệm thu" or "cho nghiem thu" or "chonghiemthu" or "review" => "Chờ nghiệm thu",
            "sửa lại" or "sua lai" or "sualai" or "rework" or "yêu cầu sửa lại" or "yeu cau sua lai" or "yeucausualai"
                or "không hài lòng" or "khong hai long" or "khonghailong" => "Sửa lại",
            "đã đóng" or "da dong" or "dadong" or "closed" => "Đã đóng",
            "hoàn thành" or "hoan thanh" or "hoanthanh" or "completed" or "resolved" => "Hoàn thành",
            _ => status?.Trim() ?? string.Empty
        };
    }

    private readonly IYeuCauSuaChuaRepository _yeuCauRepository;
    private readonly IRoomRepository _roomRepository;
    private readonly IUserRepository _userRepository;
    private readonly ApplicationDbContext _context;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly INotificationService _notificationService;

    public YeuCauSuaChuaService(
        IYeuCauSuaChuaRepository yeuCauRepository,
        IRoomRepository roomRepository,
        IUserRepository userRepository,
        ApplicationDbContext context,
        IHubContext<NotificationHub> hubContext,
        INotificationService notificationService)
    {
        _yeuCauRepository = yeuCauRepository;
        _roomRepository = roomRepository;
        _userRepository = userRepository;
        _context = context;
        _hubContext = hubContext;
        _notificationService = notificationService;
    }

    public async Task<List<YeuCauSuaChuaDto>> GetAllAsync(int ownerUserId)
    {
        var requests = await _yeuCauRepository.FindAsync(request => request.Room.Floor.Building.OwnerUserId == ownerUserId);
        var requestsList = requests.OrderByDescending(request => request.CreatedAt).ToList();
        var result = new List<YeuCauSuaChuaDto>();
        foreach (var request in requestsList)
        {
            var room = await _roomRepository.GetByIdAsync(request.RoomId);
            var user = await _userRepository.GetByIdAsync(request.UserId);
            result.Add(MapToDto(request, room, user));
        }
        return result;
    }

    public async Task<List<YeuCauSuaChuaDto>> GetByStatusAsync(string status, int ownerUserId)
    {
        var requests = (await _yeuCauRepository.FindAsync(request =>
            request.Status == status && request.Room.Floor.Building.OwnerUserId == ownerUserId))
            .OrderByDescending(request => request.CreatedAt);
        
        var result = new List<YeuCauSuaChuaDto>();
        foreach (var request in requests)
        {
            var room = await _roomRepository.GetByIdAsync(request.RoomId);
            var user = await _userRepository.GetByIdAsync(request.UserId);
            result.Add(MapToDto(request, room, user));
        }
        return result;
    }

    public async Task<List<YeuCauSuaChuaDto>> GetByRoomIdAsync(int roomId, int ownerUserId)
    {
        var requests = (await _yeuCauRepository.FindAsync(request =>
            request.RoomId == roomId && request.Room.Floor.Building.OwnerUserId == ownerUserId))
            .OrderByDescending(request => request.CreatedAt);
        var room = await _roomRepository.GetByIdAsync(roomId);
        
        var result = new List<YeuCauSuaChuaDto>();
        foreach (var request in requests)
        {
            var user = await _userRepository.GetByIdAsync(request.UserId);
            result.Add(MapToDto(request, room, user));
        }
        return result;
    }

    public async Task<List<YeuCauSuaChuaDto>> GetByUserIdAsync(int userId)
    {
        // Repository method is named GetByResidentIdAsync but actually filters by UserId
        var requests = await _yeuCauRepository.GetByResidentIdAsync(userId);
        var user = await _userRepository.GetByIdAsync(userId);
        
        var result = new List<YeuCauSuaChuaDto>();
        foreach (var request in requests)
        {
            var room = await _roomRepository.GetByIdAsync(request.RoomId);
            result.Add(MapToDto(request, room, user));
        }
        return result;
    }

    public async Task<YeuCauSuaChuaDto?> GetByIdAsync(int id, int? ownerUserId = null)
    {
        var request = ownerUserId.HasValue
            ? (await _yeuCauRepository.FindAsync(item =>
                item.Id == id && item.Room.Floor.Building.OwnerUserId == ownerUserId.Value)).FirstOrDefault()
            : await _yeuCauRepository.GetByIdAsync(id);
        if (request == null) return null;
        
        var room = await _roomRepository.GetByIdAsync(request.RoomId);
        var user = await _userRepository.GetByIdAsync(request.UserId);
        return MapToDto(request, room, user);
    }

    public async Task<YeuCauSuaChuaDto> CreateAsync(int userId, CreateYeuCauSuaChuaDto dto)
    {
        // Validate user exists
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            throw new InvalidOperationException("Người dùng không tồn tại");
        }

        int roomId;
        List<HopDong>? residentContracts = null;

        if (user.ResidentId.HasValue)
        {
            residentContracts = await _context.HopDongs
                .Include(hd => hd.ChiTietOs)
                .Where(hd => hd.ChiTietOs.Any(ct => ct.ResidentId == user.ResidentId.Value
                    && ct.FromDate <= DateTime.UtcNow
                    && (ct.ToDate == null || ct.ToDate >= DateTime.UtcNow)))
                .ToListAsync();
        }

        // If roomId not provided, get from user's current residency
        if (!dto.RoomId.HasValue)
        {
            if (!user.ResidentId.HasValue)
            {
                throw new InvalidOperationException("Người dùng chưa được liên kết với cư dân nào");
            }

            if (residentContracts == null || residentContracts.Count == 0)
            {
                throw new InvalidOperationException("Không tìm thấy hợp đồng đang hoạt động của bạn. Vui lòng liên hệ ban quản lý.");
            }

            roomId = residentContracts.First().RoomId;
        }
        else
        {
            roomId = dto.RoomId.Value;

            if (user.ResidentId.HasValue && (residentContracts == null || !residentContracts.Any(contract => contract.RoomId == roomId)))
            {
                throw new InvalidOperationException("Bạn không có hợp đồng đang hoạt động tại phòng đã chọn");
            }

            var room = (await _roomRepository.FindAsync(item =>
                item.Id == roomId && item.Floor.Building.OwnerUserId == user.OwnerUserId)).FirstOrDefault();
            if (room == null)
            {
                throw new InvalidOperationException("Phòng không tồn tại");
            }
        }

        var request = new YeuCauSuaChua
        {
            RoomId = roomId,
            UserId = userId,
            IssueType = dto.IssueType,
            Description = dto.Description,
            MediaUrls = dto.MediaUrls,
            Status = "Chờ xử lý",
            UpdatedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };

        await _yeuCauRepository.AddAsync(request);
        await _yeuCauRepository.SaveChangesAsync();

        var created = await _yeuCauRepository.GetByIdAsync(request.Id);
        var room2 = await _roomRepository.GetByIdAsync(created!.RoomId);
        var user2 = await _userRepository.GetByIdAsync(created.UserId);
        var createdOwnerUserId = await ResolveOwnerUserIdForRoomAsync(created.RoomId);
        
        // Send SignalR notification to all admins/managers
        try
        {
            await _hubContext.Clients.Group(NotificationHub.OwnerGroup(createdOwnerUserId)).SendAsync("NewMaintenanceRequest", new
            {
                id = created.Id,
                roomCode = room2?.RoomCode,
                issueType = created.IssueType,
                status = created.Status,
                createdAt = created.CreatedAt,
                userName = user2?.PhoneNumber
            });
        }
        catch (Exception ex)
        {
            // Log but don't fail the request creation
            Console.WriteLine($"⚠️  Failed to send SignalR notification: {ex.Message}");
        }

        // Tạo thông báo DB cho BQL: yêu cầu sửa chữa mới
        try
        {
            await _notificationService.CreateAdminNotificationAsync(
                $"Sự cố mới - {(room2 != null ? $"Phòng {room2.RoomCode}" : $"Phòng #{roomId}")}",
                $"{(room2 != null ? $"Phòng {room2.RoomCode}" : "Cư dân")} đã gửi yêu cầu sửa chữa: {created.IssueType}.",
                "COMPLAINT",
                createdOwnerUserId);
        }
        catch { /* Không block flow chính */ }

        return MapToDto(created, room2, user2);
    }

    public async Task<YeuCauSuaChuaDto> UpdateAsync(int id, UpdateYeuCauSuaChuaDto dto, int? ownerUserId = null)
    {
        var request = ownerUserId.HasValue
            ? (await _yeuCauRepository.FindAsync(item =>
                item.Id == id && item.Room.Floor.Building.OwnerUserId == ownerUserId.Value)).FirstOrDefault()
            : await _yeuCauRepository.GetByIdAsync(id);
        if (request == null)
        {
            throw new InvalidOperationException("Yêu cầu không tồn tại");
        }

        if (request.ClosedAt.HasValue)
        {
            throw new InvalidOperationException("Không thể cập nhật yêu cầu đã đóng");
        }

        if (!string.IsNullOrWhiteSpace(dto.Status))
        {
            var currentStatus = NormalizeStatus(request.Status);
            var nextStatus = NormalizeStatus(dto.Status);

            // BQL workflow: from review, web side only keeps waiting; resident feedback uses close endpoint.
            if (currentStatus == "Chờ nghiệm thu" && nextStatus != "Chờ nghiệm thu")
            {
                throw new InvalidOperationException("Sự cố ở trạng thái nghiệm thu chỉ được giữ chờ phản hồi cư dân.");
            }

            // Never allow direct completion through generic update endpoint.
            if (nextStatus == "Hoàn thành" || nextStatus == "Đã đóng")
            {
                throw new InvalidOperationException("Không thể chuyển hoàn thành trực tiếp. Chỉ cư dân xác nhận hài lòng mới được đóng sự cố.");
            }

            request.Status = nextStatus;
        }

        if (dto.AdminNote != null)
            request.AdminNote = dto.AdminNote;

        if (dto.CompletionImageUrl != null)
            request.CompletionImageUrl = dto.CompletionImageUrl;

        request.UpdatedAt = DateTime.UtcNow;

        _yeuCauRepository.Update(request);
        await _yeuCauRepository.SaveChangesAsync();

        var closed = await _yeuCauRepository.GetByIdAsync(id);
        var room = await _roomRepository.GetByIdAsync(closed!.RoomId);
        var user = await _userRepository.GetByIdAsync(closed.UserId);
        var updatedOwnerUserId = await ResolveOwnerUserIdForRoomAsync(closed.RoomId);
        
        // Send SignalR notification for status update
        try
        {
            await _hubContext.Clients.Group(NotificationHub.OwnerGroup(updatedOwnerUserId)).SendAsync("MaintenanceRequestUpdated", new
            {
                id = closed.Id,
                roomCode = room?.RoomCode,
                status = closed.Status,
                adminNote = closed.AdminNote,
                completionImageUrl = closed.CompletionImageUrl
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"⚠️  Failed to send SignalR notification: {ex.Message}");
        }

        // Nếu trạng thái chuyển sang "Chờ nghiệm thu": thông báo cho cư dân đi nghiệm thu
        if (NormalizeStatus(dto.Status) == "Chờ nghiệm thu")
        {
            try
            {
                await _notificationService.SendToUserAsync(
                    closed.UserId,
                    "Yêu cầu sửa chữa hoàn thành",
                    $"Yêu cầu sửa chữa tại {(room != null ? $"phòng {room.RoomCode}" : "phòng của bạn")} ({closed.IssueType}) đã hoàn thành. Vui lòng kiểm tra và nghiệm thu.",
                    "COMPLAINT",
                    closed.Id);
            }
            catch { /* Không block flow chính */ }
        }

        return MapToDto(closed, room, user);
    }

    public async Task<YeuCauSuaChuaDto> CloseAsync(int id, CloseYeuCauSuaChuaDto dto, int? ownerUserId = null)
    {
        var request = ownerUserId.HasValue
            ? (await _yeuCauRepository.FindAsync(item =>
                item.Id == id && item.Room.Floor.Building.OwnerUserId == ownerUserId.Value)).FirstOrDefault()
            : await _yeuCauRepository.GetByIdAsync(id);
        if (request == null)
        {
            throw new InvalidOperationException("Yêu cầu không tồn tại");
        }

        if (request.ClosedAt.HasValue)
        {
            throw new InvalidOperationException("Yêu cầu đã được đóng");
        }

        var currentStatus = NormalizeStatus(request.Status);
        var requestedStatus = NormalizeStatus(dto.Status);

        if (currentStatus != "Chờ nghiệm thu")
        {
            throw new InvalidOperationException("Chỉ được phản hồi đóng/mở lại khi sự cố đang ở trạng thái chờ nghiệm thu.");
        }

        if (requestedStatus != "Đã đóng" && requestedStatus != "Sửa lại")
        {
            throw new InvalidOperationException("Phản hồi nghiệm thu chỉ hợp lệ với trạng thái 'Đã đóng' hoặc 'Sửa lại'.");
        }

        request.Status = requestedStatus;
        request.AdminNote = dto.AdminNote;
        request.CompletionImageUrl = dto.CompletionImageUrl;
        
        // Only set closedAt when resident marks as satisfied ("Đã đóng")
        // Don't set it when admin marks as complete ("Hoàn thành")
        if (requestedStatus == "Đã đóng")
        {
            request.ClosedAt = DateTime.UtcNow;
        }
        else
        {
            request.ClosedAt = null;
        }

        request.UpdatedAt = DateTime.UtcNow;

        _yeuCauRepository.Update(request);
        await _yeuCauRepository.SaveChangesAsync();

        var updated = await _yeuCauRepository.GetByIdAsync(id);
        var room = await _roomRepository.GetByIdAsync(updated!.RoomId);
        var user = await _userRepository.GetByIdAsync(updated.UserId);
        var closedOwnerUserId = await ResolveOwnerUserIdForRoomAsync(updated.RoomId);
        
        // Send SignalR notification for request closure
        try
        {
            await _hubContext.Clients.Group(NotificationHub.OwnerGroup(closedOwnerUserId)).SendAsync("MaintenanceRequestClosed", new
            {
                id = updated.Id,
                roomCode = room?.RoomCode,
                status = updated.Status,
                adminNote = updated.AdminNote,
                completionImageUrl = updated.CompletionImageUrl,
                closedAt = updated.ClosedAt
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"⚠️  Failed to send SignalR notification: {ex.Message}");
        }

        // Thông báo cho BQL: cư dân đã phản hồi nghiệm thu (hài lòng hoặc yêu cầu sửa lại)
        try
        {
            var roomLabel = room != null ? $"Phòng {room.RoomCode}" : "Cư dân";
            var feedbackMsg = NormalizeStatus(updated.Status) == "Đã đóng"
                ? $"{roomLabel} hài lòng với kết quả xử lý sự cố: {updated.IssueType}."
                : $"{roomLabel} yêu cầu sửa lại sự cố: {updated.IssueType}.";
            await _notificationService.CreateAdminNotificationAsync(
                $"Phản hồi nghiệm thu - {roomLabel}",
                feedbackMsg,
                "COMPLAINT",
                closedOwnerUserId);
        }
        catch { /* Không block flow chính */ }

        return MapToDto(updated, room, user);
    }

    public async Task DeleteAsync(int id, int ownerUserId)
    {
        var request = (await _yeuCauRepository.FindAsync(item =>
            item.Id == id && item.Room.Floor.Building.OwnerUserId == ownerUserId)).FirstOrDefault();
        if (request == null)
        {
            throw new InvalidOperationException("Yêu cầu không tồn tại");
        }

        _yeuCauRepository.Remove(request);
        await _yeuCauRepository.SaveChangesAsync();
    }

    private async Task<int> ResolveOwnerUserIdForRoomAsync(int roomId)
    {
        var ownerUserId = await _context.Rooms
            .Where(room => room.Id == roomId)
            .Select(room => room.Floor.Building.OwnerUserId)
            .FirstOrDefaultAsync();

        return ownerUserId ?? throw new InvalidOperationException("Khong the xac dinh chu nha cua phong");
    }

    private static YeuCauSuaChuaDto MapToDto(YeuCauSuaChua request, Room? room, User? user)
    {
        return new YeuCauSuaChuaDto
        {
            Id = request.Id,
            RoomId = request.RoomId,
            RoomNumber = room?.RoomCode,
            UserId = request.UserId,
            UserName = user?.PhoneNumber,
            IssueType = request.IssueType,
            Description = request.Description,
            MediaUrls = request.MediaUrls,
            Status = request.Status,
            AdminNote = request.AdminNote,
            CompletionImageUrl = request.CompletionImageUrl,
            CreatedAt = request.CreatedAt,
            UpdatedAt = request.UpdatedAt,
            ClosedAt = request.ClosedAt
        };
    }
}
