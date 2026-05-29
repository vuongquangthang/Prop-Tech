using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Authorization;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,QuanLy,KeToan")]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
    {
        _reportService = reportService;
    }

    private int GetUserId()
    {
        var claim = User.GetOwnerUserId().ToString();
        if (!int.TryParse(claim, out var userId) || userId <= 0)
        {
            throw new InvalidOperationException("Không thể xác thực người dùng");
        }
        return userId;
    }

    /// <summary>
    /// Lấy thống kê tổng quan dashboard
    /// </summary>
    [HttpGet("dashboard")]
    public async Task<ActionResult<DashboardStatsDto>> GetDashboard()
    {
        try
        {
            var stats = await _reportService.GetDashboardStatsAsync(GetUserId());
            return Ok(stats);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy thống kê phòng
    /// </summary>
    [HttpGet("rooms")]
    public async Task<ActionResult<RoomStatsDto>> GetRoomStats()
    {
        try
        {
            var stats = await _reportService.GetRoomStatsAsync(GetUserId());
            return Ok(stats);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy thống kê doanh thu
    /// </summary>
    [HttpGet("revenue")]
    public async Task<ActionResult<RevenueStatsDto>> GetRevenueStats()
    {
        try
        {
            var stats = await _reportService.GetRevenueStatsAsync(GetUserId());
            return Ok(stats);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy thống kê công nợ
    /// </summary>
    [HttpGet("debt")]
    public async Task<ActionResult<DebtStatsDto>> GetDebtStats()
    {
        try
        {
            var stats = await _reportService.GetDebtStatsAsync(GetUserId());
            return Ok(stats);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy báo cáo doanh thu theo tháng
    /// </summary>
    [HttpGet("revenue/monthly")]
    public async Task<ActionResult<List<MonthlyRevenueDto>>> GetMonthlyRevenue([FromQuery] int year)
    {
        try
        {
            if (year < 2000 || year > DateTime.UtcNow.Year + 1)
            {
                return BadRequest(new { message = "Năm không hợp lệ" });
            }

            var revenue = await _reportService.GetMonthlyRevenueAsync(year, GetUserId());
            return Ok(revenue);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }
}
