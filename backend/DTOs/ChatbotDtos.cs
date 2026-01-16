namespace backend.DTOs;

// FAQ DTOs
public class FAQSearchRequestDto
{
    public string? SearchTerm { get; set; }
    public string? Category { get; set; }
}

public class FAQResponseDto
{
    public long Id { get; set; }
    public string Category { get; set; } = null!;
    public string Question { get; set; } = null!;
    public string Answer { get; set; } = null!;
    public string? Keywords { get; set; }
    public int DisplayOrder { get; set; }
    public int ViewCount { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class FAQCreateDto
{
    public string Category { get; set; } = null!;
    public string Question { get; set; } = null!;
    public string Answer { get; set; } = null!;
    public string? Keywords { get; set; }
    public int DisplayOrder { get; set; } = 0;
}

public class FAQUpdateDto
{
    public string? Category { get; set; }
    public string? Question { get; set; }
    public string? Answer { get; set; }
    public string? Keywords { get; set; }
    public int? DisplayOrder { get; set; }
    public bool? IsActive { get; set; }
}

// Regulation DTOs
public class RegulationSearchRequestDto
{
    public string? SearchTerm { get; set; }
    public string? Category { get; set; }
}

public class RegulationResponseDto
{
    public long Id { get; set; }
    public string RegulationCode { get; set; } = null!;
    public string Category { get; set; } = null!;
    public string Title { get; set; } = null!;
    public string Content { get; set; } = null!;
    public DateTime? EffectiveDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public int ViewCount { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class RegulationCreateDto
{
    public string RegulationCode { get; set; } = null!;
    public string Category { get; set; } = null!;
    public string Title { get; set; } = null!;
    public string Content { get; set; } = null!;
    public DateTime? EffectiveDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
}

public class RegulationUpdateDto
{
    public string? Category { get; set; }
    public string? Title { get; set; }
    public string? Content { get; set; }
    public DateTime? EffectiveDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public bool? IsActive { get; set; }
}
