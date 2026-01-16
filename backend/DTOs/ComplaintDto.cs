namespace backend.DTOs;

public class ComplaintDto
{
    public long Id { get; set; }
    public long RoomId { get; set; }
    public string RoomCode { get; set; } = null!;
    public string Title { get; set; } = null!;
    public string Description { get; set; } = null!;
    public string Category { get; set; } = null!;
    public string Priority { get; set; } = null!;
    public string Status { get; set; } = null!;
    public long CreatedBy { get; set; }
    public string CreatedByName { get; set; } = null!;
    public long? AssignedTo { get; set; }
    public string? AssignedToName { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ComplaintDetailDto : ComplaintDto
{
    public string? Resolution { get; set; }
    public List<ComplaintResponseDto> Responses { get; set; } = new();
}

public class ComplaintResponseDto
{
    public long Id { get; set; }
    public long ComplaintId { get; set; }
    public string Response { get; set; } = null!;
    public long RespondedBy { get; set; }
    public string RespondedByName { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
}

public class CreateComplaintDto
{
    public long RoomId { get; set; }
    public string Title { get; set; } = null!;
    public string Description { get; set; } = null!;
    public string Category { get; set; } = null!; // MAINTENANCE, NOISE, FACILITY, BILLING, OTHER
    public string Priority { get; set; } = "MEDIUM"; // LOW, MEDIUM, HIGH, URGENT
}

public class UpdateComplaintDto
{
    public string? Status { get; set; } // OPEN, IN_PROGRESS, RESOLVED, CLOSED
    public long? AssignedTo { get; set; }
    public string? Resolution { get; set; }
}

public class AddComplaintResponseDto
{
    public string Response { get; set; } = null!;
}
