using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using backend.DTOs;
using backend.Services;

namespace backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class TransactionsController : ControllerBase
{
    private readonly ITransactionService _transactionService;
    private readonly ILogger<TransactionsController> _logger;

    public TransactionsController(ITransactionService transactionService, ILogger<TransactionsController> logger)
    {
        _transactionService = transactionService;
        _logger = logger;
    }

    [HttpGet("{id}")]
    [Authorize]
    public async Task<ActionResult<TransactionDetailDto>> GetById(long id)
    {
        try
        {
            var transaction = await _transactionService.GetDetailAsync(id);
            
            if (transaction == null)
                return NotFound(new { message = "Không tìm thấy giao dịch" });

            return Ok(transaction);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting transaction {Id}", id);
            return StatusCode(500, new { message = "Lỗi khi lấy giao dịch" });
        }
    }

    [HttpGet("code/{transactionCode}")]
    [Authorize]
    public async Task<ActionResult<TransactionDto>> GetByCode(string transactionCode)
    {
        try
        {
            var transaction = await _transactionService.GetByTransactionCodeAsync(transactionCode);
            
            if (transaction == null)
                return NotFound(new { message = "Không tìm thấy giao dịch" });

            return Ok(transaction);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting transaction by code {Code}", transactionCode);
            return StatusCode(500, new { message = "Lỗi khi lấy giao dịch" });
        }
    }

    [HttpGet("invoice/{invoiceId}")]
    [Authorize]
    public async Task<ActionResult<List<TransactionDto>>> GetByInvoice(long invoiceId)
    {
        try
        {
            var transactions = await _transactionService.GetByInvoiceAsync(invoiceId);
            return Ok(transactions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting transactions for invoice {InvoiceId}", invoiceId);
            return StatusCode(500, new { message = "Lỗi khi lấy danh sách giao dịch" });
        }
    }

    [HttpGet("room/{roomId}")]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<List<TransactionDto>>> GetByRoom(long roomId)
    {
        try
        {
            var transactions = await _transactionService.GetByRoomAsync(roomId);
            return Ok(transactions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting transactions for room {RoomId}", roomId);
            return StatusCode(500, new { message = "Lỗi khi lấy danh sách giao dịch" });
        }
    }

    [HttpPost("init")]
    [Authorize]
    public async Task<ActionResult<TransactionDto>> InitTransaction([FromBody] InitTransactionDto dto)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "Token không hợp lệ" });
            }

            var transaction = await _transactionService.InitTransactionAsync(dto, userId);
            return Ok(transaction);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error initializing transaction for invoice {InvoiceId}", dto.InvoiceId);
            return StatusCode(500, new { message = "Lỗi khi khởi tạo giao dịch" });
        }
    }

    [HttpPost("callback")]
    [AllowAnonymous]
    public async Task<ActionResult<TransactionReceiptDto>> ProcessCallback([FromBody] PaymentCallbackDto dto)
    {
        try
        {
            var receipt = await _transactionService.ProcessCallbackAsync(dto);
            return Ok(receipt);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing callback for transaction {Code}", dto.TransactionCode);
            return StatusCode(500, new { message = "Lỗi khi xử lý callback" });
        }
    }

    [HttpGet("{id}/receipt")]
    [Authorize]
    public async Task<ActionResult<TransactionReceiptDto>> GetReceipt(long id)
    {
        try
        {
            var receipt = await _transactionService.GetReceiptAsync(id);
            return Ok(receipt);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting receipt for transaction {Id}", id);
            return StatusCode(500, new { message = "Lỗi khi lấy biên lai" });
        }
    }
}
