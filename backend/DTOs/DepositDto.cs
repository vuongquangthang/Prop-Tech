namespace backend.DTOs;

public class DepositDto
{
    public long Id { get; set; }
    public long ResidencyId { get; set; }
    public long RoomId { get; set; }
    public long ResidentId { get; set; }
    public decimal Amount { get; set; }
    public string Status { get; set; } = null!;
    public DateTime? PaidDate { get; set; }
    public DateTime? RefundDate { get; set; }
    public decimal? RefundAmount { get; set; }
    public decimal RefundDeduction { get; set; }
    public string? RefundReason { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class UpdateDepositStatusDto
{
    public string Status { get; set; } = null!; // UNPAID, PAID, REFUNDED, FORFEITED
    public DateTime? PaidDate { get; set; }
    public string? Notes { get; set; }
}

public class RefundDepositDto
{
    public decimal RefundAmount { get; set; }
    public decimal RefundDeduction { get; set; }
    public string RefundReason { get; set; } = null!;
}
