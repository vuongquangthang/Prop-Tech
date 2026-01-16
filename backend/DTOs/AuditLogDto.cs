namespace backend.DTOs;

public class AuditLogDto
{
    public long Id { get; set; }
    public string EntityType { get; set; } = null!;
    public long? EntityId { get; set; }
    public string Action { get; set; } = null!;
    public long? UserId { get; set; }
    public string? UserFullName { get; set; }
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
    public string? IpAddress { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AuditLogFilterDto
{
    public string? EntityType { get; set; }
    public string? Action { get; set; }
    public long? UserId { get; set; }
    public long? EntityId { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}
