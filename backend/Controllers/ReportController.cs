using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize]
public class ReportController : ControllerBase
{
    private readonly IReportService _reportService;
    private readonly ILogger<ReportController> _logger;

    public ReportController(
        IReportService reportService,
        ILogger<ReportController> logger)
    {
        _reportService = reportService;
        _logger = logger;
    }

    /// <summary>
    /// Lấy tóm tắt bảng điều khiển - tổng quan tình hình
    /// </summary>
    [HttpGet("dashboard")]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<DashboardSummaryDto>> GetDashboard()
    {
        try
        {
            var result = await _reportService.GetDashboardSummaryAsync();
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi lấy tóm tắt bảng điều khiển");
            return StatusCode(500, new { message = "Lỗi khi xử lý yêu cầu" });
        }
    }

    /// <summary>
    /// Lấy tình trạng phòng theo tòa nhà
    /// </summary>
    [HttpGet("room-status/buildings")]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<List<RoomStatusDto>>> GetRoomStatusByBuilding()
    {
        try
        {
            var result = await _reportService.GetRoomStatusByBuildingAsync();
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi lấy tình trạng phòng theo tòa nhà");
            return StatusCode(500, new { message = "Lỗi khi xử lý yêu cầu" });
        }
    }

    /// <summary>
    /// Lấy tình trạng phòng theo tầng
    /// </summary>
    [HttpGet("room-status/building/{buildingId:long}/floors")]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<List<FloorStatusDto>>> GetRoomStatusByFloor([FromRoute] long buildingId)
    {
        try
        {
            var result = await _reportService.GetRoomStatusByFloorAsync(buildingId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi lấy tình trạng phòng theo tầng");
            return StatusCode(500, new { message = "Lỗi khi xử lý yêu cầu" });
        }
    }

    /// <summary>
    /// Lấy báo cáo khoản nợ chưa thanh toán
    /// </summary>
    [HttpGet("receivables")]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<List<ReceivablesDto>>> GetReceivables([FromQuery] long? buildingId = null)
    {
        try
        {
            var result = await _reportService.GetReceivablesReportAsync(buildingId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi lấy báo cáo khoản nợ");
            return StatusCode(500, new { message = "Lỗi khi xử lý yêu cầu" });
        }
    }

    /// <summary>
    /// Lấy báo cáo tổng hợp doanh thu
    /// </summary>
    [HttpGet("revenue")]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<List<RevenueSummaryDto>>> GetRevenueSummary([FromQuery] long? billingPeriodId = null)
    {
        try
        {
            var result = await _reportService.GetRevenueSummaryAsync(billingPeriodId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi lấy báo cáo doanh thu");
            return StatusCode(500, new { message = "Lỗi khi xử lý yêu cầu" });
        }
    }

    /// <summary>
    /// Lấy thống kê khiếu nại
    /// </summary>
    [HttpGet("complaints")]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<List<ComplaintStatisticsDto>>> GetComplaintStatistics()
    {
        try
        {
            var result = await _reportService.GetComplaintStatisticsAsync();
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi lấy thống kê khiếu nại");
            return StatusCode(500, new { message = "Lỗi khi xử lý yêu cầu" });
        }
    }
}
