using System.Text.Json;
using backend.Data;
using backend.DTOs;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/internal/chatbot")]
public class InternalChatbotKnowledgeController : ControllerBase
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IKnowledgeBaseService _knowledgeBaseService;

    public InternalChatbotKnowledgeController(
        ApplicationDbContext context,
        IConfiguration configuration,
        IKnowledgeBaseService knowledgeBaseService)
    {
        _context = context;
        _configuration = configuration;
        _knowledgeBaseService = knowledgeBaseService;
    }

    [HttpGet("knowledge-documents")]
    public async Task<ActionResult<List<ChatbotKnowledgeDocumentDto>>> GetKnowledgeDocuments([FromQuery] int? buildingId = null)
    {
        if (!IsValidInternalKey())
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "Invalid internal API key" });
        }

        var buildings = await _context.Buildings
            .AsNoTracking()
            .Include(building => building.OwnerUser)
                .ThenInclude(owner => owner!.Resident)
            .Include(building => building.Floors)
                .ThenInclude(floor => floor.Rooms)
            .Where(building => !building.IsDeleted && (!buildingId.HasValue || building.Id == buildingId.Value))
            .OrderBy(building => building.Id)
            .ToListAsync();

        var services = await _context.Services
            .AsNoTracking()
            .Include(service => service.BuildingScopes)
            .Where(service => service.IsActive)
            .OrderBy(service => service.Name)
            .ToListAsync();

        var documents = new List<ChatbotKnowledgeDocumentDto>();
        foreach (var building in buildings)
        {
            AddBuildingDocuments(documents, building, services);
        }

        return Ok(documents);
    }

    [HttpGet("knowledge-base")]
    public async Task<ActionResult<List<KnowledgeBaseDto>>> ListCommonKnowledge()
    {
        if (!IsValidInternalKey())
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "Invalid internal API key" });
        }

        var items = await _context.KnowledgeBases
            .AsNoTracking()
            .Where(item => item.OwnerUserId == null)
            .OrderByDescending(item => item.CreatedAt)
            .Select(item => new KnowledgeBaseDto
            {
                Id = item.Id,
                FileName = item.FileName,
                FileUrl = item.FileUrl,
                OwnerUserId = item.OwnerUserId,
                CreatedAt = item.CreatedAt,
            })
            .ToListAsync();

        return Ok(items);
    }

    [HttpPost("knowledge-base/upload-document")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<DocumentUploadResultDto>> UploadCommonDocument(
        IFormFile file,
        [FromForm] string category = "Chung",
        [FromForm] bool autoActivate = true)
    {
        if (!IsValidInternalKey())
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "Invalid internal API key" });
        }

        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "Khong co file duoc tai len" });
        }

        var allowedExtensions = new[] { ".pdf", ".docx", ".txt", ".md" };
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedExtensions.Contains(extension))
        {
            return BadRequest(new { message = "Chi chap nhan file PDF, DOCX, TXT, MD" });
        }

        if (file.Length > 10 * 1024 * 1024)
        {
            return BadRequest(new { message = "Kich thuoc file khong duoc vuot qua 10MB" });
        }

        var result = await _knowledgeBaseService.UploadDocumentForOwnerAsync(
            file, category, autoActivate, userId: null, ownerUserId: null);

        return Ok(result);
    }

    [HttpDelete("knowledge-base/{id}")]
    public async Task<IActionResult> DeleteCommonKnowledge(int id)
    {
        if (!IsValidInternalKey())
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "Invalid internal API key" });
        }

        var entity = await _context.KnowledgeBases
            .FirstOrDefaultAsync(item => item.Id == id && item.OwnerUserId == null);
        if (entity == null)
        {
            return NotFound(new { message = "Khong tim thay file tri thuc chung nay" });
        }

        _context.KnowledgeBases.Remove(entity);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Da xoa file tri thuc" });
    }

    private void AddBuildingDocuments(
        List<ChatbotKnowledgeDocumentDto> documents,
        Building building,
        List<Service> services)
    {
        var buildingCode = building.Id.ToString();
        var source = $"proptech:TOA_NHA_ID={building.Id}";

        void Add(string content, string? sourceSuffix = null)
        {
            content = (content ?? "").Trim();
            if (content.Length == 0)
            {
                return;
            }

            documents.Add(new ChatbotKnowledgeDocumentDto
            {
                BuildingCode = buildingCode,
                Source = sourceSuffix is null ? source : $"{source}:{sourceSuffix}",
                Content = content,
            });
        }

        Add($"TOA NHA {Txt(building.BuildingName)} (ma toa: {buildingCode})");
        Add(
            "THONG TIN CHUNG TOA NHA\n"
            + $"Ten toa nha: {Txt(building.BuildingName)}\n"
            + $"Dia chi: {Txt(building.Address)}\n"
            + $"So tang: {Txt(building.NumberOfFloors)}\n"
            + $"Mo ta: {Txt(building.Description)}",
            "building");

        var owner = building.OwnerUser;
        if (owner is not null)
        {
            Add(
                $"BAN QUAN LY & DUONG DAY NONG - toa {Txt(building.BuildingName)}\n"
                + $"Nguoi phu trach: {Txt(owner.DisplayName, owner.Resident?.FullName ?? "chua cap nhat")}\n"
                + $"Hotline / So dien thoai: {Txt(owner.PhoneNumber)}\n"
                + $"Email tiep nhan: {Txt(owner.Email)}",
                "contact");
        }

        var activeRooms = building.Floors
            .Where(floor => !floor.IsDeleted)
            .OrderBy(floor => floor.FloorNumber)
            .SelectMany(floor => floor.Rooms
                .Where(room => !IsDeletedRoomStatus(room.Status))
                .OrderBy(room => room.RoomCode)
                .Select(room => new { Floor = floor, Room = room }))
            .ToList();

        foreach (var item in activeRooms)
        {
            var room = item.Room;
            var amenities = DeserializeList<string>(room.AmenitiesJson);
            var roomServices = DeserializeList<int>(room.ServiceIdsJson)
                .Select(id => services.FirstOrDefault(service => service.Id == id))
                .Where(service => service is not null)
                .Select(service => service!.Name)
                .Distinct()
                .ToList();

            Add(
                $"PHONG {Txt(room.RoomCode)} (toa {Txt(building.BuildingName)}, tang {Txt(item.Floor.FloorNumber)})\n"
                + $"Loai phong: {Txt(room.RoomType)}\n"
                + $"Dien tich: {Txt(room.Area)} m2\n"
                + $"Gia thue mac dinh: {FmtMoney(room.DefaultRentPrice)}/thang\n"
                + $"Trang thai: {Txt(room.Status)}\n"
                + $"So nguoi toi da: {Txt(room.MaxOccupants)}; phong khach: {Txt(room.LivingRoomCount)}; phong ngu: {Txt(room.BedroomCount)}; bep: {Txt(room.KitchenCount)}; ve sinh: {Txt(room.BathroomCount)}\n"
                + $"Tien nghi: {TxtList(amenities)}\n"
                + $"Dich vu gan voi phong: {TxtList(roomServices)}\n"
                + $"Mo ta: {Txt(room.Description)}",
                $"room-{room.Id}");
        }

        var prices = activeRooms
            .Select(item => item.Room.DefaultRentPrice)
            .Where(price => price.HasValue)
            .Select(price => price!.Value)
            .ToList();
        if (prices.Count > 0)
        {
            Add(
                $"TOM TAT GIA THUE toa {Txt(building.BuildingName)}: "
                + $"tu {FmtMoney(prices.Min())} den {FmtMoney(prices.Max())}/thang, "
                + $"tong {activeRooms.Count} phong.",
                "rent-summary");
        }

        var buildingServices = services
            .Where(service => IsServiceForBuilding(service, building))
            .OrderBy(service => service.Name)
            .ToList();
        if (buildingServices.Count > 0)
        {
            var lines = new List<string> { "BIEU PHI DICH VU - toa " + Txt(building.BuildingName) };
            foreach (var service in buildingServices)
            {
                lines.Add(
                    $"- {Txt(service.Name)}"
                    + (string.IsNullOrWhiteSpace(service.ServiceType) ? "" : $" ({Txt(service.ServiceType)})")
                    + $": {FmtMoney(service.CommonUnitPrice)}"
                    + (string.IsNullOrWhiteSpace(service.Unit) ? "" : $"/{Txt(service.Unit)}"));
            }

            Add(string.Join("\n", lines), "services");
        }
    }

    private bool IsValidInternalKey()
    {
        var configured = _configuration["InternalApiKey"] ?? "dev-internal-key";
        return Request.Headers.TryGetValue("X-Internal-Api-Key", out var apiKey)
            && apiKey == configured;
    }

    private static bool IsServiceForBuilding(Service service, Building building)
    {
        if (service.BuildingId == building.Id)
        {
            return true;
        }

        if (service.BuildingScopes.Any(scope => scope.BuildingId == building.Id))
        {
            return true;
        }

        return service.BuildingId is null
            && service.BuildingScopes.Count == 0
            && (service.OwnerUserId is null || service.OwnerUserId == building.OwnerUserId);
    }

    private static bool IsDeletedRoomStatus(string? status)
    {
        var normalized = (status ?? "").Trim().ToLowerInvariant();
        return normalized.Contains("xoa") || normalized.Contains("xoa") || normalized == "deleted";
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

    private static string FmtMoney(decimal? value)
    {
        if (!value.HasValue)
        {
            return "chua cap nhat";
        }

        return string.Format(System.Globalization.CultureInfo.GetCultureInfo("vi-VN"), "{0:N0} VND", value.Value);
    }

    private static string Txt(object? value, string defaultValue = "chua cap nhat")
    {
        if (value is null)
        {
            return defaultValue;
        }

        var text = value.ToString()?.Trim();
        return string.IsNullOrWhiteSpace(text) ? defaultValue : text;
    }

    private static string TxtList(IEnumerable<string> values)
    {
        var items = values
            .Select(value => value.Trim())
            .Where(value => value.Length > 0)
            .Distinct()
            .ToList();

        return items.Count == 0 ? "chua cap nhat" : string.Join(", ", items);
    }
}
