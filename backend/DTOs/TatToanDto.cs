namespace backend.DTOs
{
    public class TatToanDto
    {
        public int Id { get; set; }
        public int ResidencyId { get; set; }
        public DateTime SettlementDate { get; set; }
        public decimal? DepositRefund { get; set; }
        public decimal? OutstandingDebt { get; set; }
        public decimal? Compensation { get; set; }
        public decimal? Deductions { get; set; }
        public decimal? TotalSettlement { get; set; }
        public string? ResidentSignature { get; set; }
        public string? ManagerSignature { get; set; }
        public string? Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public string? RoomNumber { get; set; }
        public string? ResidentName { get; set; }
        public string? ResidentPhone { get; set; }

        // Details
        public List<ChiTietPhieuTatToanDto> Details { get; set; } = new List<ChiTietPhieuTatToanDto>();
    }

    public class CreateTatToanDto
    {
        public int ResidencyId { get; set; }
        public DateTime SettlementDate { get; set; }
        public decimal? DepositRefund { get; set; }
        public decimal? OutstandingDebt { get; set; }
        public decimal? Compensation { get; set; }
        public decimal? Deductions { get; set; }
        public string? ResidentSignature { get; set; }
        public string? ManagerSignature { get; set; }
        public string Status { get; set; } = "Pending"; // Pending, Completed, Cancelled

        // Details
        public List<CreateChiTietPhieuTatToanDto> Details { get; set; } = new List<CreateChiTietPhieuTatToanDto>();
    }

    public class UpdateTatToanDto
    {
        public DateTime? SettlementDate { get; set; }
        public decimal? DepositRefund { get; set; }
        public decimal? OutstandingDebt { get; set; }
        public decimal? Compensation { get; set; }
        public decimal? Deductions { get; set; }
        public string? ResidentSignature { get; set; }
        public string? ManagerSignature { get; set; }
        public string? Status { get; set; }

        // Details
        public List<CreateChiTietPhieuTatToanDto>? Details { get; set; }
    }

    public class ChiTietPhieuTatToanDto
    {
        public long Id { get; set; }
        public int SettlementId { get; set; }
        public string? Description { get; set; }
        public decimal? Amount { get; set; }
        public string? Type { get; set; } // DepositRefund, Debt, Deduction, Compensation
        public DateTime CreatedAt { get; set; }
    }

    public class CreateChiTietPhieuTatToanDto
    {
        public string? Description { get; set; }
        public decimal Amount { get; set; }
        public string Type { get; set; } = "Deduction"; // DepositRefund, Debt, Deduction, Compensation
    }
}
