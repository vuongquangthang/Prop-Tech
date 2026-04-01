using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class HopDongController : ControllerBase
{
    private readonly IHopDongService _hopDongService;
    private readonly IChiTietOService _chiTietOService;

    public HopDongController(IHopDongService hopDongService, IChiTietOService chiTietOService)
    {
        _hopDongService = hopDongService;
        _chiTietOService = chiTietOService;
    }

    private int GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrWhiteSpace(claim) || !int.TryParse(claim, out var userId))
        {
            throw new InvalidOperationException("Không xác định được người dùng");
        }
        return userId;
    }

    /// <summary>
    /// Lấy danh sách tất cả hợp đồng
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<HopDongDto>>> GetAll()
    {
        try
        {
            var contracts = await _hopDongService.GetAllAsync();
            return Ok(contracts);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy danh sách hợp đồng đang hoạt động
    /// </summary>
    [HttpGet("active")]
    public async Task<ActionResult<List<HopDongDto>>> GetActive()
    {
        try
        {
            var contracts = await _hopDongService.GetActiveContractsAsync();
            return Ok(contracts);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy danh sách hợp đồng theo phòng
    /// </summary>
    [HttpGet("room/{roomId}")]
    public async Task<ActionResult<List<HopDongDto>>> GetByRoom(int roomId)
    {
        try
        {
            var contracts = await _hopDongService.GetByRoomIdAsync(roomId);
            return Ok(contracts);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy chi tiết hợp đồng theo ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<HopDongDto>> GetById(int id)
    {
        try
        {
            var contract = await _hopDongService.GetByIdAsync(id);
            if (contract == null)
            {
                return NotFound(new { message = "Hợp đồng không tồn tại" });
            }
            return Ok(contract);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Tạo hợp đồng mới
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin,QuanLy")]
    public async Task<ActionResult<HopDongDto>> Create([FromBody] CreateHopDongDto dto)
    {
        try
        {
            var contract = await _hopDongService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = contract.Id }, contract);
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
    /// Cập nhật hợp đồng
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,QuanLy")]
    public async Task<ActionResult<HopDongDto>> Update(int id, [FromBody] UpdateHopDongDto dto)
    {
        try
        {
            var contract = await _hopDongService.UpdateAsync(id, dto);
            return Ok(contract);
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
    /// BQL gửi đề xuất thay đổi hợp đồng cho cư dân xác nhận
    /// </summary>
    [HttpPost("{id}/propose-change")]
    [Authorize(Roles = "Admin,QuanLy")]
    public async Task<IActionResult> ProposeChange(int id, [FromBody] SendContractChangeProposalDto dto)
    {
        try
        {
            await _hopDongService.SendContractChangeProposalAsync(id, dto, GetUserId());
            return Ok(new { message = "Đã gửi đề xuất thay đổi hợp đồng đến cư dân" });
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
    /// Cư dân xem chi tiết đề xuất thay đổi hợp đồng từ thông báo
    /// </summary>
    [HttpGet("change-request/{notificationId:int}")]
    public async Task<ActionResult<ContractChangeDetailDto>> GetChangeRequestDetail(int notificationId)
    {
        try
        {
            var detail = await _hopDongService.GetContractChangeDetailAsync(notificationId, GetUserId());
            return Ok(detail);
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
    /// BQL theo dõi trạng thái đề xuất thay đổi hợp đồng (PENDING/DISCUSSING/CONFIRMED)
    /// </summary>
    [HttpGet("change-requests/tracking")]
    [Authorize(Roles = "Admin,QuanLy")]
    public async Task<ActionResult<List<ContractChangeTrackingItemDto>>> GetChangeRequestTracking([FromQuery] string? status = null, [FromQuery] int limit = 200)
    {
        try
        {
            var data = await _hopDongService.GetContractChangeTrackingAsync(status, limit);
            return Ok(data);
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
    /// Cư dân xác nhận thay đổi hợp đồng (chỉ lúc này mới áp dụng vào hợp đồng hiện tại)
    /// </summary>
    [HttpPost("change-request/{notificationId:int}/confirm")]
    public async Task<IActionResult> ConfirmChangeRequest(int notificationId)
    {
        try
        {
            await _hopDongService.ConfirmContractChangeAsync(notificationId, GetUserId());
            return Ok(new { message = "Đã xác nhận thay đổi hợp đồng" });
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
    /// Cư dân yêu cầu thảo luận lại với BQL (không áp dụng thay đổi)
    /// </summary>
    [HttpPost("change-request/{notificationId:int}/discuss")]
    public async Task<IActionResult> DiscussChangeRequest(int notificationId, [FromBody] RespondContractChangeDto dto)
    {
        try
        {
            await _hopDongService.RequestContractChangeDiscussionAsync(notificationId, GetUserId(), dto?.Message);
            return Ok(new { message = "Đã gửi yêu cầu thảo luận lại" });
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
    /// Xóa hợp đồng
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await _hopDongService.DeleteAsync(id);
            return Ok(new { message = "Xóa hợp đồng thành công" });
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
    /// Lấy danh sách cư dân trong hợp đồng
    /// </summary>
    [HttpGet("{contractId}/residents")]
    public async Task<ActionResult<List<ResidentInContractDto>>> GetResidentsInContract(int contractId)
    {
        try
        {
            var residents = await _chiTietOService.GetResidentsByContractAsync(contractId);
            return Ok(residents);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Thêm cư dân vào hợp đồng
    /// </summary>
    [HttpPost("{contractId}/residents")]
    [Authorize(Roles = "Admin,QuanLy")]
    public async Task<ActionResult<ResidentInContractDto>> AddResidentToContract(int contractId, [FromBody] CreateChiTietODto dto)
    {
        try
        {
            var resident = await _chiTietOService.AddResidentToContractAsync(contractId, dto);
            return Ok(resident);
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
    /// Xóa cư dân khỏi hợp đồng (đánh dấu đã chuyển đi)
    /// </summary>
    [HttpDelete("{contractId}/residents/{residentId}")]
    [Authorize(Roles = "Admin,QuanLy")]
    public async Task<IActionResult> RemoveResidentFromContract(int contractId, int residentId)
    {
        try
        {
            await _chiTietOService.RemoveResidentFromContractAsync(contractId, residentId);
            return Ok(new { message = "Đã cập nhật ngày chuyển đi cho cư dân" });
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
    /// Cập nhật ngày chuyển đi cho cư dân
    /// </summary>
    [HttpPut("{contractId}/residents/{residentId}/moveout")]
    [Authorize(Roles = "Admin,QuanLy")]
    public async Task<IActionResult> UpdateMoveOutDate(int contractId, int residentId, [FromBody] DateTime toDate)
    {
        try
        {
            await _chiTietOService.UpdateMoveOutDateAsync(contractId, residentId, toDate);
            return Ok(new { message = "Cập nhật ngày chuyển đi thành công" });
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
}
