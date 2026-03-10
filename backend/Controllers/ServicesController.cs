using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Authorization;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ServicesController : ControllerBase
{
    private readonly IServiceService _serviceService;

    public ServicesController(IServiceService serviceService)
    {
        _serviceService = serviceService;
    }

    /// <summary>
    /// Lấy danh sách tất cả dịch vụ
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<ServiceDto>>> GetAll()
    {
        try
        {
            var services = await _serviceService.GetAllAsync();
            return Ok(services);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy danh sách dịch vụ đang hoạt động
    /// </summary>
    [HttpGet("active")]
    public async Task<ActionResult<List<ServiceDto>>> GetActive()
    {
        try
        {
            var services = await _serviceService.GetActiveServicesAsync();
            return Ok(services);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy chi tiết dịch vụ theo ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ServiceDto>> GetById(int id)
    {
        try
        {
            var service = await _serviceService.GetByIdAsync(id);
            if (service == null)
            {
                return NotFound(new { message = "Dịch vụ không tồn tại" });
            }
            return Ok(service);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Tạo dịch vụ mới
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin,QuanLy")]
    public async Task<ActionResult<ServiceDto>> Create([FromBody] CreateServiceDto dto)
    {
        try
        {
            var service = await _serviceService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = service.Id }, service);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Cập nhật dịch vụ
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,QuanLy")]
    public async Task<ActionResult<ServiceDto>> Update(int id, [FromBody] UpdateServiceDto dto)
    {
        try
        {
            var service = await _serviceService.UpdateAsync(id, dto);
            return Ok(service);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Xóa dịch vụ (đánh dấu không hoạt động)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await _serviceService.DeleteAsync(id);
            return Ok(new { message = "Đã đánh dấu dịch vụ không hoạt động" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy lịch sử thay đổi đơn giá của dịch vụ
    /// </summary>
    [HttpGet("{id}/price-history")]
    public async Task<ActionResult<List<ServicePriceHistoryDto>>> GetPriceHistory(int id)
    {
        try
        {
            var history = await _serviceService.GetPriceHistoryAsync(id);
            return Ok(history);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }
}
