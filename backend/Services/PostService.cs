using System.Globalization;
using System.Text;
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
    Task<PostDto?> GetByUserIdAsync(int userId, int? roomId = null);
    Task<PostDto> CreateAsync(CreatePostDto dto, int? createdByUserId = null, int? ownerUserId = null);
    Task<PostDto> RecordViewAsync(int id);
    Task<PostDto> SyncMessageCountAsync(int id, int messages);
    Task<PostDto> PublishAsync(int id);
    Task<PostDto> MarkDeletedByModerationAsync(int id, string reason, DateTime? deletedAt = null);
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
    private const string PendingReviewPostStatus = "pending_review";
    private const string DeletedPostStatus = "deleted";
    private const string ModerationDeletedSource = "trouytin_admin";
    private const string OwnerDeletedSource = "owner";
    private const string DuplicateDeletedSource = "duplicate_cleanup";

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
            post.Room != null
            && post.Room.Floor.Building.OwnerUserId == ownerUserId
            && (post.CreatedByUserId == null
                || post.CreatedByUser == null
                || post.CreatedByUser.Role != "CuDan"));
    }

    public async Task<List<PostDto>> GetAllAsync(int ownerUserId)
    {
        var posts = await FilterPostsForOwner(_context.BaiDangTimPhongs, ownerUserId)
            .AsNoTracking()
            // Van hien bai da bi admin TroUyTin xoa de chu nha thay trang thai va ly do.
            // Cac ban deleted do chong trung/cleanup thi an di de tranh nhieu ban trung nhau.
            .Where(post => post.Status != DeletedPostStatus
                || post.DeletionSource == ModerationDeletedSource
                || post.DeletionSource == OwnerDeletedSource)
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

    public async Task<PostDto?> GetByUserIdAsync(int userId, int? roomId = null)
    {
        var query = _context.BaiDangTimPhongs
            .AsNoTracking()
            .Include(item => item.CreatedByUser)
            .Include(item => item.Room)
                .ThenInclude(room => room!.Floor)
                    .ThenInclude(floor => floor.Building)
            .Where(item => item.CreatedByUserId == userId)
            .Where(item => item.Status != DeletedPostStatus);

        if (roomId.HasValue)
        {
            query = query.Where(item => item.RoomId == roomId.Value);
        }

        var post = await query
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

        User? creator = null;
        var requiresReview = false;
        var isCreatingSharedPost = false;
        if (createdByUserId.HasValue)
        {
            creator = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(item => item.Id == createdByUserId.Value);
            requiresReview = IsResident(creator);
            isCreatingSharedPost = requiresReview;
            var effectiveOwnerUserId = ownerUserId ?? creator?.OwnerUserId ?? createdByUserId.Value;
            if (isCreatingSharedPost)
            {
                if (creator?.OwnerUserId is > 0 && room.Floor.Building.OwnerUserId != creator.OwnerUserId)
                {
                    throw new InvalidOperationException("Bạn không có quyền đăng bài cho phòng này");
                }
            }
            else if (effectiveOwnerUserId > 0 && room.Floor.Building.OwnerUserId != effectiveOwnerUserId)
            {
                throw new InvalidOperationException("Bạn không có quyền đăng bài cho phòng này");
            }
        }

        if (!isCreatingSharedPost)
        {
            ValidateOwnerRentalPost(dto, room);
        }

        var existingPosts = await _context.BaiDangTimPhongs
            .Include(item => item.CreatedByUser)
            .Where(item => item.RoomId == room.Id)
            .OrderByDescending(item => item.CreatedAt)
            .ToListAsync();
        if (existingPosts.Count > 0)
        {
            var liveExistingPosts = existingPosts
                .Where(item => !StringEquals(item.Status, DeletedPostStatus))
                .ToList();

            if (createdByUserId.HasValue)
            {
                var sameCreatorPosts = existingPosts
                    .Where(item => item.CreatedByUserId == createdByUserId.Value)
                    .Where(item => IsSharedRoommatePost(item) == isCreatingSharedPost)
                    .ToList();
                var hasLivePostFromAnotherCreator = liveExistingPosts
                    .Where(item => IsSharedRoommatePost(item) == isCreatingSharedPost)
                    .Any(item => item.CreatedByUserId != createdByUserId.Value);

                if (hasLivePostFromAnotherCreator)
                {
                    throw new InvalidOperationException("Phòng này đã có bài đăng");
                }

                if (sameCreatorPosts.Count > 0)
                {
                    var submittedAt = DateTime.UtcNow;
                    var postToUpdate = sameCreatorPosts
                        .OrderBy(item => StringEquals(item.Status, DeletedPostStatus) ? 1 : 0)
                        .ThenByDescending(item => item.CreatedAt)
                        .First();

                    ApplySubmissionData(postToUpdate, dto, room, submittedAt, requiresReview);
                    postToUpdate.CreatedByUserId ??= createdByUserId;

                    foreach (var duplicate in sameCreatorPosts.Where(item => item.Id != postToUpdate.Id))
                    {
                        duplicate.IsLocked = true;
                        duplicate.Status = DeletedPostStatus;
                        duplicate.RoomStatus = room.Status;
                        duplicate.DeletionSource = DuplicateDeletedSource;
                    }

                    await _context.SaveChangesAsync();
                    await LogHistoryAsync(
                        createdByUserId,
                        postToUpdate.Id,
                        "UPDATE",
                        $"Dang lai bai dang cho phong {postToUpdate.RoomCode}",
                        BuildCreateChanges(postToUpdate));

                    postToUpdate.Room = room;
                    postToUpdate.CreatedByUser ??= creator;
                    return MapToDto(postToUpdate);
                }
                else if (liveExistingPosts.Any(item => IsSharedRoommatePost(item) == isCreatingSharedPost))
                {
                    throw new InvalidOperationException("Phòng này đã có bài đăng");
                }
            }
            else if (liveExistingPosts.Any(item => !IsSharedRoommatePost(item)))
            {
                throw new InvalidOperationException("Phòng này đã có bài đăng");
            }
        }

        var now = DateTime.UtcNow;
        var sanitizedImageUrls = SanitizeImageUrls(dto.ImageUrls);
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
            IsLocked = requiresReview,
            Status = requiresReview ? PendingReviewPostStatus : ActivePostStatus,
            RoomStatus = room.Status,
            MoveInType = dto.MoveInType,
            MoveInDate = dto.MoveInDate,
            FloodProne = dto.FloodProne,
            LandlordRequirements = string.IsNullOrWhiteSpace(dto.LandlordRequirements) ? null : dto.LandlordRequirements.Trim(),
            ContactType = dto.ContactType,
            ContactName = dto.ContactName.Trim(),
            ContactPhone = dto.ContactPhone.Trim(),
            ServicePricesJson = JsonSerializer.Serialize(dto.ServicePrices, JsonOptions),
            ImageUrlsJson = JsonSerializer.Serialize(sanitizedImageUrls, JsonOptions),
            AmenitiesJson = JsonSerializer.Serialize(dto.Amenities, JsonOptions),
            CoverImageUrl = sanitizedImageUrls.FirstOrDefault(),
            CreatedByUserId = createdByUserId,
        };

        await _context.BaiDangTimPhongs.AddAsync(post);
        await _context.SaveChangesAsync();
        await LogHistoryAsync(createdByUserId, post.Id, "CREATE", BuildCreateSummary(post), BuildCreateChanges(post));

        post.Room = room;
        post.CreatedByUser = creator;
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

    public async Task<PostDto> PublishAsync(int id)
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

        var oldIsLocked = post.IsLocked;
        var oldStatus = post.Status;

        post.RoomStatus = post.Room?.Status ?? post.RoomStatus;
        post.IsLocked = false;
        post.Status = ActivePostStatus;
        ClearModerationDeletion(post);
        await _context.SaveChangesAsync();

        if (oldIsLocked != post.IsLocked || oldStatus != post.Status)
        {
            await LogHistoryAsync(null, post.Id, "APPROVE", "Duyet hien thi bai dang", new[]
            {
                new PostHistoryChangeDto
                {
                    Label = "Trang thai bai dang",
                    Before = DescribeStatus(oldStatus, oldIsLocked),
                    After = DescribeStatus(post.Status, post.IsLocked),
                }
            });
        }

        return MapToDto(post);
    }

    public async Task<PostDto> MarkDeletedByModerationAsync(int id, string reason, DateTime? deletedAt = null)
    {
        var trimmedReason = string.IsNullOrWhiteSpace(reason) ? "Vi pham quy dinh hien thi" : reason.Trim();
        if (trimmedReason.Length > 500)
        {
            trimmedReason = trimmedReason[..500];
        }

        var post = await _context.BaiDangTimPhongs
            .Include(item => item.CreatedByUser)
            .Include(item => item.Room)
                .ThenInclude(room => room!.Floor)
                    .ThenInclude(floor => floor.Building)
            .FirstOrDefaultAsync(item => item.Id == id);

        if (post == null)
        {
            throw new InvalidOperationException("BÃ i Ä‘Äƒng khÃ´ng tá»“n táº¡i");
        }

        var oldIsLocked = post.IsLocked;
        var oldStatus = post.Status;
        var effectiveDeletedAt = deletedAt ?? DateTime.UtcNow;

        post.RoomStatus = post.Room?.Status ?? post.RoomStatus;
        post.IsLocked = true;
        post.Status = DeletedPostStatus;
        post.ModerationDeletedAt = effectiveDeletedAt;
        post.ModerationDeletedReason = trimmedReason;
        post.DeletionSource = ModerationDeletedSource;
        post.PostDate = effectiveDeletedAt;

        await _context.SaveChangesAsync();

        await LogHistoryAsync(null, post.Id, "MODERATION_DELETE", "Admin TroUyTin xoa bai dang", new[]
        {
            new PostHistoryChangeDto
            {
                Label = "Trang thai bai dang",
                Before = DescribeStatus(oldStatus, oldIsLocked),
                After = DescribeStatus(post.Status, post.IsLocked),
            },
            new PostHistoryChangeDto
            {
                Label = "Ly do xoa",
                Before = "",
                After = trimmedReason,
            },
        });

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

        if (IsResidentOwnedPost(post, changedByUserId) && StringEquals(post.Status, PendingReviewPostStatus))
        {
            throw new InvalidOperationException("Bai dang dang cho duyet, khong the mo khoa");
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
            var sanitizedImageUrls = SanitizeImageUrls(dto.ImageUrls);
            var nextImageUrls = JsonSerializer.Serialize(sanitizedImageUrls, JsonOptions);
            if (!StringEquals(post.ImageUrlsJson, nextImageUrls))
            {
                AddChange(changes, "Ảnh bài đăng", BuildImageSummary(post.ImageUrlsJson), BuildImageSummary(nextImageUrls));
            }
            post.ImageUrlsJson = nextImageUrls;
            post.CoverImageUrl = sanitizedImageUrls.FirstOrDefault();
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

        if (changes.Count > 0)
        {
            // Moc cap nhat cuoi: bump cho moi lan sua (ke ca bai do Admin/QuanLy dang)
            // de TroUyTin phat hien bai duoc sua lai sau khi bi xoa -> mo lai de duyet.
            post.PostDate = DateTime.UtcNow;
        }

        if (changes.Count > 0 && StringEquals(post.DeletionSource, ModerationDeletedSource))
        {
            var oldIsLocked = post.IsLocked;
            var oldStatus = post.Status;
            post.RoomStatus = post.Room?.Status ?? post.RoomStatus;
            post.IsLocked = true;
            post.Status = PendingReviewPostStatus;
            ClearModerationDeletion(post);
            AddChange(
                changes,
                "Trang thai bai dang",
                DescribeStatus(oldStatus, oldIsLocked),
                DescribeStatus(post.Status, post.IsLocked));
        }
        else if (changes.Count > 0 && IsResidentOwnedPost(post, changedByUserId))
        {
            var oldIsLocked = post.IsLocked;
            var oldStatus = post.Status;
            post.RoomStatus = post.Room?.Status ?? post.RoomStatus;
            post.IsLocked = true;
            post.Status = PendingReviewPostStatus;
            ClearModerationDeletion(post);
            AddChange(
                changes,
                "Trang thai bai dang",
                DescribeStatus(oldStatus, oldIsLocked),
                DescribeStatus(post.Status, post.IsLocked));
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

        return logs.Select((log, index) => MapHistoryEntry(log, index == 0, logs.Count - index)).ToList();
    }

    public async Task DeleteAsync(int id, int ownerUserId)
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

        var isResidentOwnedPost = post.CreatedByUserId == ownerUserId
            && string.Equals(post.CreatedByUser?.Role, "CuDan", StringComparison.OrdinalIgnoreCase);
        var isOwnerRentalPost = post.Room?.Floor.Building.OwnerUserId == ownerUserId
            && !IsSharedRoommatePost(post);

        if (!isResidentOwnedPost && !isOwnerRentalPost)
        {
            throw new InvalidOperationException("Bài đăng không tồn tại");
        }

        var duplicatePosts = await _context.BaiDangTimPhongs
            .Where(item => item.RoomId == post.RoomId && item.CreatedByUserId == post.CreatedByUserId)
            .ToListAsync();

        if (isResidentOwnedPost)
        {
            var postsToHide = duplicatePosts.Count > 0 ? duplicatePosts : new List<BaiDangTimPhong> { post };
            foreach (var item in postsToHide)
            {
                item.IsLocked = true;
                item.Status = DeletedPostStatus;
                item.RoomStatus = post.RoomStatus;
                item.DeletionSource = OwnerDeletedSource;
            }
        }
        else if (duplicatePosts.Count > 0)
        {
            _context.BaiDangTimPhongs.RemoveRange(duplicatePosts);
        }
        else
        {
            _context.BaiDangTimPhongs.Remove(post);
        }
        await _context.SaveChangesAsync();
    }

    private static void ApplySubmissionData(BaiDangTimPhong post, CreatePostDto dto, Room room, DateTime submittedAt, bool requiresReview)
    {
        post.RoomId = room.Id;
        post.RoomCode = room.RoomCode;
        post.BuildingName = room.Floor.Building.BuildingName;
        post.FloorNumber = room.Floor.FloorNumber;
        post.Area = room.Area;
        post.MaxOccupants = room.MaxOccupants;
        post.Title = dto.Title.Trim();
        post.BaseRentPrice = dto.BaseRentPrice;
        post.PostDate = submittedAt;
        post.IsLocked = requiresReview;
        post.Status = requiresReview ? PendingReviewPostStatus : ActivePostStatus;
        post.RoomStatus = room.Status;
        post.MoveInType = dto.MoveInType;
        post.MoveInDate = dto.MoveInDate;
        post.FloodProne = dto.FloodProne;
        post.LandlordRequirements = string.IsNullOrWhiteSpace(dto.LandlordRequirements) ? null : dto.LandlordRequirements.Trim();
        post.ContactType = dto.ContactType;
        post.ContactName = dto.ContactName.Trim();
        post.ContactPhone = dto.ContactPhone.Trim();
        post.ServicePricesJson = JsonSerializer.Serialize(dto.ServicePrices, JsonOptions);
        var sanitizedImageUrls = SanitizeImageUrls(dto.ImageUrls);
        post.ImageUrlsJson = JsonSerializer.Serialize(sanitizedImageUrls, JsonOptions);
        post.AmenitiesJson = JsonSerializer.Serialize(dto.Amenities, JsonOptions);
        post.CoverImageUrl = sanitizedImageUrls.FirstOrDefault();
        ClearModerationDeletion(post);
    }

    private static void ValidateOwnerRentalPost(CreatePostDto dto, Room room)
    {
        if (!IsOccupiedRoomStatus(room.Status))
        {
            return;
        }

        if (!StringEquals(dto.MoveInType, "from-date") || !dto.MoveInDate.HasValue)
        {
            throw new InvalidOperationException("Phòng đang được thuê, vui lòng chọn ngày có thể vào ở để đăng bài phòng sắp trống.");
        }
    }

    private static bool IsOccupiedRoomStatus(string? status)
    {
        var normalized = NormalizeText(status);
        return normalized == "da thue"
            || normalized == "rented"
            || normalized == "occupied";
    }

    private static bool IsResident(User? user)
        => string.Equals(user?.Role, "CuDan", StringComparison.OrdinalIgnoreCase);

    private static bool IsSharedRoommatePost(BaiDangTimPhong post)
        => IsResident(post.CreatedByUser);

    private static bool IsResidentOwnedPost(BaiDangTimPhong post, int? userId)
        => userId.HasValue
            && post.CreatedByUserId == userId.Value
            && IsResident(post.CreatedByUser);

    private static PostDto MapToDto(BaiDangTimPhong post)
    {
        var postImages = DeserializeList<string>(post.ImageUrlsJson);
        var roomImages = post.Room != null ? DeserializeList<string>(post.Room.ImageUrlsJson) : new List<string>();
        var allImages = DistinctImages(roomImages, postImages);

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
            ImageUrls = postImages,
            RoomImageUrls = roomImages,
            TotalImageCount = allImages.Count,
            Amenities = DeserializeList<string>(post.AmenitiesJson ?? "[]"),
            CoverImageUrl = post.CoverImageUrl,
            CreatedByUserId = post.CreatedByUserId,
            CreatedByUserRole = post.CreatedByUser?.Role,
            ModerationDeletedAt = post.ModerationDeletedAt,
            ModerationDeletedReason = post.ModerationDeletedReason,
            DeletionSource = post.DeletionSource,
        };
    }

    private static void ClearModerationDeletion(BaiDangTimPhong post)
    {
        post.ModerationDeletedAt = null;
        post.ModerationDeletedReason = null;
        post.DeletionSource = null;
    }

    private static List<string> DistinctImages(params IEnumerable<string>[] imageGroups)
    {
        var result = new List<string>();
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var image in imageGroups.SelectMany(group => group))
        {
            if (string.IsNullOrWhiteSpace(image))
            {
                continue;
            }

            var normalized = image.Trim();
            if (seen.Add(normalized))
            {
                result.Add(normalized);
            }
        }

        return result;
    }

    private const int MaxImageUrls = 6;

    private static List<string> SanitizeImageUrls(IEnumerable<string>? urls)
    {
        var cleaned = DistinctImages(urls ?? Enumerable.Empty<string>());
        return cleaned.Count > MaxImageUrls ? cleaned.Take(MaxImageUrls).ToList() : cleaned;
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
        if (StringEquals(status, PendingReviewPostStatus))
        {
            return "Cho duyet";
        }

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

    private static string NormalizeText(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var normalized = value.Trim().ToLowerInvariant().Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(normalized.Length);
        foreach (var c in normalized)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
            {
                builder.Append(c == 'đ' ? 'd' : c);
            }
        }

        return builder.ToString().Normalize(NormalizationForm.FormC);
    }

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
