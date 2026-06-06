using System.Globalization;
using System.Text.Json;
using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public interface IPostService
{
    Task<List<PostDto>> GetAllAsync(int ownerUserId);
    Task<PostDto?> GetByIdAsync(int id, int? ownerUserId = null);
    Task<PostDto?> GetByUserIdAsync(int userId);
    Task<PostDto> CreateAsync(CreatePostDto dto, int? createdByUserId = null, int? ownerUserId = null);
    Task<PostDto> RecordViewAsync(int id);
    Task<PostDto> SyncMessageCountAsync(int id, int messages);
    Task<PostDto> UpdateLockAsync(int id, bool isLocked, int? changedByUserId = null, int? ownerUserId = null);
    Task<PostDto> UpdateAsync(int id, UpdatePostDto dto, int? changedByUserId = null, int? ownerUserId = null);
    Task<List<PostEditHistoryDto>> GetHistoryAsync(int id, int limit = 20, int? ownerUserId = null);
    Task DeleteAsync(int id, int ownerUserId);
}

public class PostService : IPostService
{
    private const string PostEntityType = nameof(BaiDangTimPhong);
    private const string ActivePostStatus = "active";
    private const string PausedPostStatus = "paused";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    private readonly ApplicationDbContext _context;
    private readonly IAuditLogService _auditLogService;

    public PostService(ApplicationDbContext context, IAuditLogService auditLogService)
    {
        _context = context;
        _auditLogService = auditLogService;
    }

    private static IQueryable<BaiDangTimPhong> FilterPostsForOwner(IQueryable<BaiDangTimPhong> query, int ownerUserId)
    {
        return query.Where(post =>
            post.CreatedByUserId == ownerUserId
            || (post.Room != null
                && post.Room.Floor.Building.OwnerUserId == ownerUserId));
    }

    public async Task<List<PostDto>> GetAllAsync(int ownerUserId)
    {
        var posts = await FilterPostsForOwner(_context.BaiDangTimPhongs, ownerUserId)
            .AsNoTracking()
            .Include(post => post.CreatedByUser)
            .Include(post => post.Room)
                .ThenInclude(room => room!.Floor)
                    .ThenInclude(floor => floor.Building)
            .OrderByDescending(post => post.CreatedAt)
            .ToListAsync();

        return posts.Select(MapToDto).ToList();
    }

    public async Task<PostDto?> GetByIdAsync(int id, int? ownerUserId = null)
    {
        var query = _context.BaiDangTimPhongs
            .AsNoTracking()
            .Include(item => item.CreatedByUser)
            .Include(item => item.Room)
                .ThenInclude(room => room!.Floor)
                    .ThenInclude(floor => floor.Building)
            .Where(item => item.Id == id);

        if (ownerUserId.HasValue)
        {
            query = FilterPostsForOwner(query, ownerUserId.Value);
        }

        var post = await query.FirstOrDefaultAsync();

        return post == null ? null : MapToDto(post);
    }

    public async Task<PostDto?> GetByUserIdAsync(int userId)
    {
        var post = await _context.BaiDangTimPhongs
            .AsNoTracking()
            .Include(item => item.CreatedByUser)
            .Where(item => item.CreatedByUserId == userId)
            .OrderByDescending(item => item.CreatedAt)
            .FirstOrDefaultAsync();

        return post == null ? null : MapToDto(post);
    }

    public async Task<PostDto> CreateAsync(CreatePostDto dto, int? createdByUserId = null, int? ownerUserId = null)
    {
        if (string.IsNullOrWhiteSpace(dto.Title))
        {
            throw new InvalidOperationException("Vui lòng nhập tiêu đề bài đăng");
        }

        var room = await _context.Rooms
            .Include(item => item.Floor)
                .ThenInclude(item => item.Building)
            .FirstOrDefaultAsync(item => item.Id == dto.RoomId);

        if (room == null)
        {
            throw new InvalidOperationException("Phòng không tồn tại");
        }

        if (createdByUserId.HasValue)
        {
            var creator = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(item => item.Id == createdByUserId.Value);
            var effectiveOwnerUserId = ownerUserId ?? creator?.OwnerUserId ?? createdByUserId.Value;
            if (creator?.Role is "Admin" or "QuanLy" && room.Floor.Building.OwnerUserId != effectiveOwnerUserId)
            {
                throw new InvalidOperationException("Bạn không có quyền đăng bài cho phòng này");
            }
        }

        var hasExistingPost = await _context.BaiDangTimPhongs
            .AnyAsync(item => item.RoomId == room.Id);
        if (hasExistingPost)
        {
            throw new InvalidOperationException("Phòng này đã có bài đăng");
        }

        var now = DateTime.UtcNow;
        var isRoomOccupied = IsRoomOccupiedStatus(room.Status);
        var post = new BaiDangTimPhong
        {
            RoomId = room.Id,
            RoomCode = room.RoomCode,
            BuildingName = room.Floor.Building.BuildingName,
            FloorNumber = room.Floor.FloorNumber,
            Area = room.Area,
            MaxOccupants = room.MaxOccupants,
            Title = dto.Title.Trim(),
            BaseRentPrice = dto.BaseRentPrice,
            PostDate = now,
            CreatedAt = now,
            Views = 0,
            Messages = 0,
            IsLocked = isRoomOccupied,
            Status = isRoomOccupied ? PausedPostStatus : ActivePostStatus,
            RoomStatus = room.Status,
            MoveInType = dto.MoveInType,
            MoveInDate = dto.MoveInDate,
            FloodProne = dto.FloodProne,
            LandlordRequirements = string.IsNullOrWhiteSpace(dto.LandlordRequirements) ? null : dto.LandlordRequirements.Trim(),
            ContactType = dto.ContactType,
            ContactName = dto.ContactName.Trim(),
            ContactPhone = dto.ContactPhone.Trim(),
            ServicePricesJson = JsonSerializer.Serialize(dto.ServicePrices, JsonOptions),
            ImageUrlsJson = JsonSerializer.Serialize(dto.ImageUrls, JsonOptions),
            AmenitiesJson = JsonSerializer.Serialize(dto.Amenities, JsonOptions),
            CoverImageUrl = dto.ImageUrls.FirstOrDefault(),
            CreatedByUserId = createdByUserId,
        };

        await _context.BaiDangTimPhongs.AddAsync(post);
        await _context.SaveChangesAsync();
        await LogHistoryAsync(createdByUserId, post.Id, "CREATE", BuildCreateSummary(post), BuildCreateChanges(post));

        return MapToDto(post);
    }

    public async Task<PostDto> RecordViewAsync(int id)
    {
        var post = await _context.BaiDangTimPhongs
            .Include(item => item.CreatedByUser)
            .Include(item => item.Room)
                .ThenInclude(room => room!.Floor)
                    .ThenInclude(floor => floor.Building)
            .FirstOrDefaultAsync(item => item.Id == id && !item.IsLocked && item.Status == "active");

        if (post == null)
        {
            throw new InvalidOperationException("Bài đăng không tồn tại hoặc không đang hiển thị");
        }

        post.Views += 1;
        await _context.SaveChangesAsync();

        return MapToDto(post);
    }

    public async Task<PostDto> SyncMessageCountAsync(int id, int messages)
    {
        var post = await _context.BaiDangTimPhongs
            .Include(item => item.CreatedByUser)
            .Include(item => item.Room)
                .ThenInclude(room => room!.Floor)
                    .ThenInclude(floor => floor.Building)
            .FirstOrDefaultAsync(item => item.Id == id);

        if (post == null)
        {
            throw new InvalidOperationException("Bài đăng không tồn tại");
        }

        post.Messages = Math.Max(0, messages);
        await _context.SaveChangesAsync();

        return MapToDto(post);
    }

    public async Task<PostDto> UpdateLockAsync(int id, bool isLocked, int? changedByUserId = null, int? ownerUserId = null)
    {
        var query = _context.BaiDangTimPhongs
            .Include(item => item.CreatedByUser)
            .Include(item => item.Room)
                .ThenInclude(room => room!.Floor)
                    .ThenInclude(floor => floor.Building)
            .Where(item => item.Id == id);

        if (ownerUserId.HasValue)
        {
            query = FilterPostsForOwner(query, ownerUserId.Value);
        }

        var post = await query.FirstOrDefaultAsync();
        if (post == null)
        {
            throw new InvalidOperationException("Bài đăng không tồn tại");
        }

        var oldIsLocked = post.IsLocked;
        var oldStatus = post.Status;

        post.RoomStatus = post.Room?.Status ?? post.RoomStatus;
        post.IsLocked = isLocked;
        post.Status = post.IsLocked ? PausedPostStatus : ActivePostStatus;
        await _context.SaveChangesAsync();
        if (oldIsLocked != post.IsLocked || oldStatus != post.Status)
        {
            await LogHistoryAsync(changedByUserId, post.Id, "UPDATE", isLocked ? "Khóa bài đăng" : "Mở bài đăng", new[]
            {
                new PostHistoryChangeDto
                {
                    Label = "Trạng thái bài đăng",
                    Before = DescribeStatus(oldStatus, oldIsLocked),
                    After = DescribeStatus(post.Status, post.IsLocked),
                }
            });
        }

        return MapToDto(post);
    }

    public async Task<PostDto> UpdateAsync(int id, UpdatePostDto dto, int? changedByUserId = null, int? ownerUserId = null)
    {
        var query = _context.BaiDangTimPhongs
            .Include(item => item.CreatedByUser)
            .Include(item => item.Room)
                .ThenInclude(room => room!.Floor)
                    .ThenInclude(floor => floor.Building)
            .Where(item => item.Id == id);

        if (ownerUserId.HasValue)
        {
            query = FilterPostsForOwner(query, ownerUserId.Value);
        }

        var post = await query.FirstOrDefaultAsync();
        if (post == null)
        {
            throw new InvalidOperationException("Bài đăng không tồn tại");
        }

        var changes = new List<PostHistoryChangeDto>();

        var nextTitle = string.IsNullOrWhiteSpace(dto.Title) ? null : dto.Title.Trim();
        if (nextTitle != null && !StringEquals(post.Title, nextTitle))
        {
            AddChange(changes, "Tiêu đề", post.Title, nextTitle);
            post.Title = nextTitle;
        }

        if (dto.BaseRentPrice.HasValue && post.BaseRentPrice != dto.BaseRentPrice.Value)
        {
            AddChange(changes, "Giá thuê", FormatMoney(post.BaseRentPrice), FormatMoney(dto.BaseRentPrice.Value));
            post.BaseRentPrice = dto.BaseRentPrice.Value;
        }

        if (dto.MaxOccupants.HasValue && post.MaxOccupants != dto.MaxOccupants.Value)
        {
            AddChange(changes, "Số người tối đa", FormatNullableInt(post.MaxOccupants), FormatNullableInt(dto.MaxOccupants));
            post.MaxOccupants = dto.MaxOccupants.Value;
        }

        if (dto.CurrentOccupants.HasValue && post.CurrentOccupants != dto.CurrentOccupants.Value)
        {
            AddChange(changes, "Số người đang ở", FormatNullableInt(post.CurrentOccupants), FormatNullableInt(dto.CurrentOccupants));
            post.CurrentOccupants = dto.CurrentOccupants.Value;
        }

        if (!string.IsNullOrWhiteSpace(dto.MoveInType) && !StringEquals(post.MoveInType, dto.MoveInType))
        {
            AddChange(changes, "Kiểu vào ở", FormatMoveInType(post.MoveInType), FormatMoveInType(dto.MoveInType));
            post.MoveInType = dto.MoveInType;
        }

        if (dto.MoveInType == "immediate" && post.MoveInDate != null)
        {
            AddChange(changes, "Ngày vào ở", FormatDate(post.MoveInDate), "Ở ngay");
            post.MoveInDate = null;
        }
        else if (dto.MoveInDate.HasValue && post.MoveInDate != dto.MoveInDate.Value)
        {
            AddChange(changes, "Ngày vào ở", FormatDate(post.MoveInDate), FormatDate(dto.MoveInDate));
            post.MoveInDate = dto.MoveInDate;
        }

        if (dto.FloodProne.HasValue && post.FloodProne != dto.FloodProne.Value)
        {
            AddChange(changes, "Khu vực ngập lụt", FormatBool(post.FloodProne), FormatBool(dto.FloodProne.Value));
            post.FloodProne = dto.FloodProne.Value;
        }

        if (dto.LandlordRequirements != null)
        {
            var nextRequirements = string.IsNullOrWhiteSpace(dto.LandlordRequirements) ? null : dto.LandlordRequirements.Trim();
            if (!StringEquals(post.LandlordRequirements, nextRequirements))
            {
                AddChange(changes, "Yêu cầu chủ nhà", FormatNullableText(post.LandlordRequirements), FormatNullableText(nextRequirements));
                post.LandlordRequirements = nextRequirements;
            }
        }

        if (!string.IsNullOrWhiteSpace(dto.ContactType) && !StringEquals(post.ContactType, dto.ContactType))
        {
            AddChange(changes, "Kiểu liên hệ", FormatContactType(post.ContactType), FormatContactType(dto.ContactType));
            post.ContactType = dto.ContactType;
        }

        if (!string.IsNullOrWhiteSpace(dto.ContactName) && !StringEquals(post.ContactName, dto.ContactName.Trim()))
        {
            AddChange(changes, "Tên liên hệ", post.ContactName, dto.ContactName.Trim());
            post.ContactName = dto.ContactName.Trim();
        }

        if (!string.IsNullOrWhiteSpace(dto.ContactPhone) && !StringEquals(post.ContactPhone, dto.ContactPhone.Trim()))
        {
            AddChange(changes, "Số điện thoại", post.ContactPhone, dto.ContactPhone.Trim());
            post.ContactPhone = dto.ContactPhone.Trim();
        }

        if (dto.ServicePrices != null)
        {
            var nextServicePrices = JsonSerializer.Serialize(dto.ServicePrices, JsonOptions);
            if (!StringEquals(post.ServicePricesJson, nextServicePrices))
            {
                AddChange(changes, "Giá dịch vụ", BuildServiceSummary(post.ServicePricesJson), BuildServiceSummary(nextServicePrices));
            }
            post.ServicePricesJson = JsonSerializer.Serialize(dto.ServicePrices, JsonOptions);
        }

        if (dto.ImageUrls != null)
        {
            var nextImageUrls = JsonSerializer.Serialize(dto.ImageUrls, JsonOptions);
            if (!StringEquals(post.ImageUrlsJson, nextImageUrls))
            {
                AddChange(changes, "Ảnh bài đăng", BuildImageSummary(post.ImageUrlsJson), BuildImageSummary(nextImageUrls));
            }
            post.ImageUrlsJson = JsonSerializer.Serialize(dto.ImageUrls, JsonOptions);
            post.CoverImageUrl = dto.ImageUrls.FirstOrDefault();
        }

        if (dto.Amenities != null)
        {
            var nextAmenities = JsonSerializer.Serialize(dto.Amenities, JsonOptions);
            if (!StringEquals(post.AmenitiesJson ?? "[]", nextAmenities))
            {
                AddChange(changes, "Tiện ích", BuildAmenitySummary(post.AmenitiesJson), BuildAmenitySummary(nextAmenities));
            }
            post.AmenitiesJson = nextAmenities;
        }

        await _context.SaveChangesAsync();
        if (changes.Count > 0)
        {
            await LogHistoryAsync(changedByUserId, post.Id, "UPDATE", BuildUpdateSummary(post, changes.Count), changes);
        }

        return MapToDto(post);
    }

    public async Task<List<PostEditHistoryDto>> GetHistoryAsync(int id, int limit = 20, int? ownerUserId = null)
    {
        var query = _context.BaiDangTimPhongs
            .AsNoTracking()
            .Include(item => item.Room)
                .ThenInclude(room => room!.Floor)
                    .ThenInclude(floor => floor.Building)
            .Where(item => item.Id == id);

        if (ownerUserId.HasValue)
        {
            query = FilterPostsForOwner(query, ownerUserId.Value);
        }

        var post = await query.FirstOrDefaultAsync();

        if (post == null)
        {
            throw new InvalidOperationException("Bài đăng không tồn tại");
        }

        var logs = ownerUserId.HasValue
            ? await _auditLogService.GetByEntityAsync(PostEntityType, ownerUserId.Value, id, limit)
            : await _auditLogService.GetByEntityAsync(PostEntityType, id, limit);
        if (logs.Count == 0)
        {
            return new List<PostEditHistoryDto>
            {
                new()
                {
                    Id = 0,
                    Version = "Phiên bản hiện tại",
                    Summary = BuildCreateSummary(post),
                    ChangedAt = post.CreatedAt,
                    IsCurrent = true,
                    Changes = BuildCreateChanges(post).Select(change => FormatChange(change)).ToList(),
                }
            };
        }

        return logs.Select((log, index) => MapHistoryEntry(log, index == 0, index + 1)).ToList();
    }

    public async Task DeleteAsync(int id, int ownerUserId)
    {
        var post = await FilterPostsForOwner(_context.BaiDangTimPhongs, ownerUserId)
            .FirstOrDefaultAsync(item => item.Id == id);
        if (post == null)
        {
            throw new InvalidOperationException("Bài đăng không tồn tại");
        }

        _context.BaiDangTimPhongs.Remove(post);
        await _context.SaveChangesAsync();
    }

    private static bool IsRoomOccupiedStatus(string? status)
    {
        var normalized = (status ?? string.Empty).Trim().ToLowerInvariant();
        return normalized.Contains("thuê")
            || normalized.Contains("thuÃª")
            || normalized.Contains("thue")
            || normalized is "rented" or "occupied";
    }

    private static PostDto MapToDto(BaiDangTimPhong post)
    {
        return new PostDto
        {
            Id = post.Id,
            RoomId = post.RoomId,
            RoomCode = post.RoomCode,
            BuildingName = post.BuildingName,
            FloorNumber = post.FloorNumber,
            Area = post.Area,
            MaxOccupants = post.MaxOccupants,
            CurrentOccupants = post.CurrentOccupants,
            Title = post.Title,
            BaseRentPrice = post.BaseRentPrice,
            PostDate = post.PostDate,
            CreatedAt = post.CreatedAt,
            Views = post.Views,
            Messages = post.Messages,
            IsLocked = post.IsLocked,
            Status = post.Status,
            RoomStatus = post.Room?.Status ?? post.RoomStatus,
            MoveInType = post.MoveInType,
            MoveInDate = post.MoveInDate,
            FloodProne = post.FloodProne,
            LandlordRequirements = post.LandlordRequirements,
            ContactType = post.ContactType,
            ContactName = post.ContactName,
            ContactPhone = post.ContactPhone,
            ServicePrices = DeserializeList<PostServiceLineItemDto>(post.ServicePricesJson),
            ImageUrls = DeserializeList<string>(post.ImageUrlsJson),
            Amenities = DeserializeList<string>(post.AmenitiesJson ?? "[]"),
            CoverImageUrl = post.CoverImageUrl,
            CreatedByUserId = post.CreatedByUserId,
            CreatedByUserRole = post.CreatedByUser?.Role,
        };
    }

    private async Task LogHistoryAsync(int? userId, int postId, string action, string summary, IEnumerable<PostHistoryChangeDto> changes)
    {
        var payload = new PostHistoryPayload
        {
            Summary = summary,
            Changes = changes.ToList(),
        };

        await _auditLogService.LogAsync(userId, action, PostEntityType, postId, JsonSerializer.Serialize(payload, JsonOptions));
    }

    private static PostEditHistoryDto MapHistoryEntry(AuditLogDto log, bool isCurrent, int versionNumber)
    {
        var payload = ParseHistoryPayload(log.NewValues ?? log.Details);
        var summary = payload?.Summary ?? log.Details ?? log.Action;
        var changes = payload?.Changes?.Select(FormatChange).ToList();

        return new PostEditHistoryDto
        {
            Id = log.Id,
            Version = isCurrent ? "Phiên bản hiện tại" : $"Phiên bản {versionNumber}",
            Summary = summary,
            ChangedBy = log.FullName ?? log.Username ?? "Hệ thống",
            ChangedAt = log.CreatedAt,
            IsCurrent = isCurrent,
            Changes = changes is { Count: > 0 } ? changes : new List<string> { summary },
        };
    }

    private static PostHistoryPayload? ParseHistoryPayload(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return null;
        }

        try
        {
            return JsonSerializer.Deserialize<PostHistoryPayload>(json, JsonOptions);
        }
        catch
        {
            return null;
        }
    }

    private static string BuildCreateSummary(BaiDangTimPhong post) => $"Tạo bài đăng cho phòng {post.RoomCode}";

    private static string BuildUpdateSummary(BaiDangTimPhong post, int changeCount)
        => $"Cập nhật bài đăng {post.RoomCode} ({changeCount} thay đổi)";

    private static List<PostHistoryChangeDto> BuildCreateChanges(BaiDangTimPhong post)
    {
        var changes = new List<PostHistoryChangeDto>();
        AddChange(changes, "Tiêu đề", null, post.Title);
        AddChange(changes, "Giá thuê", null, FormatMoney(post.BaseRentPrice));
        if (post.MaxOccupants.HasValue)
        {
            AddChange(changes, "Số người tối đa", null, FormatNullableInt(post.MaxOccupants));
        }
        AddChange(changes, "Kiểu vào ở", null, FormatMoveInType(post.MoveInType));
        if (post.MoveInDate.HasValue)
        {
            AddChange(changes, "Ngày vào ở", null, FormatDate(post.MoveInDate));
        }
        AddChange(changes, "Khu vực ngập lụt", null, FormatBool(post.FloodProne));
        if (!string.IsNullOrWhiteSpace(post.LandlordRequirements))
        {
            AddChange(changes, "Yêu cầu chủ nhà", null, FormatNullableText(post.LandlordRequirements));
        }
        AddChange(changes, "Kiểu liên hệ", null, FormatContactType(post.ContactType));
        AddChange(changes, "Tên liên hệ", null, post.ContactName);
        AddChange(changes, "Số điện thoại", null, post.ContactPhone);
        if (DeserializeList<PostServiceLineItemDto>(post.ServicePricesJson).Count > 0)
        {
            AddChange(changes, "Giá dịch vụ", null, BuildServiceSummary(post.ServicePricesJson));
        }
        if (DeserializeList<string>(post.AmenitiesJson).Count > 0)
        {
            AddChange(changes, "Tiện ích", null, BuildAmenitySummary(post.AmenitiesJson));
        }
        if (DeserializeList<string>(post.ImageUrlsJson).Count > 0)
        {
            AddChange(changes, "Ảnh bài đăng", null, BuildImageSummary(post.ImageUrlsJson));
        }
        return changes;
    }

    private static void AddChange(ICollection<PostHistoryChangeDto> changes, string label, string? before, string? after)
    {
        if (StringEquals(before, after))
        {
            return;
        }

        changes.Add(new PostHistoryChangeDto
        {
            Label = label,
            Before = before,
            After = after,
        });
    }

    private static string FormatChange(PostHistoryChangeDto change)
    {
        if (string.IsNullOrWhiteSpace(change.Before))
        {
            return $"{change.Label}: {change.After}";
        }

        if (string.IsNullOrWhiteSpace(change.After))
        {
            return $"{change.Label}: {change.Before} → đã xóa";
        }

        return $"{change.Label}: {change.Before} → {change.After}";
    }

    private static string FormatMoney(decimal value)
        => value.ToString("N0", CultureInfo.GetCultureInfo("vi-VN"));

    private static string FormatNullableInt(int? value)
        => value.HasValue ? value.Value.ToString(CultureInfo.InvariantCulture) : "—";

    private static string FormatDate(DateTime? value)
        => value.HasValue ? value.Value.ToString("dd/MM/yyyy") : "Ở ngay";

    private static string FormatBool(bool value) => value ? "Có" : "Không";

    private static string FormatNullableText(string? value) => string.IsNullOrWhiteSpace(value) ? "—" : value;

    private static string FormatMoveInType(string value)
        => StringEquals(value, "from-date") ? "Từ ngày" : "Ở ngay";

    private static string FormatContactType(string value)
        => StringEquals(value, "other") ? "Nhập thủ công" : "Theo tài khoản hiện tại";

    private static string DescribeStatus(string status, bool isLocked)
    {
        if (isLocked)
        {
            return "Đã khóa";
        }

        return StringEquals(status, "paused") ? "Tạm dừng" : "Đang hoạt động";
    }

    private static string BuildAmenitySummary(string? json)
    {
        var items = DeserializeList<string>(json ?? "[]");
        return items.Count == 0 ? "Chưa có tiện ích" : string.Join(", ", items);
    }

    private static string BuildImageSummary(string? json)
    {
        var items = DeserializeList<string>(json ?? "[]");
        return items.Count == 0 ? "Chưa có ảnh" : $"{items.Count} ảnh";
    }

    private static string BuildServiceSummary(string? json)
    {
        var items = DeserializeList<PostServiceLineItemDto>(json ?? "[]");
        if (items.Count == 0)
        {
            return "Chưa có dịch vụ";
        }

        return string.Join("; ", items.Select(item => $"{item.Name}: {FormatMoney(item.Price)} {item.Unit}".Trim()));
    }

    private static bool StringEquals(string? left, string? right)
        => string.Equals(left?.Trim(), right?.Trim(), StringComparison.Ordinal);

    private sealed class PostHistoryPayload
    {
        public string Summary { get; set; } = null!;
        public List<PostHistoryChangeDto> Changes { get; set; } = new();
    }

    private sealed class PostHistoryChangeDto
    {
        public string Label { get; set; } = null!;
        public string? Before { get; set; }
        public string? After { get; set; }
    }

    private static List<T> DeserializeList<T>(string json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return new List<T>();
        }

        try
        {
            return JsonSerializer.Deserialize<List<T>>(json, JsonOptions) ?? new List<T>();
        }
        catch
        {
            return new List<T>();
        }
    }
}
