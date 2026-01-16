using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RegulationsController : ControllerBase
{
    private readonly IRegulationService _regulationService;

    public RegulationsController(IRegulationService regulationService)
    {
        _regulationService = regulationService;
    }

    /// <summary>
    /// Tìm kiếm nội quy sử dụng Full-Text Search
    /// </summary>
    /// <remarks>
    /// Ví dụ searchTerm: 
    /// - "thú cưng" - tìm từ đơn
    /// - "thú cưng OR chó mèo" - tìm nhiều từ
    /// - "\"nuôi thú cưng\"" - tìm cụm từ chính xác
    /// </remarks>
    [HttpGet("search")]
    [AllowAnonymous]
    public async Task<IActionResult> Search([FromQuery] string? searchTerm, [FromQuery] string? category)
    {
        var results = await _regulationService.SearchAsync(searchTerm, category);
        return Ok(new
        {
            success = true,
            data = results,
            count = results.Count
        });
    }

    /// <summary>
    /// Lấy chi tiết nội quy theo ID
    /// </summary>
    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(long id)
    {
        var regulation = await _regulationService.GetByIdAsync(id);
        if (regulation == null)
        {
            return NotFound(new { success = false, message = "Regulation not found" });
        }

        // Increment view count
        await _regulationService.IncrementViewCountAsync(id);

        return Ok(new { success = true, data = regulation });
    }

    /// <summary>
    /// Lấy chi tiết nội quy theo mã
    /// </summary>
    [HttpGet("code/{code}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetByCode(string code)
    {
        var regulation = await _regulationService.GetByCodeAsync(code);
        if (regulation == null)
        {
            return NotFound(new { success = false, message = "Regulation not found" });
        }

        return Ok(new { success = true, data = regulation });
    }

    /// <summary>
    /// Tạo nội quy mới (Chỉ MANAGER)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "MANAGER")]
    public async Task<IActionResult> Create([FromBody] RegulationCreateDto dto)
    {
        // Get user ID from JWT claims
        var userIdClaim = User.FindFirst("userId")?.Value;
        if (!long.TryParse(userIdClaim, out long userId))
        {
            return Unauthorized(new { success = false, message = "Invalid token" });
        }

        var regulation = await _regulationService.CreateAsync(dto, userId);
        return CreatedAtAction(nameof(GetById), new { id = regulation.Id }, new { success = true, data = regulation });
    }

    /// <summary>
    /// Cập nhật nội quy (Chỉ MANAGER)
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "MANAGER")]
    public async Task<IActionResult> Update(long id, [FromBody] RegulationUpdateDto dto)
    {
        var regulation = await _regulationService.UpdateAsync(id, dto);
        if (regulation == null)
        {
            return NotFound(new { success = false, message = "Regulation not found" });
        }

        return Ok(new { success = true, data = regulation });
    }

    /// <summary>
    /// Xóa nội quy (Chỉ MANAGER)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "MANAGER")]
    public async Task<IActionResult> Delete(long id)
    {
        var result = await _regulationService.DeleteAsync(id);
        if (!result)
        {
            return NotFound(new { success = false, message = "Regulation not found" });
        }

        return Ok(new { success = true, message = "Regulation deleted successfully" });
    }
}
