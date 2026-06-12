using System.Globalization;
using System.Text;
using System.Text.Json;
using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/public/rooms")]
public class PublicRoomsController : ControllerBase
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;

    public PublicRoomsController(ApplicationDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    [HttpGet]
    public async Task<ActionResult<List<PublicRoomDto>>> GetRooms()
    {
        return Ok(await LoadPublicRoomsAsync());
    }

    [HttpGet("/api/internal/public/rooms")]
    public async Task<ActionResult<List<PublicRoomDto>>> GetRoomsForModeration()
    {
        if (!IsValidInternalKey())
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "Invalid internal API key" });
        }

        return Ok(await LoadPublicRoomsAsync(includeLockedPosts: true, includeAutoRoomListings: false));
    }

    [HttpGet("search")]
    public async Task<ActionResult<List<PublicRoomSearchResultDto>>> SearchRooms([FromQuery] PublicRoomSearchQueryDto query)
    {
        var rooms = await LoadPublicRoomsAsync();
        return Ok(BuildSearchResults(rooms, query));
    }

    [HttpGet("/api/internal/public/rooms/search")]
    public async Task<ActionResult<List<PublicRoomSearchResultDto>>> SearchRoomsForModeration([FromQuery] PublicRoomSearchQueryDto query)
    {
        if (!IsValidInternalKey())
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "Invalid internal API key" });
        }

        var rooms = await LoadPublicRoomsAsync(includeLockedPosts: true, includeAutoRoomListings: false);
        return Ok(BuildSearchResults(rooms, query));
    }

    private static List<PublicRoomSearchResultDto> BuildSearchResults(List<PublicRoomDto> rooms, PublicRoomSearchQueryDto query)
    {
        var ranked = rooms
            .Where(room => MatchesHardFilters(room, query))
            .Select(room => new PublicRoomSearchResultDto
            {
                Room = room,
                Match = ScoreRoom(room, query),
            })
            .OrderByDescending(item => item.Match.Score)
            .ThenByDescending(item => item.Room.PostedAt)
            .ToList();

        if (query.Limit is > 0)
        {
            ranked = ranked.Take(Math.Min(query.Limit.Value, 100)).ToList();
        }

        return ranked;
    }

    private async Task<List<PublicRoomDto>> LoadPublicRoomsAsync(bool includeLockedPosts = false, bool includeAutoRoomListings = true)
    {
        var posts = await _context.BaiDangTimPhongs
            .AsNoTracking()
            .Include(item => item.Room)
                .ThenInclude(room => room!.Floor)
                    .ThenInclude(floor => floor.Building)
            .Include(item => item.CreatedByUser)
                .ThenInclude(user => user!.Resident)
            .Include(item => item.CreatedByUser)
                .ThenInclude(user => user!.OwnerUser)
            .Where(item => includeLockedPosts
                ? item.Status == "active" || item.Status == "paused" || item.IsLocked
                : !item.IsLocked && item.Status == "active")
            .OrderByDescending(item => item.CreatedAt)
            .ToListAsync();

        if (!includeLockedPosts)
        {
            posts = posts
                .Where(item => !IsOccupiedStatus(item.Room?.Status ?? item.RoomStatus))
                .ToList();
        }

        var postedRoomIds = posts.Select(item => item.RoomId).ToHashSet();

        var rooms = includeAutoRoomListings
            ? await _context.Rooms
            .AsNoTracking()
            .Include(item => item.Floor)
                .ThenInclude(item => item.Building)
                    .ThenInclude(building => building.OwnerUser)
                        .ThenInclude(owner => owner!.Resident)
            .Where(item =>
                (item.Status == "Trống" || item.Status == "Trong" || item.Status == "available")
                && !postedRoomIds.Contains(item.Id))
            .OrderBy(item => item.RoomCode)
            .ToListAsync()
            : new List<Room>();

        var serviceMap = await LoadServiceMapAsync(posts, rooms);

        var result = posts
            .Select(item => MapPost(item))
            .Concat(rooms.Select(item => MapRoom(item, serviceMap)))
            .ToList();

        return result;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<PublicRoomDto>> GetRoom(string id)
    {
        if (TryParsePublicId(id, "post-", out var postId))
        {
            var post = await _context.BaiDangTimPhongs
                .AsNoTracking()
                .Include(item => item.Room)
                    .ThenInclude(room => room!.Floor)
                        .ThenInclude(floor => floor.Building)
                .Include(item => item.CreatedByUser)
                    .ThenInclude(user => user!.Resident)
                .Include(item => item.CreatedByUser)
                    .ThenInclude(user => user!.OwnerUser)
                .FirstOrDefaultAsync(item => item.Id == postId && !item.IsLocked && item.Status == "active");

            return post == null ? NotFound() : Ok(MapPost(post));
        }

        if (TryParsePublicId(id, "room-", out var roomId))
        {
            var room = await _context.Rooms
                .AsNoTracking()
                .Include(item => item.Floor)
                    .ThenInclude(item => item.Building)
                        .ThenInclude(building => building.OwnerUser)
                            .ThenInclude(owner => owner!.Resident)
                .FirstOrDefaultAsync(item =>
                    item.Id == roomId
                    && (item.Status == "Trống" || item.Status == "Trong" || item.Status == "available"));

            if (room == null)
            {
                return NotFound();
            }

            var serviceMap = await LoadServiceMapAsync(Array.Empty<BaiDangTimPhong>(), new[] { room });
            return Ok(MapRoom(room, serviceMap));
        }

        return NotFound();
    }

    private async Task<Dictionary<int, Service>> LoadServiceMapAsync(IEnumerable<BaiDangTimPhong> posts, IEnumerable<Room> rooms)
    {
        var serviceIds = rooms
            .SelectMany(room => DeserializeList<int>(room.ServiceIdsJson))
            .Distinct()
            .ToList();

        if (serviceIds.Count == 0)
        {
            return new Dictionary<int, Service>();
        }

        return await _context.Services
            .AsNoTracking()
            .Where(service => serviceIds.Contains(service.Id))
            .ToDictionaryAsync(service => service.Id);
    }

    private bool IsValidInternalKey()
    {
        var configured = _configuration["InternalApiKey"] ?? "dev-internal-key";
        return Request.Headers.TryGetValue("X-Internal-Api-Key", out var apiKey)
            && apiKey == configured;
    }

    private static bool IsOccupiedStatus(string? status)
    {
        var normalized = (status ?? string.Empty).Trim().ToLowerInvariant();
        return normalized.Contains("thu")
            || normalized.Contains("thue")
            || normalized is "rented" or "occupied";
    }

    private static PublicRoomDto MapPost(BaiDangTimPhong post)
    {
        var room = post.Room;
        var building = room?.Floor.Building;
        var address = building?.Address ?? post.BuildingName;
        var location = BuildLocation(address, post.BuildingName, post.RoomCode);
        var locationParts = ParseLocation(address);
        var unitType = MapUnitType(room?.RoomType);
        var servicePrices = DeserializeList<PostServiceLineItemDto>(post.ServicePricesJson)
            .Select(item => new PublicRoomServiceDto
            {
                Name = item.Name,
                Price = item.Price,
                Unit = item.Unit,
            })
            .ToList();
        var images = DeserializeList<string>(post.ImageUrlsJson);
        if (images.Count == 0 && room != null)
        {
            images = DeserializeList<string>(room.ImageUrlsJson);
        }

        var amenities = DeserializeList<string>(post.AmenitiesJson ?? "[]");
        if (amenities.Count == 0 && room != null)
        {
            amenities = DeserializeList<string>(room.AmenitiesJson);
        }

        var hostRequirements = SplitRequirements(post.LandlordRequirements);
        var maxOccupants = post.MaxOccupants ?? room?.MaxOccupants ?? 1;
        var currentOccupants = post.CurrentOccupants ?? 0;
        var isShared = string.Equals(post.CreatedByUser?.Role, "CuDan", StringComparison.OrdinalIgnoreCase)
            || currentOccupants > 0;

        var availableNow = !string.Equals(post.MoveInType, "from-date", StringComparison.OrdinalIgnoreCase);
        var price = post.BaseRentPrice;

        return new PublicRoomDto
        {
            Id = $"post-{post.Id}",
            Source = "post",
            RoomId = post.RoomId,
            PostId = post.Id,
            IsLocked = post.IsLocked,
            Status = post.Status,
            RoomStatus = room?.Status ?? post.RoomStatus,
            Type = isShared ? "shared" : availableNow ? "whole" : "available-from",
            UnitType = unitType,
            RoomType = unitType == "apartment" ? "apartment" : "single-room",
            Title = post.Title,
            Images = images,
            Location = location,
            City = locationParts.City,
            District = locationParts.District,
            Ward = locationParts.Ward,
            Price = price,
            Size = post.Area ?? room?.Area ?? 0,
            MaxOccupants = maxOccupants,
            Services = servicePrices,
            ServiceFee = servicePrices.Where(item => IsMonthlyFee(item.Unit)).Sum(item => item.Price),
            AvailableNow = availableNow,
            AvailableFrom = post.MoveInDate,
            PostedAt = post.PostDate,
            Views = post.Views,
            HygieneScore = room?.HasPrivateBathroom == true ? 4 : 0,
            LivingRooms = room?.LivingRoomCount ?? 0,
            Bedrooms = room?.BedroomCount ?? 1,
            FloodRisk = post.FloodProne,
            Amenities = amenities,
            HostRequirements = hostRequirements,
            Description = FirstNonEmpty(room?.Description, post.LandlordRequirements, post.Title),
            Host = BuildPostContact(post),
            Shared = isShared
                ? BuildSharedRoom(post, room, servicePrices, maxOccupants, price)
                : null,
            Coords = GuessCoords(locationParts.City, locationParts.District),
        };
    }

    private static PublicRoomDto MapRoom(Room room, IReadOnlyDictionary<int, Service> serviceMap)
    {
        var building = room.Floor.Building;
        var address = building.Address;
        var location = BuildLocation(address, building.BuildingName, room.RoomCode);
        var locationParts = ParseLocation(address);
        var unitType = MapUnitType(room.RoomType);
        var images = DeserializeList<string>(room.ImageUrlsJson);
        var amenities = DeserializeList<string>(room.AmenitiesJson);
        var services = DeserializeList<int>(room.ServiceIdsJson)
            .Where(serviceMap.ContainsKey)
            .Select(id =>
            {
                var service = serviceMap[id];
                return new PublicRoomServiceDto
                {
                    Name = service.Name,
                    Price = service.CommonUnitPrice ?? 0,
                    Unit = service.Unit ?? "",
                };
            })
            .ToList();

        return new PublicRoomDto
        {
            Id = $"room-{room.Id}",
            Source = "room",
            RoomId = room.Id,
            IsLocked = false,
            Status = "active",
            RoomStatus = room.Status,
            Type = "whole",
            UnitType = unitType,
            RoomType = unitType == "apartment" ? "apartment" : "single-room",
            Title = BuildRoomTitle(room, building.BuildingName),
            Images = images,
            Location = location,
            City = locationParts.City,
            District = locationParts.District,
            Ward = locationParts.Ward,
            Price = room.DefaultRentPrice ?? 0,
            Size = room.Area ?? 0,
            MaxOccupants = room.MaxOccupants ?? 1,
            Services = services,
            ServiceFee = services.Where(item => IsMonthlyFee(item.Unit)).Sum(item => item.Price),
            AvailableNow = true,
            PostedAt = DateTime.UtcNow,
            HygieneScore = room.HasPrivateBathroom ? 4 : 0,
            LivingRooms = room.LivingRoomCount ?? 0,
            Bedrooms = room.BedroomCount ?? 1,
            FloodRisk = false,
            Amenities = amenities,
            HostRequirements = new List<string>(),
            Description = room.Description ?? "",
            Host = new PublicRoomContactDto
            {
                Name = FirstNonEmpty(building.OwnerUser?.DisplayName, building.OwnerUser?.Resident?.FullName, building.BuildingName),
                Phone = FirstNonEmpty(building.OwnerUser?.PhoneNumber, "1900 xxxx"),
                Avatar = building.OwnerUser?.AvatarUrl ?? "",
                UserId = building.OwnerUserId.HasValue ? $"user-{building.OwnerUserId.Value}" : $"building-{building.Id}",
            },
            Coords = GuessCoords(locationParts.City, locationParts.District),
        };
    }

    private static PublicSharedRoomDto BuildSharedRoom(
        BaiDangTimPhong post,
        Room? room,
        List<PublicRoomServiceDto> services,
        int maxOccupants,
        decimal basePrice)
    {
        var occupantsForSplit = Math.Max(2, maxOccupants);
        var sharedPrice = Math.Round(basePrice / occupantsForSplit, 0);

        return new PublicSharedRoomDto
        {
            OriginalPrice = basePrice,
            SharedPrice = sharedPrice,
            MaxOccupants = maxOccupants,
            HasPrivateBathroom = room?.HasPrivateBathroom ?? false,
            Services = services,
            ResidentRequirements = SplitRequirements(post.LandlordRequirements),
            Resident = new PublicRoomContactDto
            {
                Name = BuildPostContactName(post),
                Phone = BuildPostContactPhone(post),
                Avatar = post.CreatedByUser?.AvatarUrl ?? "",
                UserId = BuildPostContactUserId(post),
            },
        };
    }

    private static PublicRoomContactDto BuildPostContact(BaiDangTimPhong post)
    {
        return new PublicRoomContactDto
        {
            Name = BuildPostContactName(post),
            Phone = BuildPostContactPhone(post),
            Avatar = post.CreatedByUser?.AvatarUrl ?? "",
            UserId = BuildPostContactUserId(post),
        };
    }

    private static string BuildPostContactName(BaiDangTimPhong post)
    {
        if (IsOwnerAccountPost(post))
        {
            return FirstNonEmpty(
                post.CreatedByUser?.OwnerUser?.DisplayName,
                post.CreatedByUser?.DisplayName,
                post.ContactName,
                post.CreatedByUser?.PhoneNumber,
                "Chủ nhà"
            );
        }

        return FirstNonEmpty(
            post.CreatedByUser?.Resident?.FullName,
            post.ContactName,
            post.CreatedByUser?.PhoneNumber,
            "Người đăng"
        );
    }

    private static string BuildPostContactPhone(BaiDangTimPhong post)
    {
        return FirstNonEmpty(
            post.ContactPhone,
            post.CreatedByUser?.Resident?.PhoneNumber,
            post.CreatedByUser?.PhoneNumber,
            "1900 xxxx"
        );
    }

    private static bool IsOwnerAccountPost(BaiDangTimPhong post)
    {
        var role = post.CreatedByUser?.Role;
        return string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase)
            || string.Equals(role, "QuanLy", StringComparison.OrdinalIgnoreCase)
            || string.Equals(role, "KeToan", StringComparison.OrdinalIgnoreCase)
            || string.Equals(role, "NhanVien", StringComparison.OrdinalIgnoreCase);
    }

    private static string BuildPostContactUserId(BaiDangTimPhong post)
    {
        return post.CreatedByUserId.HasValue ? $"user-{post.CreatedByUserId.Value}" : $"post-contact-{post.Id}";
    }

    private static bool MatchesHardFilters(PublicRoomDto room, PublicRoomSearchQueryDto query)
    {
        if (!MatchKeyword(room, query.Keyword))
        {
            return false;
        }

        if (!string.IsNullOrWhiteSpace(query.RoomType))
        {
            if (string.Equals(query.RoomType, "shared", StringComparison.OrdinalIgnoreCase))
            {
                if (!string.Equals(room.Type, "shared", StringComparison.OrdinalIgnoreCase))
                {
                    return false;
                }
            }
            else if (!string.Equals(room.RoomType, query.RoomType, StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }
        }

        var searchPrice = GetSearchPrice(room);

        if (query.MinPrice is > 0 && searchPrice < query.MinPrice.Value)
        {
            return false;
        }

        if (query.MaxPrice is > 0 && searchPrice > query.MaxPrice.Value)
        {
            return false;
        }

        if (query.MinArea is > 0 && room.Size < query.MinArea.Value)
        {
            return false;
        }

        if (query.MaxArea is > 0 && room.Size > query.MaxArea.Value)
        {
            return false;
        }

        if (query.AvailableNow == true && !room.AvailableNow)
        {
            return false;
        }

        return true;
    }

    private static bool MatchKeyword(PublicRoomDto room, string? keyword)
    {
        var query = NormalizeForSearch(keyword);
        if (query.Length == 0)
        {
            return true;
        }

        var haystack = NormalizeForSearch(string.Join(" ", new[]
        {
            room.Title,
            room.Location,
            room.City,
            room.District,
            room.Ward ?? "",
            room.Description,
        }));

        return haystack.Contains(query, StringComparison.OrdinalIgnoreCase);
    }

    private static PublicRoomMatchDto ScoreRoom(PublicRoomDto room, PublicRoomSearchQueryDto query)
    {
        var locationScore = ScoreLocation(room, query.Location);
        var priceScore = ScorePrice(room, query);
        var availableScore = query.AvailableNow == true
            ? room.AvailableNow ? 1 : 0.2
            : 1;
        var hygieneScore = ScoreHygiene(room.HygieneScore, query.MinHygiene);
        var livingScore = ScoreCount(room.LivingRooms, query.LivingRooms);
        var bedroomScore = ScoreCount(room.Bedrooms, query.Bedrooms);

        var weighted =
            locationScore * 0.30 +
            priceScore * 0.25 +
            availableScore * 0.15 +
            hygieneScore * 0.12 +
            livingScore * 0.09 +
            bedroomScore * 0.09;

        return new PublicRoomMatchDto
        {
            Score = (int)Math.Round(weighted * 100, MidpointRounding.AwayFromZero),
            Breakdown = new PublicRoomMatchBreakdownDto
            {
                Location = locationScore,
                Price = priceScore,
                AvailableNow = availableScore,
                Hygiene = hygieneScore,
                LivingRooms = livingScore,
                Bedrooms = bedroomScore,
            },
        };
    }

    private static double ScoreLocation(PublicRoomDto room, string? location)
    {
        var query = NormalizeForSearch(location);
        if (query.Length == 0 || query == "tat ca")
        {
            return 1;
        }

        var city = NormalizeForSearch(room.City);
        var district = NormalizeForSearch(room.District);
        var ward = NormalizeForSearch(room.Ward);
        var fullLocation = NormalizeForSearch(room.Location);

        if (query == ward || query == district)
        {
            return 1;
        }

        if (query == city)
        {
            return 0.8;
        }

        if (district.Contains(query, StringComparison.OrdinalIgnoreCase)
            || query.Contains(district, StringComparison.OrdinalIgnoreCase))
        {
            return 1;
        }

        if (!string.IsNullOrWhiteSpace(ward)
            && (ward.Contains(query, StringComparison.OrdinalIgnoreCase)
                || query.Contains(ward, StringComparison.OrdinalIgnoreCase)))
        {
            return 1;
        }

        if (city.Contains(query, StringComparison.OrdinalIgnoreCase)
            || query.Contains(city, StringComparison.OrdinalIgnoreCase))
        {
            return 0.8;
        }

        return fullLocation.Contains(query, StringComparison.OrdinalIgnoreCase) ? 0.7 : 0.3;
    }

    private static double ScorePrice(PublicRoomDto room, PublicRoomSearchQueryDto query)
    {
        if ((query.MinPrice is null or <= 0) && (query.MaxPrice is null or <= 0))
        {
            return 1;
        }

        var searchPrice = GetSearchPrice(room);

        if (query.MinPrice is > 0 && searchPrice < query.MinPrice.Value)
        {
            return 0;
        }

        if (query.MaxPrice is > 0 && searchPrice > query.MaxPrice.Value)
        {
            return 0;
        }

        return 1;
    }

    private static decimal GetSearchPrice(PublicRoomDto room)
    {
        if (string.Equals(room.Type, "shared", StringComparison.OrdinalIgnoreCase)
            && room.Shared is not null
            && room.Shared.SharedPrice > 0)
        {
            return room.Shared.SharedPrice;
        }

        return room.Price;
    }

    private static double ScoreHygiene(int roomScore, int? minHygiene)
    {
        if (minHygiene is null or <= 0)
        {
            return 1;
        }

        var diff = roomScore - minHygiene.Value;
        return diff >= 0 ? 1 : diff == -1 ? 0.6 : diff == -2 ? 0.3 : 0.1;
    }

    private static double ScoreCount(int value, int? expected)
    {
        if (expected is null)
        {
            return 1;
        }

        var diff = Math.Abs(value - expected.Value);
        return diff == 0 ? 1 : diff == 1 ? 0.5 : 0.1;
    }

    private static bool TryParsePublicId(string raw, string prefix, out int id)
    {
        id = 0;
        return raw.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)
            && int.TryParse(raw[prefix.Length..], out id);
    }

    private static string BuildRoomTitle(Room room, string buildingName)
    {
        var typeName = MapUnitType(room.RoomType) == "apartment" ? "Căn hộ" : "Phòng";
        return $"{typeName} {room.RoomCode} - {buildingName}";
    }

    private static string BuildLocation(string address, string buildingName, string roomCode)
    {
        if (string.IsNullOrWhiteSpace(address))
        {
            return $"{buildingName} - Phòng {roomCode}";
        }

        return $"{address} - Phòng {roomCode}";
    }

    private static string MapUnitType(string? roomType)
        => string.Equals(roomType, "apartment", StringComparison.OrdinalIgnoreCase) ? "apartment" : "single";

    private static bool IsAvailableStatus(string status)
        => string.Equals(status.Trim(), "Trống", StringComparison.OrdinalIgnoreCase)
            || string.Equals(status.Trim(), "Trong", StringComparison.OrdinalIgnoreCase)
            || string.Equals(status.Trim(), "available", StringComparison.OrdinalIgnoreCase);

    private static bool IsMonthlyFee(string unit)
        => unit.Contains("tháng", StringComparison.OrdinalIgnoreCase)
            || unit.Contains("month", StringComparison.OrdinalIgnoreCase);

    private static List<string> SplitRequirements(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return new List<string>();
        }

        return value
            .Split(new[] { '\n', ';', ',' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .ToList();
    }

    private static string FirstNonEmpty(params string?[] values)
        => values.FirstOrDefault(value => !string.IsNullOrWhiteSpace(value)) ?? "";

    private static LocationParts ParseLocation(string? address)
    {
        if (string.IsNullOrWhiteSpace(address))
        {
            return new LocationParts("Hồ Chí Minh", "", null);
        }

        var parts = address
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .ToList();

        var city = parts.FirstOrDefault(part =>
            ContainsAny(part, "TP.HCM", "HCM", "Hồ Chí Minh", "Ho Chi Minh")) != null
            ? "Hồ Chí Minh"
            : parts.FirstOrDefault(part => ContainsAny(part, "Hà Nội", "Ha Noi")) != null
                ? "Hà Nội"
                : parts.FirstOrDefault(part => ContainsAny(part, "Đà Nẵng", "Da Nang")) != null
                    ? "Đà Nẵng"
                    : parts.LastOrDefault() ?? "Hồ Chí Minh";

        var district = parts.FirstOrDefault(part =>
            ContainsAny(part, "Quận", "Huyện", "Thành phố", "TP.", "Thị xã")
            && !ContainsAny(part, "TP.HCM", "Hồ Chí Minh", "Ho Chi Minh", "Hà Nội", "Đà Nẵng"));

        var ward = parts.FirstOrDefault(part => ContainsAny(part, "Phường", "Xã", "Thị trấn"));

        return new LocationParts(city, district ?? "", ward);
    }

    private static bool ContainsAny(string value, params string[] candidates)
        => candidates.Any(candidate => value.Contains(candidate, StringComparison.OrdinalIgnoreCase));

    private static string NormalizeForSearch(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return "";
        }

        var normalized = value.Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(normalized.Length);

        foreach (var ch in normalized)
        {
            if (ch is 'đ' or 'Đ')
            {
                builder.Append('d');
                continue;
            }

            if (CharUnicodeInfo.GetUnicodeCategory(ch) != UnicodeCategory.NonSpacingMark)
            {
                builder.Append(char.ToLowerInvariant(ch));
            }
        }

        return builder.ToString().Normalize(NormalizationForm.FormC).Trim();
    }

    private static PublicRoomCoordsDto GuessCoords(string city, string district)
    {
        if (city.Contains("Hồ Chí Minh", StringComparison.OrdinalIgnoreCase))
        {
            if (district.Contains("7", StringComparison.OrdinalIgnoreCase))
            {
                return new PublicRoomCoordsDto { Lat = 10.729, Lng = 106.7218 };
            }

            return new PublicRoomCoordsDto { Lat = 10.7769, Lng = 106.7009 };
        }

        if (city.Contains("Hà Nội", StringComparison.OrdinalIgnoreCase))
        {
            return new PublicRoomCoordsDto { Lat = 21.0278, Lng = 105.8342 };
        }

        if (city.Contains("Đà Nẵng", StringComparison.OrdinalIgnoreCase))
        {
            return new PublicRoomCoordsDto { Lat = 16.0471, Lng = 108.2068 };
        }

        return new PublicRoomCoordsDto { Lat = 10.7769, Lng = 106.7009 };
    }

    private static List<T> DeserializeList<T>(string? json)
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

    private sealed record LocationParts(string City, string District, string? Ward);
}
