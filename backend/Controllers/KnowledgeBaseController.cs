using System.Security.Claims;
using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class KnowledgeBaseController : ControllerBase
{
    private readonly IKnowledgeBaseService _service;
    private readonly IChatbotIngestService _chatbotIngestService;

    public KnowledgeBaseController(
        IKnowledgeBaseService service,
        IChatbotIngestService chatbotIngestService)
    {
        _service = service;
        _chatbotIngestService = chatbotIngestService;
    }

    [HttpGet]
    public async Task<ActionResult<List<KnowledgeBaseDto>>> GetAll([FromQuery] bool activeOnly = true)
    {
        try
        {
            var items = await _service.GetAllAsync(User.GetOwnerUserId(), activeOnly);
            return Ok(items);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Da xay ra loi", error = ex.Message });
        }
    }

    [HttpGet("search")]
    public async Task<ActionResult<List<KnowledgeBaseDto>>> Search([FromQuery] string keyword)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(keyword))
            {
                return BadRequest(new { message = "Vui long nhap tu khoa tim kiem" });
            }

            var items = await _service.SearchAsync(keyword, User.GetOwnerUserId());
            return Ok(items);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Da xay ra loi", error = ex.Message });
        }
    }

    [HttpGet("category/{category}")]
    public async Task<ActionResult<List<KnowledgeBaseDto>>> GetByCategory(string category)
    {
        try
        {
            var items = await _service.GetByCategoryAsync(category, User.GetOwnerUserId());
            return Ok(items);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Da xay ra loi", error = ex.Message });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<KnowledgeBaseDto>> GetById(int id)
    {
        try
        {
            var item = await _service.GetByIdAsync(id, User.GetOwnerUserId());
            if (item == null)
            {
                return NotFound(new { message = "Khong tim thay tai lieu tri thuc nay" });
            }

            return Ok(item);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Da xay ra loi", error = ex.Message });
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin,QuanLy")]
    public async Task<ActionResult<KnowledgeBaseDto>> Create([FromBody] CreateKnowledgeBaseDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();
            var item = await _service.CreateAsync(dto, userId, User.GetOwnerUserId());
            return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Da xay ra loi", error = ex.Message });
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,QuanLy")]
    public async Task<ActionResult<KnowledgeBaseDto>> Update(int id, [FromBody] UpdateKnowledgeBaseDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();
            var item = await _service.UpdateAsync(id, dto, userId, User.GetOwnerUserId());
            return Ok(item);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Da xay ra loi", error = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await _service.DeleteAsync(id, User.GetOwnerUserId());
            return Ok(new { message = "Xoa tai lieu tri thuc thanh cong" });
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Da xay ra loi", error = ex.Message });
        }
    }

    [HttpPost("upload-document")]
    [Authorize(Roles = "Admin,QuanLy")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<DocumentUploadResultDto>> UploadDocument(
        IFormFile file,
        [FromForm] string category = "Khac",
        [FromForm] bool autoActivate = true)
    {
        try
        {
            var userId = GetCurrentUserId();

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

            var ownerUserId = User.GetOwnerUserId();
            var result = await _service.UploadDocumentAsync(file, category, autoActivate, userId, ownerUserId);
            var ingestResult = await _chatbotIngestService.IngestDocumentAsync(
                file,
                ownerUserId,
                userId,
                category,
                result.FileName,
                HttpContext.RequestAborted);

            result.IngestTriggered = ingestResult.Triggered;
            result.IngestSucceeded = ingestResult.Success;
            result.IngestMessage = ingestResult.Message;
            result.IngestDocuments = ingestResult.Documents;

            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Da xay ra loi", error = ex.Message });
        }
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            throw new InvalidOperationException("Khong xac dinh duoc nguoi dung");
        }

        return userId;
    }
}
