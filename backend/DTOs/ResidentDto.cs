namespace backend.DTOs;

public class ResidentDto
{
    public long Id { get; set; }
    public long? UserId { get; set; }
    public string FullName { get; set; } = null!;
    public string? IdCardNumber { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Email { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public string? PermanentAddress { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateResidentDto
{
    public string FullName { get; set; } = null!;
    public string? IdCardNumber { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Email { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public string? PermanentAddress { get; set; }
}

public class UpdateResidentDto
{
    public string FullName { get; set; } = null!;
    public string? IdCardNumber { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Email { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public string? PermanentAddress { get; set; }
}
