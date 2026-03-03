using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FileController : ControllerBase
{
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<FileController> _logger;

    public FileController(IWebHostEnvironment environment, ILogger<FileController> logger)
    {
        _environment = environment;
        _logger = logger;
    }

    [HttpPost("upload")]
    public async Task<ActionResult<object>> UploadFile([FromForm] IFormFile file)
    {
        try
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "Không có file được tải lên" });
            }

            // Validate file type (images only)
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(extension))
            {
                return BadRequest(new { message = "Chỉ chấp nhận file ảnh (jpg, jpeg, png, gif, webp)" });
            }

            // Validate file size (max 5MB)
            if (file.Length > 5 * 1024 * 1024)
            {
                return BadRequest(new { message = "Kích thước file không được vượt quá 5MB" });
            }

            // Create uploads directory if not exists
            var uploadsPath = Path.Combine(_environment.ContentRootPath, "uploads");
            if (!Directory.Exists(uploadsPath))
            {
                Directory.CreateDirectory(uploadsPath);
            }

            // Generate unique filename
            var fileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadsPath, fileName);

            // Save file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Return URL
            var fileUrl = $"/uploads/{fileName}";
            
            _logger.LogInformation("File uploaded successfully: {FileName}", fileName);

            return Ok(new { url = fileUrl });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading file");
            return StatusCode(500, new { message = "Đã xảy ra lỗi khi tải file", error = ex.Message });
        }
    }

    [HttpDelete("{fileName}")]
    [Authorize(Roles = "Admin,QuanLy")]
    public IActionResult DeleteFile(string fileName)
    {
        try
        {
            var filePath = Path.Combine(_environment.ContentRootPath, "uploads", fileName);
            
            if (!System.IO.File.Exists(filePath))
            {
                return NotFound(new { message = "File không tồn tại" });
            }

            System.IO.File.Delete(filePath);
            
            _logger.LogInformation("File deleted successfully: {FileName}", fileName);
            
            return Ok(new { message = "Xóa file thành công" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting file");
            return StatusCode(500, new { message = "Đã xảy ra lỗi khi xóa file", error = ex.Message });
        }
    }
}
