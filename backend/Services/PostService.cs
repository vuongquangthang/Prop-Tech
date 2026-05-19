using System.Text.Json;
using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public interface IPostService
{
    Task<List<PostDto>> GetAllAsync();
    Task<PostDto?> GetByIdAsync(int id);
    Task<PostDto?> GetByUserIdAsync(int userId);
    Task<PostDto> CreateAsync(CreatePostDto dto, int? createdByUserId = null);
    Task<PostDto> UpdateLockAsync(int id, bool isLocked);
    Task<PostDto> UpdateAsync(int id, UpdatePostDto dto);
    Task DeleteAsync(int id);
}

public class PostService : IPostService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    private readonly ApplicationDbContext _context;

    public PostService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<PostDto>> GetAllAsync()
    {
        var posts = await _context.BaiDangTimPhongs
            .AsNoTracking()
            .OrderByDescending(post => post.CreatedAt)
            .ToListAsync();

        return posts.Select(MapToDto).ToList();
    }

    public async Task<PostDto?> GetByIdAsync(int id)
    {
        var post = await _context.BaiDangTimPhongs
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == id);

        return post == null ? null : MapToDto(post);
    }

    public async Task<PostDto?> GetByUserIdAsync(int userId)
    {
        var post = await _context.BaiDangTimPhongs
            .AsNoTracking()
            .Where(item => item.CreatedByUserId == userId)
            .OrderByDescending(item => item.CreatedAt)
            .FirstOrDefaultAsync();

        return post == null ? null : MapToDto(post);
    }

    public async Task<PostDto> CreateAsync(CreatePostDto dto, int? createdByUserId = null)
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

        var now = DateTime.UtcNow;
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
            IsLocked = false,
            Status = "active",
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
            CoverImageUrl = dto.ImageUrls.FirstOrDefault(),
            CreatedByUserId = createdByUserId,
        };

        await _context.BaiDangTimPhongs.AddAsync(post);
        await _context.SaveChangesAsync();

        return MapToDto(post);
    }

    public async Task<PostDto> UpdateLockAsync(int id, bool isLocked)
    {
        var post = await _context.BaiDangTimPhongs.FirstOrDefaultAsync(item => item.Id == id);
        if (post == null)
        {
            throw new InvalidOperationException("Bài đăng không tồn tại");
        }

        post.IsLocked = isLocked;
        post.Status = isLocked ? "paused" : "active";
        await _context.SaveChangesAsync();

        return MapToDto(post);
    }

    public async Task<PostDto> UpdateAsync(int id, UpdatePostDto dto)
    {
        var post = await _context.BaiDangTimPhongs.FirstOrDefaultAsync(item => item.Id == id);
        if (post == null)
        {
            throw new InvalidOperationException("Bài đăng không tồn tại");
        }

        if (!string.IsNullOrWhiteSpace(dto.Title)) post.Title = dto.Title.Trim();
        if (dto.BaseRentPrice.HasValue) post.BaseRentPrice = dto.BaseRentPrice.Value;
        if (!string.IsNullOrWhiteSpace(dto.MoveInType)) post.MoveInType = dto.MoveInType;
        if (dto.MoveInDate.HasValue) post.MoveInDate = dto.MoveInDate;
        if (dto.FloodProne.HasValue) post.FloodProne = dto.FloodProne.Value;
        if (dto.LandlordRequirements != null) post.LandlordRequirements = string.IsNullOrWhiteSpace(dto.LandlordRequirements) ? null : dto.LandlordRequirements.Trim();
        if (!string.IsNullOrWhiteSpace(dto.ContactType)) post.ContactType = dto.ContactType;
        if (!string.IsNullOrWhiteSpace(dto.ContactName)) post.ContactName = dto.ContactName.Trim();
        if (!string.IsNullOrWhiteSpace(dto.ContactPhone)) post.ContactPhone = dto.ContactPhone.Trim();

        if (dto.ServicePrices != null)
        {
            post.ServicePricesJson = JsonSerializer.Serialize(dto.ServicePrices, JsonOptions);
        }

        if (dto.ImageUrls != null)
        {
            post.ImageUrlsJson = JsonSerializer.Serialize(dto.ImageUrls, JsonOptions);
            post.CoverImageUrl = dto.ImageUrls.FirstOrDefault();
        }

        await _context.SaveChangesAsync();

        return MapToDto(post);
    }

    public async Task DeleteAsync(int id)
    {
        var post = await _context.BaiDangTimPhongs.FirstOrDefaultAsync(item => item.Id == id);
        if (post == null)
        {
            throw new InvalidOperationException("Bài đăng không tồn tại");
        }

        _context.BaiDangTimPhongs.Remove(post);
        await _context.SaveChangesAsync();
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
            Title = post.Title,
            BaseRentPrice = post.BaseRentPrice,
            PostDate = post.PostDate,
            CreatedAt = post.CreatedAt,
            Views = post.Views,
            Messages = post.Messages,
            IsLocked = post.IsLocked,
            Status = post.Status,
            RoomStatus = post.RoomStatus,
            MoveInType = post.MoveInType,
            MoveInDate = post.MoveInDate,
            FloodProne = post.FloodProne,
            LandlordRequirements = post.LandlordRequirements,
            ContactType = post.ContactType,
            ContactName = post.ContactName,
            ContactPhone = post.ContactPhone,
            ServicePrices = DeserializeList<PostServiceLineItemDto>(post.ServicePricesJson),
            ImageUrls = DeserializeList<string>(post.ImageUrlsJson),
            CoverImageUrl = post.CoverImageUrl,
            CreatedByUserId = post.CreatedByUserId,
        };
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