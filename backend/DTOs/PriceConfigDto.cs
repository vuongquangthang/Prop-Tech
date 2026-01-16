namespace backend.DTOs;

public class PriceConfigDto
{
    public long Id { get; set; }
    public string ServiceType { get; set; } = null!;
    public string PricingMethod { get; set; } = null!;
    public decimal UnitPrice { get; set; }
    public string? UnitType { get; set; }
    public DateTime EffectiveDate { get; set; }
    public bool IsTiered { get; set; }
    public string? Description { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreatePriceConfigDto
{
    public string ServiceType { get; set; } = null!; // WATER, ELECTRICITY, SERVICE
    public string PricingMethod { get; set; } = null!; // PER_PERSON, PER_UNIT, FIXED, TIERED
    public decimal UnitPrice { get; set; }
    public string? UnitType { get; set; }
    public DateTime EffectiveDate { get; set; }
    public bool IsTiered { get; set; } = false;
    public string? Description { get; set; }
    public string? Notes { get; set; }
}

public class UpdatePriceConfigDto
{
    public decimal UnitPrice { get; set; }
    public string? UnitType { get; set; }
    public bool IsTiered { get; set; }
    public string? Description { get; set; }
    public string? Notes { get; set; }
}
