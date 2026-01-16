namespace backend.DTOs;

// Resident DTOs
public class ResidentDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int RoomId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public UserDto? User { get; set; }
    public RoomDto? Room { get; set; }
}

public class CreateResidentRequestDto
{
    public int UserId { get; set; }
    public int RoomId { get; set; }
    public DateTime StartDate { get; set; }
}

public class UpdateResidentRequestDto
{
    public int RoomId { get; set; }
    public DateTime? EndDate { get; set; }
}
