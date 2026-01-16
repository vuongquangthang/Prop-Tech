namespace backend.DTOs;

public class BillingPeriodDto
{
    public long Id { get; set; }
    public DateTime PeriodMonth { get; set; }
    public DateTime CutoffDate { get; set; }
    public DateTime DueDate { get; set; }
    public string Status { get; set; } = null!;
    public bool LateFeeEnabled { get; set; }
    public decimal? LateFeePercent { get; set; }
    public decimal? LateFeeFixed { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateBillingPeriodDto
{
    public DateTime PeriodMonth { get; set; }
    public DateTime? CutoffDate { get; set; }
    public DateTime? DueDate { get; set; }
    public bool LateFeeEnabled { get; set; } = false;
    public decimal? LateFeePercent { get; set; }
    public decimal? LateFeeFixed { get; set; }
}

public class UpdateBillingPeriodDto
{
    public string Status { get; set; } = null!; // DRAFT, CONFIRMED, CLOSED
    public DateTime? CutoffDate { get; set; }
    public DateTime? DueDate { get; set; }
}
