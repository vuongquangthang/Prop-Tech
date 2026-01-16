using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FAQsController : ControllerBase
{
    private readonly IFAQService _faqService;

    public FAQsController(IFAQService faqService)
    {
        _faqService = faqService;
    }

    /// <summary>
    /// Tìm kiếm FAQs sử dụng Full-Text Search
    /// </summary>
    /// <remarks>
    /// Ví dụ searchTerm: 
    /// - "thanh toán" - tìm từ đơn
    /// - "thanh toán OR hóa đơn" - tìm nhiều từ
    /// - "\"thanh toán hóa đơn\"" - tìm cụm từ chính xác
    /// </remarks>
    [HttpGet("search")]
    [AllowAnonymous]
    public async Task<IActionResult> Search([FromQuery] string? searchTerm, [FromQuery] string? category)
    {
        var results = await _faqService.SearchAsync(searchTerm, category);
        return Ok(new
        {
            success = true,
            data = results,
            count = results.Count
        });
    }

    /// <summary>
    /// Lấy chi tiết FAQ theo ID
    /// </summary>
    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(long id)
    {
        var faq = await _faqService.GetByIdAsync(id);
        if (faq == null)
        {
            return NotFound(new { success = false, message = "FAQ not found" });
        }

        // Increment view count
        await _faqService.IncrementViewCountAsync(id);

        return Ok(new { success = true, data = faq });
    }

    /// <summary>
    /// Tạo FAQ mới (Chỉ MANAGER)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "MANAGER")]
    public async Task<IActionResult> Create([FromBody] FAQCreateDto dto)
    {
        // Get user ID from JWT claims
        var userIdClaim = User.FindFirst("userId")?.Value;
        if (!long.TryParse(userIdClaim, out long userId))
        {
            return Unauthorized(new { success = false, message = "Invalid token" });
        }

        var faq = await _faqService.CreateAsync(dto, userId);
        return CreatedAtAction(nameof(GetById), new { id = faq.Id }, new { success = true, data = faq });
    }

    /// <summary>
    /// Cập nhật FAQ (Chỉ MANAGER)
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "MANAGER")]
    public async Task<IActionResult> Update(long id, [FromBody] FAQUpdateDto dto)
    {
        var faq = await _faqService.UpdateAsync(id, dto);
        if (faq == null)
        {
            return NotFound(new { success = false, message = "FAQ not found" });
        }

        return Ok(new { success = true, data = faq });
    }

    /// <summary>
    /// Xóa FAQ (Chỉ MANAGER)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "MANAGER")]
    public async Task<IActionResult> Delete(long id)
    {
        var result = await _faqService.DeleteAsync(id);
        if (!result)
        {
            return NotFound(new { success = false, message = "FAQ not found" });
        }

        return Ok(new { success = true, message = "FAQ deleted successfully" });
    }
}
