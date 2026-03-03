using backend.DTOs;
using backend.Models;
using backend.Repositories;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public interface IHoaDonService
{
    Task<List<HoaDonDto>> GetAllAsync();
    Task<List<HoaDonDto>> GetByContractIdAsync(int contractId);
    Task<List<HoaDonDto>> GetUnpaidInvoicesAsync();
    Task<HoaDonDto?> GetByIdAsync(int id);
    Task<HoaDonDto> CreateAsync(CreateHoaDonDto dto);
    Task<HoaDonDto> PayInvoiceAsync(int id, PayHoaDonDto dto);
    Task DeleteAsync(int id);
}

public class HoaDonService : IHoaDonService
{
    private readonly IHoaDonRepository _hoaDonRepository;
    private readonly IHopDongRepository _hopDongRepository;
    private readonly IServiceRepository _serviceRepository;
    private readonly IThanhToanRepository _thanhToanRepository;

    public HoaDonService(
        IHoaDonRepository hoaDonRepository,
        IHopDongRepository hopDongRepository,
        IServiceRepository serviceRepository,
        IThanhToanRepository thanhToanRepository)
    {
        _hoaDonRepository = hoaDonRepository;
        _hopDongRepository = hopDongRepository;
        _serviceRepository = serviceRepository;
        _thanhToanRepository = thanhToanRepository;
    }

    public async Task<List<HoaDonDto>> GetAllAsync()
    {
        var invoices = await _hoaDonRepository.GetAllAsync();
        return invoices.Select(MapToDto).ToList();
    }

    public async Task<List<HoaDonDto>> GetByContractIdAsync(int contractId)
    {
        var invoices = await _hoaDonRepository.GetByContractIdAsync(contractId);
        return invoices.Select(MapToDto).ToList();
    }

    public async Task<List<HoaDonDto>> GetUnpaidInvoicesAsync()
    {
        var invoices = await _hoaDonRepository.FindAsync(i => 
            i.Status == "Chưa thanh toán" || i.Status == "Đã thanh toán một phần");
        return invoices.Select(MapToDto).ToList();
    }

    public async Task<HoaDonDto?> GetByIdAsync(int id)
    {
        var invoice = await _hoaDonRepository.GetWithDetailsAsync(id);
        return invoice == null ? null : MapToDto(invoice);
    }

    public async Task<HoaDonDto> CreateAsync(CreateHoaDonDto dto)
    {
        // Validate contract exists and is active
        var contract = await _hopDongRepository.GetByIdAsync(dto.ContractId);
        if (contract == null)
        {
            throw new InvalidOperationException("Hợp đồng không tồn tại");
        }

        // Check for duplicate invoice (same contract, month, year)
        var existingInvoice = await _hoaDonRepository.FirstOrDefaultAsync(i => 
            i.ContractId == dto.ContractId && i.Month == dto.Month && i.Year == dto.Year);
        if (existingInvoice != null)
        {
            throw new InvalidOperationException($"Hóa đơn tháng {dto.Month}/{dto.Year} cho hợp đồng này đã tồn tại");
        }

        // Validate all services exist
        var serviceIds = dto.LineItems.Where(li => li.ServiceId.HasValue).Select(li => li.ServiceId!.Value).Distinct();
        foreach (var serviceId in serviceIds)
        {
            var service = await _serviceRepository.GetByIdAsync(serviceId);
            if (service == null)
            {
                throw new InvalidOperationException($"Dịch vụ ID {serviceId} không tồn tại");
            }
        }

        // Create invoice
        var invoice = new HoaDon
        {
            ContractId = dto.ContractId,
            Month = dto.Month,
            Year = dto.Year,
            DueDate = dto.DueDate,
            TotalAmount = 0,
            Status = "Chưa thanh toán"
        };

        await _hoaDonRepository.AddAsync(invoice);
        await _hoaDonRepository.SaveChangesAsync();

        // Create line items and calculate total
        decimal totalAmount = 0;
        foreach (var lineDto in dto.LineItems)
        {
            var lineItem = new ChiTietHoaDon
            {
                InvoiceId = invoice.Id,
                ItemType = lineDto.ItemType,
                ServiceId = lineDto.ServiceId,
                Quantity = lineDto.Quantity,
                UnitPrice = lineDto.UnitPrice,
                Description = lineDto.Description
            };

            totalAmount += (lineDto.Quantity ?? 0) * (lineDto.UnitPrice ?? 0);
            invoice.ChiTietHoaDons.Add(lineItem);
        }

        invoice.TotalAmount = totalAmount;
        _hoaDonRepository.Update(invoice);
        await _hoaDonRepository.SaveChangesAsync();

        // Reload to get navigation properties
        var createdInvoice = await _hoaDonRepository.GetWithDetailsAsync(invoice.Id);
        return MapToDto(createdInvoice!);
    }

    public async Task<HoaDonDto> PayInvoiceAsync(int id, PayHoaDonDto dto)
    {
        var invoice = await _hoaDonRepository.GetByIdAsync(id);
        if (invoice == null)
        {
            throw new InvalidOperationException("Hóa đơn không tồn tại");
        }

        // Get current paid amount
        var payments = await _thanhToanRepository.GetByInvoiceIdAsync(id);
        var currentPaidAmount = payments.Sum(p => p.Amount);

        // Validate payment amount
        var remainingAmount = invoice.TotalAmount - currentPaidAmount;
        if (dto.Amount > remainingAmount)
        {
            throw new InvalidOperationException($"Số tiền thanh toán vượt quá số tiền còn lại ({remainingAmount:N0} VNĐ)");
        }

        if (dto.Amount <= 0)
        {
            throw new InvalidOperationException("Số tiền thanh toán phải lớn hơn 0");
        }

        // Create payment record
        var payment = new ThanhToan
        {
            InvoiceId = id,
            Amount = dto.Amount,
            PaymentType = dto.PaymentType,
            TransactionCode = dto.TransactionCode,
            PaidAt = DateTime.UtcNow
        };

        await _thanhToanRepository.AddAsync(payment);

        // Update invoice status
        var newPaidAmount = currentPaidAmount + dto.Amount;
        if (newPaidAmount >= invoice.TotalAmount)
        {
            invoice.Status = "Đã thanh toán";
        }
        else if (newPaidAmount > 0)
        {
            invoice.Status = "Đã thanh toán một phần";
        }

        _hoaDonRepository.Update(invoice);
        await _hoaDonRepository.SaveChangesAsync();

        // Reload to get updated data
        var updatedInvoice = await _hoaDonRepository.GetWithDetailsAsync(id);
        return MapToDto(updatedInvoice!);
    }

    public async Task DeleteAsync(int id)
    {
        var invoice = await _hoaDonRepository.GetByIdAsync(id);
        if (invoice == null)
        {
            throw new InvalidOperationException("Hóa đơn không tồn tại");
        }

        // Check if invoice has payments
        var payments = await _thanhToanRepository.GetByInvoiceIdAsync(id);
        if (payments.Any())
        {
            throw new InvalidOperationException("Không thể xóa hóa đơn đã có thanh toán");
        }

        _hoaDonRepository.Remove(invoice);
        await _hoaDonRepository.SaveChangesAsync();
    }

    private HoaDonDto MapToDto(HoaDon invoice)
    {
        // Calculate paid amount from ThanhToan collection (eager loaded)
        var paidAmount = invoice.ThanhToans?.Sum(t => t.Amount) ?? 0;

        return new HoaDonDto
        {
            Id = invoice.Id,
            ContractId = invoice.ContractId,
            RoomId = invoice.HopDong?.RoomId,
            RoomNumber = invoice.HopDong?.Room?.RoomCode,
            Month = invoice.Month,
            Year = invoice.Year,
            TotalAmount = invoice.TotalAmount,
            PaidAmount = paidAmount,
            Status = invoice.Status,
            DueDate = invoice.DueDate,
            QrCodeUrl = invoice.QrCodeUrl,
            LineItems = invoice.ChiTietHoaDons?.Select(ct => new ChiTietHoaDonDto
            {
                Id = ct.Id,
                ItemType = ct.ItemType,
                ServiceId = ct.ServiceId,
                ServiceName = ct.Service?.Name,
                Unit = ct.Service?.Unit,
                Quantity = ct.Quantity,
                UnitPrice = ct.UnitPrice,
                Description = ct.Description
            }).ToList() ?? new List<ChiTietHoaDonDto>()
        };
    }
}
