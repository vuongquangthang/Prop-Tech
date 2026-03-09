using backend.Data;
using backend.DTOs;
using backend.Models;
using backend.Repositories;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public interface IThanhToanService
{
    Task<List<ThanhToanDto>> GetAllAsync();
    Task<List<ThanhToanDto>> GetByInvoiceIdAsync(int invoiceId);
    Task<ThanhToanDto?> GetByIdAsync(long id);
    Task<ThanhToanDto> UpdateAsync(long id, UpdateThanhToanDto dto);
    Task DeleteAsync(long id);
    Task<List<ThanhToanDto>> GetByUserIdAsync(int userId);
}

public class ThanhToanService : IThanhToanService
{
    private readonly IThanhToanRepository _thanhToanRepository;
    private readonly IHoaDonRepository _hoaDonRepository;
    private readonly ApplicationDbContext _context;

    public ThanhToanService(
        IThanhToanRepository thanhToanRepository,
        IHoaDonRepository hoaDonRepository,
        ApplicationDbContext context)
    {
        _thanhToanRepository = thanhToanRepository;
        _hoaDonRepository = hoaDonRepository;
        _context = context;
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

    public async Task<ThanhToanDto?> GetByIdAsync(long id)
    {
        var payment = await _thanhToanRepository.GetByIdAsync(id);
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

    private async Task<ThanhToanDto> MapToDto(ThanhToan payment)
    {
        string? invoiceReference = null;
        string? roomNumber = null;

        if (payment.HoaDon != null)
        {
            invoiceReference = $"{payment.HoaDon.Month}/{payment.HoaDon.Year}";
            roomNumber = payment.HoaDon.HopDong?.Room?.RoomCode;
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
            Status = p.Status,
            PaidAt = p.PaidAt,
            CreatedAt = p.CreatedAt,
            InvoiceReference = p.HoaDon != null ? $"{p.HoaDon.Month}/{p.HoaDon.Year}" : null,
            RoomNumber = p.HoaDon?.HopDong?.Room?.RoomCode,
        }).ToList();
    }
}
