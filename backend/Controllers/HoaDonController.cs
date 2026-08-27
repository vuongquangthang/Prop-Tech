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
public class HoaDonController : ControllerBase
{
    private readonly IHoaDonService _hoaDonService;
    private readonly ApplicationDbContext _context;

    public HoaDonController(IHoaDonService hoaDonService, ApplicationDbContext context)
    {
        _hoaDonService = hoaDonService;
        _context = context;
    }

    private async Task<HashSet<int>> GetOwnedContractIdsAsync()
    {
        var userId = GetCurrentOwnerUserId();
        var contractIds = await _context.HopDongs
            .AsNoTracking()
            .Where(contract => contract.Room.Floor.Building.OwnerUserId == userId)
            .Select(contract => contract.Id)
            .ToListAsync();
        return contractIds.ToHashSet();
    }

    private async Task<bool> OwnsContractAsync(int contractId)
    {
        var userId = GetCurrentOwnerUserId();
        return await _context.HopDongs
            .AsNoTracking()
            .AnyAsync(contract => contract.Id == contractId && contract.Room.Floor.Building.OwnerUserId == userId);
    }

    private async Task<bool> OwnsInvoiceAsync(int invoiceId)
    {
        var ownerUserId = GetCurrentOwnerUserId();
        return await _context.HoaDons
            .AsNoTracking()
            .AnyAsync(invoice => invoice.Id == invoiceId && invoice.HopDong.Room.Floor.Building.OwnerUserId == ownerUserId);
    }

    [HttpGet]
    [Authorize(Roles = "Admin,QuanLy,KeToan,NhanVien")]
    public async Task<ActionResult<List<HoaDonDto>>> GetAll()
    {
        try
        {
            var ownedContractIds = await GetOwnedContractIdsAsync();
            var invoices = (await _hoaDonService.GetAllAsync())
                .Where(invoice => ownedContractIds.Contains(invoice.ContractId))
                .ToList();
            return Ok(invoices);
        }
        catch (Exception ex) { return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message }); }
    }

    [HttpGet("my")]
    [Authorize(Roles = "CuDan")]
    public async Task<ActionResult<List<HoaDonDto>>> GetMy()
    {
        try
        {
            var userId = GetCurrentUserId();
            return Ok(await _hoaDonService.GetByUserIdAsync(userId));
        }
        catch (Exception ex) { return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message }); }
    }

    [HttpGet("unpaid")]
    public async Task<ActionResult<List<HoaDonDto>>> GetUnpaid()
    {
        try
        {
            var userId = GetCurrentUserId();
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            // CuDan only sees their own unpaid invoices; staff sees all
            int? filterUserId = (userRole == "CuDan") ? userId : null;
            var invoices = await _hoaDonService.GetUnpaidInvoicesAsync(filterUserId);
            if (userRole != "CuDan")
            {
                var ownedContractIds = await GetOwnedContractIdsAsync();
                invoices = invoices.Where(invoice => ownedContractIds.Contains(invoice.ContractId)).ToList();
            }
            return Ok(invoices);
        }
        catch (Exception ex) { return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message }); }
    }

    [HttpGet("contract/{contractId}/outstanding")]
    [Authorize(Roles = "Admin,QuanLy,KeToan")]
    public async Task<ActionResult<object>> GetOutstandingDebtByContract(int contractId)
    {
        try
        {
            if (!await OwnsContractAsync(contractId))
            {
                return NotFound(new { message = "Hợp đồng không tồn tại" });
            }
            var invoices = await _hoaDonService.GetByContractIdAsync(contractId);
            var unpaidInvoices = invoices
                .Where(i => i.Status == "Chưa thanh toán" || i.Status == "Đã thanh toán một phần")
                .ToList();

            var outstandingDebt = unpaidInvoices.Sum(i => i.RemainingAmount);

            return Ok(new
            {
                contractId,
                outstandingDebt,
                invoiceCount = unpaidInvoices.Count
            });
        }
        catch (Exception ex) { return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message }); }
    }

    [HttpGet("drafts")]
    [Authorize(Roles = "Admin,QuanLy,KeToan")]
    public async Task<ActionResult<List<HoaDonDto>>> GetDrafts()
    {
        try
        {
            var ownedContractIds = await GetOwnedContractIdsAsync();
            var invoices = (await _hoaDonService.GetDraftInvoicesAsync())
                .Where(invoice => ownedContractIds.Contains(invoice.ContractId))
                .ToList();
            return Ok(invoices);
        }
        catch (Exception ex) { return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message }); }
    }

    [HttpGet("contract/{contractId}")]
    public async Task<ActionResult<List<HoaDonDto>>> GetByContract(int contractId)
    {
        try
        {
            if (!await OwnsContractAsync(contractId))
            {
                return Ok(new List<HoaDonDto>());
            }
            return Ok(await _hoaDonService.GetByContractIdAsync(contractId));
        }
        catch (Exception ex) { return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message }); }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<HoaDonDto>> GetById(int id)
    {
        try
        {
            var invoice = await _hoaDonService.GetByIdAsync(id);
            if (invoice == null || !await OwnsContractAsync(invoice.ContractId)) return NotFound(new { message = "Hóa đơn không tồn tại" });
            return Ok(invoice);
        }
        catch (Exception ex) { return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message }); }
    }

    [HttpPost]
    [Authorize(Roles = "Admin,QuanLy,KeToan")]
    public async Task<ActionResult<HoaDonDto>> Create([FromBody] CreateHoaDonDto dto)
    {
        try
        {
            if (!await OwnsContractAsync(dto.ContractId))
            {
                return BadRequest(new { message = "Hợp đồng không tồn tại" });
            }
            var invoice = await _hoaDonService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = invoice.Id }, invoice);
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message }); }
    }

    /// <summary>
    /// Tính toán hóa đơn nháp từ chỉ số điện/nước đã chốt
    /// </summary>
    [HttpPost("calculate/{year}/{month}")]
    [Authorize(Roles = "Admin,QuanLy,KeToan")]
    public async Task<ActionResult<CalculateInvoiceResultDto>> Calculate(short year, byte month, [FromBody] CalculateInvoiceRequestDto? dto = null)
    {
        try
        {
            var result = await _hoaDonService.CalculateDraftInvoicesAsync(year, month, GetCurrentOwnerUserId(), dto?.RoomIds);
            return Ok(result);
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message }); }
    }

    /// <summary>
    /// Chỉnh sửa hóa đơn nháp
    /// </summary>
    [HttpPut("{id}/edit-draft")]
    [Authorize(Roles = "Admin,QuanLy,KeToan")]
    public async Task<ActionResult<HoaDonDto>> EditDraft(int id, [FromBody] EditDraftInvoiceDto dto)
    {
        try
        {
            if (!await OwnsInvoiceAsync(id)) return NotFound(new { message = "Hoa don khong ton tai" });
            var invoice = await _hoaDonService.EditDraftAsync(id, dto);
            return Ok(invoice);
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message }); }
    }

    /// <summary>
    /// Phê duyệt 1 hóa đơn
    /// </summary>
    [HttpPut("{id}/approve")]
    [Authorize(Roles = "Admin,QuanLy,KeToan")]
    public async Task<ActionResult<HoaDonDto>> Approve(int id)
    {
        try
        {
            if (!await OwnsInvoiceAsync(id)) return NotFound(new { message = "Hoa don khong ton tai" });
            var userId = GetCurrentUserId();
            var invoice = await _hoaDonService.ApproveAsync(id, userId);
            return Ok(invoice);
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message }); }
    }

    /// <summary>
    /// Phê duyệt hàng loạt
    /// </summary>
    [HttpPost("approve-batch")]
    [Authorize(Roles = "Admin,QuanLy,KeToan")]
    public async Task<ActionResult<BatchReadingResultDto>> ApproveBatch([FromBody] BatchApproveDto dto)
    {
        try
        {
            var ownedInvoiceIds = await _context.HoaDons
                .AsNoTracking()
                .Where(invoice => dto.InvoiceIds.Contains(invoice.Id) && invoice.HopDong.Room.Floor.Building.OwnerUserId == GetCurrentOwnerUserId())
                .Select(invoice => invoice.Id)
                .ToListAsync();
            if (ownedInvoiceIds.Count != dto.InvoiceIds.Distinct().Count())
            {
                return BadRequest(new { message = "Danh sach hoa don co hoa don khong ton tai" });
            }
            var userId = GetCurrentUserId();
            var result = await _hoaDonService.BatchApproveAsync(dto.InvoiceIds, userId);
            return Ok(result);
        }
        catch (Exception ex) { return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message }); }
    }

    /// <summary>
    /// Từ chối hóa đơn
    /// </summary>
    [HttpPut("{id}/reject")]
    [Authorize(Roles = "Admin,QuanLy,KeToan")]
    public async Task<ActionResult<HoaDonDto>> Reject(int id, [FromBody] RejectInvoiceDto dto)
    {
        try
        {
            if (!await OwnsInvoiceAsync(id)) return NotFound(new { message = "Hoa don khong ton tai" });
            var invoice = await _hoaDonService.RejectAsync(id, dto.Reason);
            return Ok(invoice);
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message }); }
    }

    [HttpPost("{id}/pay")]
    [Authorize(Roles = "Admin,QuanLy,KeToan")]
    public async Task<ActionResult<HoaDonDto>> Pay(int id, [FromBody] PayHoaDonDto dto)
    {
        try
        {
            if (!await OwnsInvoiceAsync(id)) return NotFound(new { message = "Hoa don khong ton tai" });
            var invoice = await _hoaDonService.PayInvoiceAsync(id, dto);
            return Ok(invoice);
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message }); }
    }

    [HttpPost("{id}/send-reminder")]
    [Authorize(Roles = "Admin,QuanLy,KeToan")]
    public async Task<ActionResult<SendInvoiceReminderResultDto>> SendReminder(int id, [FromBody] SendInvoiceReminderRequestDto? dto)
    {
        try
        {
            if (!await OwnsInvoiceAsync(id)) return NotFound(new { message = "Hoa don khong ton tai" });
            var userId = GetCurrentUserId();
            var result = await _hoaDonService.SendReminderAsync(id, userId, dto?.Content);
            return Ok(result);
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message }); }
    }

    [HttpPost("{id}/resend")]
    [Authorize(Roles = "Admin,QuanLy,KeToan")]
    public async Task<ActionResult<SendInvoiceReminderResultDto>> ResendInvoice(int id)
    {
        try
        {
            if (!await OwnsInvoiceAsync(id)) return NotFound(new { message = "Hoa don khong ton tai" });
            var result = await _hoaDonService.ResendInvoiceNotificationAsync(id);
            return Ok(result);
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message }); }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            if (!await OwnsInvoiceAsync(id)) return NotFound(new { message = "Hoa don khong ton tai" });
            await _hoaDonService.DeleteAsync(id);
            return Ok(new { message = "Xóa hóa đơn thành công" });
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message }); }
    }

    private int GetCurrentUserId()
    {
        var claim = User.FindFirst("id") ?? User.FindFirst(ClaimTypes.NameIdentifier);
        return int.TryParse(claim?.Value, out var id) ? id : 0;
    }

    private int GetCurrentOwnerUserId()
    {
        return User.GetOwnerUserId();
    }
}
