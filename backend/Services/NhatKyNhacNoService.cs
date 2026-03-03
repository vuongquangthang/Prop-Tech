using backend.DTOs;
using backend.Models;
using backend.Repositories;

namespace backend.Services;

public interface INhatKyNhacNoService
{
    Task<List<NhatKyNhacNoDto>> GetByInvoiceIdAsync(int invoiceId);
    Task<List<NhatKyNhacNoDto>> GetByUserIdAsync(int userId);
    Task<List<NhatKyNhacNoDto>> GetByStatusAsync(string status);
    Task<NhatKyNhacNoDto?> GetByIdAsync(long id);
    Task<NhatKyNhacNoDto> CreateReminderAsync(CreateNhatKyNhacNoDto dto, int? sentByUserId = null);
    Task<NhatKyNhacNoDto> UpdateStatusAsync(long id, UpdateNhatKyNhacNoStatusDto dto);
}

public class NhatKyNhacNoService : INhatKyNhacNoService
{
    private readonly INhatKyNhacNoRepository _repository;
    private readonly IHoaDonRepository _hoaDonRepository;
    private readonly IUserRepository _userRepository;

    public NhatKyNhacNoService(
        INhatKyNhacNoRepository repository,
        IHoaDonRepository hoaDonRepository,
        IUserRepository userRepository)
    {
        _repository = repository;
        _hoaDonRepository = hoaDonRepository;
        _userRepository = userRepository;
    }

    public async Task<List<NhatKyNhacNoDto>> GetByInvoiceIdAsync(int invoiceId)
    {
        var reminders = await _repository.GetByInvoiceIdAsync(invoiceId);
        return reminders.Select(MapToDto).ToList();
    }

    public async Task<List<NhatKyNhacNoDto>> GetByUserIdAsync(int userId)
    {
        var reminders = await _repository.GetByUserIdAsync(userId);
        return reminders.Select(MapToDto).ToList();
    }

    public async Task<List<NhatKyNhacNoDto>> GetByStatusAsync(string status)
    {
        var reminders = await _repository.GetByStatusAsync(status);
        return reminders.Select(MapToDto).ToList();
    }

    public async Task<NhatKyNhacNoDto?> GetByIdAsync(long id)
    {
        var reminder = await _repository.GetByIdAsync(id);
        return reminder == null ? null : MapToDto(reminder);
    }

    public async Task<NhatKyNhacNoDto> CreateReminderAsync(CreateNhatKyNhacNoDto dto, int? sentByUserId = null)
    {
        // Validate invoice exists
        var invoice = await _hoaDonRepository.GetByIdAsync(dto.InvoiceId);
        if (invoice == null)
        {
            throw new InvalidOperationException("Hóa đơn không tồn tại");
        }

        // Validate recipient user exists
        var recipient = await _userRepository.GetByIdAsync(dto.SentToUserId);
        if (recipient == null)
        {
            throw new InvalidOperationException("Người nhận không tồn tại");
        }

        // Get reminder count for this invoice
        var currentCount = await _repository.GetReminderCountForInvoiceAsync(dto.InvoiceId);

        var reminder = new NhatKyNhacNo
        {
            InvoiceId = dto.InvoiceId,
            SentToUserId = dto.SentToUserId,
            SentByUserId = sentByUserId,
            ReminderCount = currentCount + 1,
            ReminderTime = DateTime.UtcNow,
            ReminderMethod = dto.ReminderMethod,
            Content = dto.Content ?? GenerateDefaultContent(invoice),
            SendStatus = "Đang gửi"
        };

        await _repository.AddAsync(reminder);
        await _repository.SaveChangesAsync();

        var created = await _repository.GetByIdAsync(reminder.Id);
        return MapToDto(created!);
    }

    public async Task<NhatKyNhacNoDto> UpdateStatusAsync(long id, UpdateNhatKyNhacNoStatusDto dto)
    {
        var reminder = await _repository.GetByIdAsync(id);
        if (reminder == null)
        {
            throw new InvalidOperationException("Không tìm thấy nhật ký nhắc nợ");
        }

        reminder.SendStatus = dto.SendStatus;
        reminder.ErrorMessage = dto.ErrorMessage;

        _repository.Update(reminder);
        await _repository.SaveChangesAsync();

        var updated = await _repository.GetByIdAsync(id);
        return MapToDto(updated!);
    }

    private string GenerateDefaultContent(HoaDon invoice)
    {
        return $"Nhắc nhở thanh toán hóa đơn tháng {invoice.Month}/{invoice.Year}. " +
               $"Tổng tiền: {invoice.TotalAmount:N0} VNĐ. " +
               $"Hạn thanh toán: {invoice.DueDate?.ToString("dd/MM/yyyy") ?? "chưa xác định"}.";
    }

    private NhatKyNhacNoDto MapToDto(NhatKyNhacNo reminder)
    {
        return new NhatKyNhacNoDto
        {
            Id = reminder.Id,
            InvoiceId = reminder.InvoiceId,
            SentToUserId = reminder.SentToUserId,
            SentToUserPhone = reminder.SentToUser?.PhoneNumber,
            SentByUserId = reminder.SentByUserId,
            SentByUserPhone = reminder.SentByUser?.PhoneNumber,
            ReminderCount = reminder.ReminderCount,
            ReminderTime = reminder.ReminderTime,
            ReminderMethod = reminder.ReminderMethod,
            Content = reminder.Content,
            SendStatus = reminder.SendStatus,
            ErrorMessage = reminder.ErrorMessage
        };
    }
}
