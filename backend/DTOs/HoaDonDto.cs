namespace backend.DTOs;

/// <summary>
/// DTO cho hóa đơn với chi tiết và thanh toán
/// </summary>
public class HoaDonDto
{
    public int Id { get; set; }
    public int ContractId { get; set; }
    public int? RoomId { get; set; }
    public string? RoomNumber { get; set; }
    public string? ResidentName { get; set; }
    public byte Month { get; set; }
    public short Year { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; } // Calculated from SUCCESS ThanhToan only
    public decimal RemainingAmount => TotalAmount - PaidAmount;
    public string Status { get; set; } = "Chưa thanh toán";
    public DateTime? DueDate { get; set; }
    public DateTime? PaidDate { get; set; } // Date of last successful payment
    public string? QrCodeUrl { get; set; }
    public int? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? RejectedReason { get; set; }
    public List<ChiTietHoaDonDto> LineItems { get; set; } = new();
}

/// <summary>
/// DTO để tạo hóa đơn mới
/// </summary>
public class CreateHoaDonDto
{
    public int ContractId { get; set; }
    public byte Month { get; set; }
    public short Year { get; set; }
    public DateTime? DueDate { get; set; }
    public List<CreateChiTietHoaDonDto> LineItems { get; set; } = new();
}

/// <summary>
/// DTO chi tiết hóa đơn
/// </summary>
public class ChiTietHoaDonDto
{
    public long Id { get; set; }
    public string ItemType { get; set; } = null!; // TienPhong, Dien, Nuoc, DichVu, PhatSinh, KhauTru
    public int? ServiceId { get; set; }
    public string? ServiceName { get; set; }
    public string? Unit { get; set; }
    public decimal? Quantity { get; set; }
    public decimal? UnitPrice { get; set; }
    public decimal Subtotal => (Quantity ?? 0) * (UnitPrice ?? 0);
    public string? Description { get; set; }
}

/// <summary>
/// DTO để tạo chi tiết hóa đơn
/// </summary>
public class CreateChiTietHoaDonDto
{
    public string ItemType { get; set; } = null!; // TienPhong, Dien, Nuoc, DichVu, PhatSinh, KhauTru
    public int? ServiceId { get; set; }
    public decimal? Quantity { get; set; }
    public decimal? UnitPrice { get; set; }
    public string? Description { get; set; }
}

/// <summary>
/// DTO để thanh toán hóa đơn
/// </summary>
public class PayHoaDonDto
{
    public decimal Amount { get; set; }
    public string PaymentType { get; set; } = "Tiền mặt"; // Tiền mặt, Chuyển khoản, Thẻ, Khác
    public string? TransactionCode { get; set; }
}

/// <summary>
/// DTO kết quả tính hóa đơn nháp
/// </summary>
public class CalculateInvoiceResultDto
{
    public int TotalContracts { get; set; }
    public int TotalInvoices { get; set; }
    public decimal TotalAmount { get; set; }
    public int Skipped { get; set; }
    public List<HoaDonDto> Invoices { get; set; } = new();
    public List<string> SkippedReasons { get; set; } = new();
    public List<string> Errors { get; set; } = new();
    public List<string> Warnings { get; set; } = new();
}

/// <summary>
/// DTO để chỉnh sửa hóa đơn nháp
/// </summary>
public class EditDraftInvoiceDto
{
    public List<CreateChiTietHoaDonDto> LineItems { get; set; } = new();
}

/// <summary>
/// DTO để phê duyệt hàng loạt
/// </summary>
public class BatchApproveDto
{
    public List<int> InvoiceIds { get; set; } = new();
}

/// <summary>
/// DTO để từ chối hóa đơn
/// </summary>
public class RejectInvoiceDto
{
    public string Reason { get; set; } = null!;
}

public class SendInvoiceReminderRequestDto
{
    public string? Content { get; set; }
}

public class SendInvoiceReminderResultDto
{
    public int InvoiceId { get; set; }
    public int SentCount { get; set; }
    public List<int> RecipientUserIds { get; set; } = new();
}
