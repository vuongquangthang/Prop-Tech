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
    public byte Month { get; set; }
    public short Year { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; } // Calculated from ThanhToan
    public decimal RemainingAmount => TotalAmount - PaidAmount;
    public string Status { get; set; } = "Chưa thanh toán";
    public DateTime? DueDate { get; set; }
    public string? QrCodeUrl { get; set; }
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
