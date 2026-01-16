namespace backend.DTOs;

// Complaint DTOs
public class ComplaintDto
{
    public int Id { get; set; }
    public int ResidentId { get; set; }
    public required string Category { get; set; }
    public required string Description { get; set; }
    public required string Status { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateComplaintRequestDto
{
    public required string Category { get; set; }
    public required string Description { get; set; }
}

public class UpdateComplaintStatusRequestDto
{
    public required string Status { get; set; }
}
