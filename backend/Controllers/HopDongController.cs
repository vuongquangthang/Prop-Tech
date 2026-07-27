using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;
using backend.Data;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class HopDongController : ControllerBase
{
    private readonly IHopDongService _hopDongService;
    private readonly IChiTietOService _chiTietOService;
    private readonly ApplicationDbContext _context;

    public HopDongController(IHopDongService hopDongService, IChiTietOService chiTietOService, ApplicationDbContext context)
    {
        _hopDongService = hopDongService;
        _chiTietOService = chiTietOService;
        _context = context;
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

    private async Task<HashSet<int>> GetOwnedRoomIdsAsync()
    {
        var userId = User.GetOwnerUserId();
        var roomIds = await _context.Rooms
            .AsNoTracking()
            .Where(room => room.Floor.Building.OwnerUserId == userId)
            .Select(room => room.Id)
            .ToListAsync();
        return roomIds.ToHashSet();
    }

    private async Task<bool> OwnsRoomAsync(int roomId)
    {
        var userId = User.GetOwnerUserId();
        return await _context.Rooms
            .AsNoTracking()
            .AnyAsync(room => room.Id == roomId && room.Floor.Building.OwnerUserId == userId);
    }

    private async Task<bool> OwnsContractAsync(int contractId)
    {
        var ownerUserId = User.GetOwnerUserId();
        return await _context.HopDongs
            .AsNoTracking()
            .AnyAsync(contract => contract.Id == contractId && contract.Room.Floor.Building.OwnerUserId == ownerUserId);
    }

    /// <summary>
    /// Lấy danh sách tất cả hợp đồng
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<HopDongDto>>> GetAll()
    {
        try
        {
            var ownedRoomIds = await GetOwnedRoomIdsAsync();
            var contracts = (await _hopDongService.GetAllAsync())
                .Where(contract => ownedRoomIds.Contains(contract.RoomId))
                .ToList();
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
            var ownedRoomIds = await GetOwnedRoomIdsAsync();
            var contracts = (await _hopDongService.GetActiveContractsAsync())
                .Where(contract => ownedRoomIds.Contains(contract.RoomId))
                .ToList();
            return Ok(contracts);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy hợp đồng còn hiệu lực liên quan cư dân đang đăng nhập
    /// </summary>
    [HttpGet("my")]
    [Authorize(Roles = "CuDan")]
    public async Task<ActionResult<List<HopDongDto>>> GetMyContracts()
    {
        try
        {
            var residentClaim = User.FindFirstValue("ResidentId");
            if (!int.TryParse(residentClaim, out var residentId) || residentId <= 0)
            {
                return Ok(new List<HopDongDto>());
            }

            var ownerUserId = User.GetOwnerUserId();
            var today = DateTime.UtcNow.Date;
            var contracts = await _context.HopDongs
                .AsNoTracking()
                .Include(contract => contract.Room)
                    .ThenInclude(room => room.Floor)
                        .ThenInclude(floor => floor.Building)
                .Include(contract => contract.ChiTietOs)
                    .ThenInclude(residency => residency.Resident)
                        .ThenInclude(resident => resident.Users)
                .Where(contract =>
                    contract.Room.Floor.Building.OwnerUserId == ownerUserId &&
                    contract.StartDate.Date <= today &&
                    (!contract.ExpectedEndDate.HasValue || contract.ExpectedEndDate.Value.Date >= today) &&
                    contract.ChiTietOs.Any(residency => residency.ResidentId == residentId && residency.ToDate == null))
                .OrderByDescending(contract => contract.StartDate)
                .ToListAsync();

            return Ok(contracts.Select(contract => new HopDongDto
            {
                Id = contract.Id,
                ContractCode = contract.ContractCode,
                RoomId = contract.RoomId,
                RoomNumber = contract.Room?.RoomCode,
                StartDate = contract.StartDate,
                ExpectedEndDate = contract.ExpectedEndDate,
                ActualRentPrice = contract.ActualRentPrice,
                DepositAmount = contract.DepositAmount,
                DepositPaid = contract.DepositPaid,
                PaymentDayOfMonth = contract.PaymentDayOfMonth,
                BillingFormulaJson = contract.BillingFormulaJson,
                UpdatedAt = contract.UpdatedAt,
                Residents = contract.ChiTietOs
                    .Where(residency => residency.ToDate == null)
                    .Select(residency => new ResidentInContractDto
                    {
                        ResidentId = residency.ResidentId,
                        FullName = residency.Resident?.FullName,
                        PhoneNumber = residency.Resident?.PhoneNumber,
                        Email = residency.Resident?.Users?.FirstOrDefault()?.Email,
                        IdCardNumber = residency.Resident?.IdCardNumber,
                        Hometown = residency.Resident?.Hometown,
                        ResidencyRole = residency.ResidencyRole,
                        FromDate = residency.FromDate,
                        ToDate = residency.ToDate
                    })
                    .ToList()
            }).ToList());
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
            if (!await OwnsRoomAsync(roomId))
            {
                return Ok(new List<HopDongDto>());
            }
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
            if (contract == null || !await OwnsRoomAsync(contract.RoomId))
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
            if (!await OwnsRoomAsync(dto.RoomId))
            {
                return BadRequest(new { message = "Phòng không tồn tại" });
            }
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
            if (!await OwnsContractAsync(id))
            {
                return NotFound(new { message = "Hop dong khong ton tai" });
            }
            var contract = await _hopDongService.UpdateAsync(id, dto, GetUserId());
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
    /// Lấy lịch sử các phiên bản chỉnh sửa hợp đồng
    /// </summary>
    [HttpGet("{id}/history")]
    [Authorize(Roles = "Admin,QuanLy")]
    public async Task<ActionResult<List<ContractEditHistoryDto>>> GetEditHistory(int id)
    {
        try
        {
            if (!await OwnsContractAsync(id))
            {
                return NotFound(new { message = "Hợp đồng không tồn tại" });
            }

            return Ok(await _hopDongService.GetEditHistoryAsync(id));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Gia hạn hợp đồng, giữ nguyên giá thuê và tiền cọc
    /// </summary>
    [HttpPost("{id}/extend")]
    [Authorize(Roles = "Admin,QuanLy")]
    public async Task<ActionResult<HopDongDto>> Extend(int id, [FromBody] ExtendHopDongDto dto)
    {
        try
        {
            if (!await OwnsContractAsync(id))
            {
                return NotFound(new { message = "Hợp đồng không tồn tại" });
            }

            var contract = await _hopDongService.ExtendAsync(id, dto);
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
    /// BQL cập nhật thay đổi hợp đồng và áp dụng ngay
    /// </summary>
    [HttpPost("{id}/propose-change")]
    [Authorize(Roles = "Admin,QuanLy")]
    public async Task<IActionResult> ProposeChange(int id, [FromBody] SendContractChangeProposalDto dto)
    {
        try
        {
            if (!await OwnsContractAsync(id))
            {
                return NotFound(new { message = "Hop dong khong ton tai" });
            }
            await _hopDongService.SendContractChangeProposalAsync(id, dto, GetUserId());
            return Ok(new { message = "Đã cập nhật và áp dụng thay đổi hợp đồng" });
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
    public ActionResult<ContractChangeDetailDto> GetChangeRequestDetail(int notificationId)
    {
        return BadRequest(new { message = "Quy trình cư dân xác nhận thay đổi hợp đồng đã ngừng sử dụng." });
    }

    /// <summary>
    /// BQL theo dõi trạng thái đề xuất thay đổi hợp đồng (PENDING/DISCUSSING/CONFIRMED)
    /// </summary>
    [HttpGet("change-requests/tracking")]
    [Authorize(Roles = "Admin,QuanLy")]
    public ActionResult<List<ContractChangeTrackingItemDto>> GetChangeRequestTracking([FromQuery] string? status = null, [FromQuery] int limit = 200)
    {
        return BadRequest(new { message = "Quy trình theo dõi đề xuất chờ cư dân xác nhận đã ngừng sử dụng." });
    }

    /// <summary>
    /// Cư dân xác nhận thay đổi hợp đồng (chỉ lúc này mới áp dụng vào hợp đồng hiện tại)
    /// </summary>
    [HttpPost("change-request/{notificationId:int}/confirm")]
    public IActionResult ConfirmChangeRequest(int notificationId)
    {
        return BadRequest(new { message = "Quy trình cư dân xác nhận thay đổi hợp đồng đã ngừng sử dụng." });
    }

    /// <summary>
    /// Cư dân yêu cầu thảo luận lại với BQL (không áp dụng thay đổi)
    /// </summary>
    [HttpPost("change-request/{notificationId:int}/discuss")]
    public IActionResult DiscussChangeRequest(int notificationId, [FromBody] RespondContractChangeDto dto)
    {
        return BadRequest(new { message = "Quy trình cư dân thảo luận thay đổi hợp đồng đã ngừng sử dụng." });
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
            if (!await OwnsContractAsync(id))
            {
                return NotFound(new { message = "Hop dong khong ton tai" });
            }
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
            if (!await OwnsContractAsync(contractId))
            {
                return NotFound(new { message = "Hop dong khong ton tai" });
            }
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
            if (!await OwnsContractAsync(contractId))
            {
                return NotFound(new { message = "Hop dong khong ton tai" });
            }
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
            if (!await OwnsContractAsync(contractId))
            {
                return NotFound(new { message = "Hop dong khong ton tai" });
            }
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
            if (!await OwnsContractAsync(contractId))
            {
                return NotFound(new { message = "Hop dong khong ton tai" });
            }
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
