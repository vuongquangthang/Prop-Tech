using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using backend.DTOs;
using backend.Services;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UtilityReadingsController : ControllerBase
{
    private readonly IUtilityReadingService _service;

    public UtilityReadingsController(IUtilityReadingService service)
    {
        _service = service;
    }

    /// <summary>
    /// Lấy danh sách chỉ số điện/nước tháng đã chọn
    /// </summary>
    [HttpGet("month/{year}/{month}")]
    [Authorize(Roles = "Admin,QuanLy,NhanVien")]
    public async Task<ActionResult<List<RoomUtilityReadingDto>>> GetMonthReadings(short year, byte month)
    {
        try
        {
            var readings = await _service.GetMonthReadingsAsync(year, month, User.GetOwnerUserId());
            return Ok(readings);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Chốt chỉ số hàng loạt
    /// </summary>
    [HttpPost("record-batch")]
    [Authorize(Roles = "Admin,QuanLy,NhanVien")]
    public async Task<ActionResult<BatchReadingResultDto>> RecordBatch([FromBody] List<RecordUtilityReadingDto> readings)
    {
        try
        {
            var result = await _service.RecordBatchAsync(
                readings,
                User.GetAuthenticatedUserId(),
                User.GetOwnerUserId());
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }
}
