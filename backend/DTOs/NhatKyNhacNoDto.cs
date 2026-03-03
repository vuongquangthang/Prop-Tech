namespace backend.DTOs;

/// <summary>
/// DTO for debt reminder log display
/// </summary>
public class NhatKyNhacNoDto
{
    public long Id { get; set; }
    public int InvoiceId { get; set; }
    public int SentToUserId { get; set; }
    public string? SentToUserPhone { get; set; }
    public int? SentByUserId { get; set; }
    public string? SentByUserPhone { get; set; }
    public int ReminderCount { get; set; }
    public DateTime ReminderTime { get; set; }
    public string ReminderMethod { get; set; } = null!;
    public string? Content { get; set; }
    public string SendStatus { get; set; } = null!;
    public string? ErrorMessage { get; set; }
}

/// <summary>
/// DTO to create debt reminder log
/// </summary>
public class CreateNhatKyNhacNoDto
{
    public int InvoiceId { get; set; }
    public int SentToUserId { get; set; }
    public string ReminderMethod { get; set; } = "App notification"; // SMS, Email, Zalo, App notification
    public string? Content { get; set; }
}

/// <summary>
/// DTO to update reminder status
/// </summary>
public class UpdateNhatKyNhacNoStatusDto
{
    public string SendStatus { get; set; } = null!; // Đang gửi, Thành công, Thất bại
    public string? ErrorMessage { get; set; }
}
