using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using backend.DTOs;
using backend.Models;
using backend.Repositories;
using backend.Services;

namespace backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ComplaintsController : ControllerBase
{
    private readonly IComplaintService _complaintService;
    private readonly IResidencyRepository _residencyRepository;
    private readonly IComplaintAttachmentRepository _attachmentRepository;
    private readonly ILogger<ComplaintsController> _logger;

    public ComplaintsController(
        IComplaintService complaintService,
        IResidencyRepository residencyRepository,
        IComplaintAttachmentRepository attachmentRepository,
        ILogger<ComplaintsController> logger)
    {
        _complaintService = complaintService;
        _residencyRepository = residencyRepository;
        _attachmentRepository = attachmentRepository;
        _logger = logger;
    }

    [HttpGet]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<List<ComplaintDto>>> GetAll([FromQuery] string? status = null)
    {
        try
        {
            var complaints = status != null
                ? await _complaintService.GetByStatusAsync(status)
                : await _complaintService.GetAllAsync();
            return Ok(complaints);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting complaints");
            return StatusCode(500, new { message = "Lỗi khi lấy danh sách khiếu nại" });
        }
    }

    [HttpGet("{id}")]
    [Authorize]
    public async Task<ActionResult<ComplaintDetailDto>> GetById(long id)
    {
        try
        {
            var complaint = await _complaintService.GetDetailAsync(id);
            if (complaint == null)
                return NotFound(new { message = "Không tìm thấy khiếu nại" });

            // Check ownership for residents
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (userRole == "RESIDENT")
            {
                var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!long.TryParse(userIdStr, out var userId))
                    return Unauthorized(new { message = "Không xác định được người dùng" });

                var residentRooms = await _residencyRepository.GetActiveRoomIdsByResidentAsync(userId);
                if (!residentRooms.Contains(complaint.RoomId))
                    return Forbid();
            }

            return Ok(complaint);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting complaint {Id}", id);
            return StatusCode(500, new { message = "Lỗi khi lấy khiếu nại" });
        }
    }

    [HttpGet("room/{roomId}")]
    [Authorize]
    public async Task<ActionResult<List<ComplaintDto>>> GetByRoom(long roomId)
    {
        try
        {
            // Check ownership for residents
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (userRole == "RESIDENT")
            {
                var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!long.TryParse(userIdStr, out var userId))
                    return Unauthorized(new { message = "Không xác định được người dùng" });

                var residentRooms = await _residencyRepository.GetActiveRoomIdsByResidentAsync(userId);
                if (!residentRooms.Contains(roomId))
                    return Forbid();
            }

            var complaints = await _complaintService.GetByRoomAsync(roomId);
            return Ok(complaints);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting complaints for room {RoomId}", roomId);
            return StatusCode(500, new { message = "Lỗi khi lấy danh sách khiếu nại" });
        }
    }

    [HttpGet("assigned-to-me")]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<List<ComplaintDto>>> GetAssignedToMe()
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "Token không hợp lệ" });
            }

            var complaints = await _complaintService.GetByAssignedToAsync(userId);
            return Ok(complaints);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting assigned complaints");
            return StatusCode(500, new { message = "Lỗi khi lấy danh sách khiếu nại" });
        }
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<ComplaintDto>> Create([FromBody] CreateComplaintDto dto)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "Token không hợp lệ" });
            }

            var complaint = await _complaintService.CreateAsync(dto, userId);
            return Ok(complaint);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating complaint");
            return StatusCode(500, new { message = "Lỗi khi tạo khiếu nại" });
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<ComplaintDto>> Update(long id, [FromBody] UpdateComplaintDto dto)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "Token không hợp lệ" });
            }

            var complaint = await _complaintService.UpdateAsync(id, dto, userId);
            return Ok(complaint);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating complaint {Id}", id);
            return StatusCode(500, new { message = "Lỗi khi cập nhật khiếu nại" });
        }
    }

    [HttpPost("{id}/responses")]
    [Authorize]
    public async Task<ActionResult<ComplaintDetailDto>> AddResponse(long id, [FromBody] AddComplaintResponseDto dto)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "Token không hợp lệ" });
            }

            var complaint = await _complaintService.AddResponseAsync(id, dto, userId);
            return Ok(complaint);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding response to complaint {Id}", id);
            return StatusCode(500, new { message = "Lỗi khi thêm phản hồi" });
        }
    }

    [HttpPost("{id}/attachments")]
    [Authorize]
    public async Task<ActionResult<object>> UploadAttachment(long id, IFormFile file)
    {
        try
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "Vui lòng chọn file để tải lên" });

            // Validate file size (max 10MB)
            const long maxFileSize = 10 * 1024 * 1024;
            if (file.Length > maxFileSize)
                return BadRequest(new { message = "File không được vượt quá 10MB" });

            // Validate file type (only images)
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
            var fileExtension = Path.GetExtension(file.FileName).ToLower();
            if (!allowedExtensions.Contains(fileExtension))
                return BadRequest(new { message = "Chỉ hỗ trợ định dạng ảnh (JPG, PNG, GIF, WebP)" });

            // Check ownership for residents
            var complaint = await _complaintService.GetDetailAsync(id);
            if (complaint == null)
                return NotFound(new { message = "Không tìm thấy khiếu nại" });

            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (userRole == "RESIDENT")
            {
                var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!long.TryParse(userIdStr, out var userId))
                    return Unauthorized(new { message = "Không xác định được người dùng" });

                var residentRooms = await _residencyRepository.GetActiveRoomIdsByResidentAsync(userId);
                if (!residentRooms.Contains(complaint.RoomId))
                    return Forbid();
            }

            // Create uploads directory if doesn't exist
            var uploadsDir = Path.Combine("wwwroot", "uploads", "complaints");
            Directory.CreateDirectory(uploadsDir);

            // Generate unique filename
            var fileName = $"{id}_{Guid.NewGuid()}{fileExtension}";
            var filePath = Path.Combine(uploadsDir, fileName);

            // Save file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Create attachment record
            var attachment = new ComplaintAttachment
            {
                ComplaintId = id,
                FileName = file.FileName,
                FileSize = file.Length,
                FilePath = $"/uploads/complaints/{fileName}",
                UploadedAt = DateTime.UtcNow
            };

            await _attachmentRepository.AddAsync(attachment);
            await _attachmentRepository.SaveChangesAsync();

            return Ok(new { 
                message = "Tải lên tệp thành công", 
                id = attachment.Id,
                filePath = attachment.FilePath,
                fileName = file.FileName,
                uploadedAt = attachment.UploadedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading attachment for complaint {Id}", id);
            return StatusCode(500, new { message = "Lỗi khi tải lên tệp" });
        }
    }
}
