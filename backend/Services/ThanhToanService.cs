using backend.Data;
using backend.DTOs;
using backend.Models;
using backend.Repositories;
using backend.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using PayOS.Models.Webhooks;

namespace backend.Services;

public interface IThanhToanService
{
    Task<List<ThanhToanDto>> GetAllAsync();
    Task<List<ThanhToanDto>> GetAllAsync(int ownerUserId);
    Task<List<ThanhToanDto>> GetByInvoiceIdAsync(int invoiceId);
    Task<List<ThanhToanDto>> GetByInvoiceIdAsync(int invoiceId, int ownerUserId);
    Task<ThanhToanDto?> GetByIdAsync(long id);
    Task<ThanhToanDto?> GetByIdAsync(long id, int ownerUserId);
    Task<ThanhToanDto> UpdateAsync(long id, UpdateThanhToanDto dto);
    Task<ThanhToanDto> UpdateAsync(long id, UpdateThanhToanDto dto, int ownerUserId);
    Task DeleteAsync(long id);
    Task DeleteAsync(long id, int ownerUserId);
    Task<List<ThanhToanDto>> GetByUserIdAsync(int userId);
    /// <summary>
    /// Xử lý webhook từ PayOS: xác minh chữ ký, tìm hóa đơn theo orderCode
    /// và đánh dấu "Đã thanh toán" bất kể số tiền thực tế.
    /// </summary>
    Task<string> ProcessPayOSWebhookAsync(Webhook webhookBody);
}

public class ThanhToanService : IThanhToanService
{
    private readonly IThanhToanRepository _thanhToanRepository;
    private readonly IHoaDonRepository _hoaDonRepository;
    private readonly ApplicationDbContext _context;
    private readonly IPayOSService _payOSService;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly INotificationService _notificationService;

    public ThanhToanService(
        IThanhToanRepository thanhToanRepository,
        IHoaDonRepository hoaDonRepository,
        ApplicationDbContext context,
        IPayOSService payOSService,
        IHubContext<NotificationHub> hubContext,
        INotificationService notificationService)
    {
        _thanhToanRepository = thanhToanRepository;
        _hoaDonRepository = hoaDonRepository;
        _context = context;
        _payOSService = payOSService;
        _hubContext = hubContext;
        _notificationService = notificationService;
    }

    public async Task<List<ThanhToanDto>> GetAllAsync()
    {
        var payments = await _thanhToanRepository.GetAllAsync();
        var paymentsList = payments.ToList();
        
        var result = new List<ThanhToanDto>();
        foreach (var payment in paymentsList)
        {
            result.Add(await MapToDto(payment));
        }
        return result;
    }

    public async Task<List<ThanhToanDto>> GetAllAsync(int ownerUserId)
    {
        var payments = await PaymentsForOwner(ownerUserId).ToListAsync();
        var result = new List<ThanhToanDto>();
        foreach (var payment in payments)
        {
            result.Add(await MapToDto(payment));
        }
        return result;
    }

    public async Task<List<ThanhToanDto>> GetByInvoiceIdAsync(int invoiceId)
    {
        var payments = await _thanhToanRepository.GetByInvoiceIdAsync(invoiceId);
        
        var result = new List<ThanhToanDto>();
        foreach (var payment in payments)
        {
            result.Add(await MapToDto(payment));
        }
        return result;
    }

    public async Task<List<ThanhToanDto>> GetByInvoiceIdAsync(int invoiceId, int ownerUserId)
    {
        var payments = await PaymentsForOwner(ownerUserId)
            .Where(payment => payment.InvoiceId == invoiceId)
            .ToListAsync();

        var result = new List<ThanhToanDto>();
        foreach (var payment in payments)
        {
            result.Add(await MapToDto(payment));
        }
        return result;
    }

    public async Task<ThanhToanDto?> GetByIdAsync(long id)
    {
        var payment = await _thanhToanRepository.GetByIdAsync(id);
        return payment == null ? null : await MapToDto(payment);
    }

    public async Task<ThanhToanDto?> GetByIdAsync(long id, int ownerUserId)
    {
        var payment = await PaymentsForOwner(ownerUserId)
            .FirstOrDefaultAsync(item => item.Id == id);
        return payment == null ? null : await MapToDto(payment);
    }

    public async Task<ThanhToanDto> UpdateAsync(long id, UpdateThanhToanDto dto)
    {
        var payment = await _thanhToanRepository.GetByIdAsync(id);
        if (payment == null)
        {
            throw new InvalidOperationException("Thanh toán không tồn tại");
        }

        if (!string.IsNullOrWhiteSpace(dto.PaymentType))
            payment.PaymentType = dto.PaymentType;

        if (dto.TransactionCode != null)
            payment.TransactionCode = dto.TransactionCode;

        if (dto.TransferDescription != null)
            payment.TransferDescription = dto.TransferDescription;

        _thanhToanRepository.Update(payment);
        await _thanhToanRepository.SaveChangesAsync();

        return await MapToDto(payment);
    }

    public async Task<ThanhToanDto> UpdateAsync(long id, UpdateThanhToanDto dto, int ownerUserId)
    {
        var payment = await PaymentsForOwner(ownerUserId)
            .FirstOrDefaultAsync(item => item.Id == id);
        if (payment == null)
        {
            throw new InvalidOperationException("Thanh toan khong ton tai trong pham vi chu nha nay");
        }

        if (!string.IsNullOrWhiteSpace(dto.PaymentType))
            payment.PaymentType = dto.PaymentType;

        if (dto.TransactionCode != null)
            payment.TransactionCode = dto.TransactionCode;

        if (dto.TransferDescription != null)
            payment.TransferDescription = dto.TransferDescription;

        _thanhToanRepository.Update(payment);
        await _thanhToanRepository.SaveChangesAsync();

        return await MapToDto(payment);
    }

    public async Task DeleteAsync(long id)
    {
        var payment = await _thanhToanRepository.GetByIdAsync(id);
        if (payment == null)
        {
            throw new InvalidOperationException("Thanh toán không tồn tại");
        }

        // If this is an invoice payment, need to update invoice status
        if (payment.InvoiceId.HasValue)
        {
            throw new InvalidOperationException("Không thể xóa thanh toán hóa đơn trực tiếp. Vui lòng sử dụng chức năng điều chỉnh hóa đơn.");
        }

        _thanhToanRepository.Remove(payment);
        await _thanhToanRepository.SaveChangesAsync();
    }

    public async Task DeleteAsync(long id, int ownerUserId)
    {
        var payment = await PaymentsForOwner(ownerUserId)
            .FirstOrDefaultAsync(item => item.Id == id);
        if (payment == null)
        {
            throw new InvalidOperationException("Thanh toan khong ton tai trong pham vi chu nha nay");
        }

        if (payment.InvoiceId.HasValue)
        {
            throw new InvalidOperationException("Khong the xoa thanh toan hoa don truc tiep. Vui long su dung chuc nang dieu chinh hoa don.");
        }

        _thanhToanRepository.Remove(payment);
        await _thanhToanRepository.SaveChangesAsync();
    }

    private IQueryable<ThanhToan> PaymentsForOwner(int ownerUserId)
    {
        return _context.ThanhToans
            .Include(t => t.HoaDon)
                .ThenInclude(hd => hd!.HopDong)
                    .ThenInclude(c => c.Room)
                        .ThenInclude(r => r.Floor)
                            .ThenInclude(f => f.Building)
            .Include(t => t.TatToan)
                .ThenInclude(tt => tt!.Residency)
                    .ThenInclude(c => c!.Room)
                        .ThenInclude(r => r.Floor)
                            .ThenInclude(f => f.Building)
            .Where(t =>
                (t.HoaDon != null &&
                 t.HoaDon.HopDong.Room.Floor.Building.OwnerUserId == ownerUserId) ||
                (t.TatToan != null &&
                 t.TatToan.Residency != null &&
                 t.TatToan.Residency.Room.Floor.Building.OwnerUserId == ownerUserId))
            .OrderByDescending(t => t.PaidAt ?? t.CreatedAt);
    }

    private async Task<ThanhToanDto> MapToDto(ThanhToan payment)
    {
        string? invoiceReference = null;
        string? roomNumber = null;

        if (payment.HoaDon != null)
        {
            invoiceReference = $"{payment.HoaDon.Month}/{payment.HoaDon.Year}";
            roomNumber = payment.HoaDon.HopDong?.Room?.RoomCode;
        }
        else if (payment.TatToan?.Residency?.Room != null)
        {
            roomNumber = payment.TatToan.Residency.Room.RoomCode;
        }
        else if (payment.InvoiceId.HasValue)
        {
            var invoice = await _hoaDonRepository.GetByIdAsync(payment.InvoiceId.Value);
            if (invoice != null)
                invoiceReference = $"{invoice.Month}/{invoice.Year}";
        }

        return new ThanhToanDto
        {
            Id = payment.Id,
            PaymentType = payment.PaymentType,
            InvoiceId = payment.InvoiceId,
            SettlementId = payment.SettlementId,
            Amount = payment.Amount,
            TransactionCode = payment.TransactionCode,
            TransferDescription = payment.TransferDescription,
            Status = payment.Status,
            PaidAt = payment.PaidAt,
            CreatedAt = payment.CreatedAt,
            InvoiceReference = invoiceReference,
            RoomNumber = roomNumber
        };
    }

    public async Task<List<ThanhToanDto>> GetByUserIdAsync(int userId)
    {
        var payments = await _context.ThanhToans
            .Include(t => t.HoaDon)
                .ThenInclude(hd => hd!.HopDong)
                    .ThenInclude(hd => hd.Room)
            .Where(t =>
                t.Status == "SUCCESS" &&
                t.HoaDon != null &&
                _context.ChiTietOs.Any(ct =>
                    ct.ContractId == t.HoaDon.ContractId &&
                    ct.Resident.Users.Any(u => u.Id == userId)))
            .OrderByDescending(t => t.PaidAt ?? t.CreatedAt)
            .ToListAsync();

        return payments.Select(p => new ThanhToanDto
        {
            Id = p.Id,
            PaymentType = p.PaymentType,
            InvoiceId = p.InvoiceId,
            Amount = p.Amount,
            TransactionCode = p.TransactionCode,
            TransferDescription = p.TransferDescription,
            Status = p.Status,
            PaidAt = p.PaidAt,
            CreatedAt = p.CreatedAt,
            InvoiceReference = p.HoaDon != null ? $"{p.HoaDon.Month}/{p.HoaDon.Year}" : null,
            RoomNumber = p.HoaDon?.HopDong?.Room?.RoomCode,
        }).ToList();
    }

    /// <summary>
    /// Xử lý webhook PayOS: xác minh → tìm ThanhToan → đánh "Đã thanh toán" bất kể số tiền.
    /// Logic: dùng orderCode (= TransactionCode) để tra cứu hóa đơn gốc.
    /// </summary>
    public async Task<string> ProcessPayOSWebhookAsync(Webhook webhookBody)
    {
        // 1. Xác minh chữ ký từ PayOS (ném exception nếu sai)
        var webhookData = await _payOSService.VerifyWebhookAsync(webhookBody);

        // PayOS gửi event test khi đăng ký webhook — bỏ qua
        if (webhookData.OrderCode == 123)
            return "Webhook test acknowledged";

        // 2. Chỉ xử lý khi PayOS báo thành công (code "00")
        if (webhookData.Code != "00")
            return $"Ignored: PayOS code={webhookData.Code}";

        var orderCodeStr = webhookData.OrderCode.ToString();

        // 3. Tìm ThanhToan theo orderCode (đã lưu trong TransactionCode)
        var transaction = await _thanhToanRepository.FirstOrDefaultAsync(
            t => t.TransactionCode == orderCodeStr);

        if (transaction == null)
            return $"ThanhToan not found for orderCode={orderCodeStr}";

        // Idempotent: bỏ qua nếu đã xử lý
        if (transaction.Status == "SUCCESS")
            return $"Already processed: orderCode={orderCodeStr}";

        // 4. Cập nhật ThanhToan → SUCCESS
        transaction.Status = "SUCCESS";
        transaction.PaidAt = DateTime.UtcNow;
        _thanhToanRepository.Update(transaction);

        // 5. Tìm HoaDon và đánh "Đã thanh toán" — BẤT KỂ số tiền thực tế
        //    (test mode gửi 5k nhưng hóa đơn vẫn được gạch nợ)
        string invoiceStatus = "Đã thanh toán";
        HoaDon? invoice = null;
        if (transaction.InvoiceId.HasValue)
        {
            invoice = await _hoaDonRepository.GetByIdAsync(transaction.InvoiceId.Value);
            if (invoice != null)
            {
                invoice.Status = invoiceStatus;
                _hoaDonRepository.Update(invoice);
            }
        }

        await _thanhToanRepository.SaveChangesAsync();

        // Tạo thông báo DB cho BQL: phòng X đã thanh toán hóa đơn
        try
        {
            var roomCode = invoice != null
                ? await _context.HopDongs
                    .Where(h => h.Id == invoice.ContractId)
                    .Select(h => h.Room != null ? h.Room.RoomCode : null)
                    .FirstOrDefaultAsync()
                : null;

            var title = $"Thanh toán hóa đơn - {(roomCode != null ? $"Phòng {roomCode}" : $"HĐ #{invoice?.Id}")}";
            var content = $"{(roomCode != null ? $"Phòng {roomCode}" : "Cư dân")} đã thanh toán hóa đơn tháng {invoice?.Month}/{invoice?.Year}.";
            var ownerUserId = await ResolveOwnerUserIdForInvoiceAsync(invoice);
            await _notificationService.CreateAdminNotificationAsync(title, content, "PAYMENT", ownerUserId);
        }
        catch { /* Không block flow chính */ }

        // 6. Gửi SignalR để app cư dân tự động refresh
        try
        {
            var ownerUserId = await ResolveOwnerUserIdForInvoiceAsync(invoice);
            await _hubContext.Clients.Group(NotificationHub.OwnerGroup(ownerUserId)).SendAsync("PaymentSuccess", new
            {
                transactionId = transaction.Id,
                transactionCode = orderCodeStr,
                invoiceId = invoice?.Id,
                month = invoice?.Month,
                year = invoice?.Year,
                amount = transaction.Amount,
                status = "SUCCESS",
                invoiceStatus
            });
        }
        catch { /* SignalR failure không block flow chính */ }

        return $"OK: invoice #{invoice?.Id} marked '{invoiceStatus}'";
    }
    private async Task<int> ResolveOwnerUserIdForInvoiceAsync(HoaDon? invoice)
    {
        if (invoice == null)
        {
            throw new InvalidOperationException("Khong the xac dinh hoa don thanh toan");
        }

        var ownerUserId = await _context.HopDongs
            .Where(contract => contract.Id == invoice.ContractId)
            .Select(contract => contract.Room.Floor.Building.OwnerUserId)
            .FirstOrDefaultAsync();

        return ownerUserId ?? throw new InvalidOperationException("Khong the xac dinh chu nha cua hoa don");
    }
}
