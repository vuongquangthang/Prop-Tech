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
}

public class ThanhToanService : IThanhToanService
{
    private readonly IThanhToanRepository _thanhToanRepository;
    private readonly IHoaDonRepository _hoaDonRepository;

    public ThanhToanService(
        IThanhToanRepository thanhToanRepository,
        IHoaDonRepository hoaDonRepository)
    {
        _thanhToanRepository = thanhToanRepository;
        _hoaDonRepository = hoaDonRepository;
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

        if (payment.InvoiceId.HasValue)
        {
            var invoice = await _hoaDonRepository.GetByIdAsync(payment.InvoiceId.Value);
            if (invoice != null)
            {
                invoiceReference = $"{invoice.Month}/{invoice.Year}";
                var contract = await _hoaDonRepository.FirstOrDefaultAsync(i => i.Id == payment.InvoiceId.Value);
                // Note: Need to load contract details to get room number
            }
        }

        return new ThanhToanDto
        {
            Id = payment.Id,
            PaymentType = payment.PaymentType,
            InvoiceId = payment.InvoiceId,
            SettlementId = payment.SettlementId,
            Amount = payment.Amount,
            TransactionCode = payment.TransactionCode,
            PaidAt = payment.PaidAt,
            InvoiceReference = invoiceReference,
            RoomNumber = roomNumber
        };
    }
}
