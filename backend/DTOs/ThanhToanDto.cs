namespace backend.DTOs;

/// <summary>
/// DTO cho giao dịch thanh toán
/// </summary>
public class ThanhToanDto
{
    public long Id { get; set; }
    public string PaymentType { get; set; } = null!; // Tiền mặt, Chuyển khoản, Thẻ, Khác
    public int? InvoiceId { get; set; }
    public int? SettlementId { get; set; }
    public decimal Amount { get; set; }
    public string? TransactionCode { get; set; }
    public string Status { get; set; } = "PENDING"; // PENDING, SUCCESS, FAILED
    public DateTime? PaidAt { get; set; }
    public DateTime CreatedAt { get; set; }
    
    // Extra info
    public string? InvoiceReference { get; set; } // Month/Year for display
    public string? RoomNumber { get; set; }
}

/// <summary>
/// DTO để tạo thanh toán mới
/// </summary>
public class CreateThanhToanDto
{
    public string PaymentType { get; set; } = "Tiền mặt"; // Tiền mặt, Chuyển khoản, Thẻ, Khác
    public int? InvoiceId { get; set; }
    public int? SettlementId { get; set; }
    public decimal Amount { get; set; }
    public string? TransactionCode { get; set; }
}

/// <summary>
/// DTO để cập nhật thanh toán
/// </summary>
public class UpdateThanhToanDto
{
    public string? PaymentType { get; set; }
    public string? TransactionCode { get; set; }
}
