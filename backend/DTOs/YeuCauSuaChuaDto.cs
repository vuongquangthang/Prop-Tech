namespace backend.DTOs;

/// <summary>
/// DTO cho yêu cầu sửa chữa
/// </summary>
public class YeuCauSuaChuaDto
{
    public int Id { get; set; }
    public int RoomId { get; set; }
    public string? RoomNumber { get; set; }
    public int UserId { get; set; }
    public string? UserName { get; set; }
    public string IssueType { get; set; } = null!;
    public string? Description { get; set; }
    public string? MediaUrls { get; set; } // JSON string array
    public List<string> ImageUrls 
    { 
        get 
        {
            if (string.IsNullOrEmpty(MediaUrls)) return new List<string>();
            try { return System.Text.Json.JsonSerializer.Deserialize<List<string>>(MediaUrls) ?? new List<string>(); }
            catch { return new List<string>(); }
        }
    }
    public string Status { get; set; } = "Chờ xử lý";
    public string? AdminNote { get; set; }
    public string? CompletionImageUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
}

/// <summary>
/// DTO để tạo yêu cầu sửa chữa mới
/// </summary>
public class CreateYeuCauSuaChuaDto
{
    public int? RoomId { get; set; } // Optional - nếu null sẽ tự động lấy từ residency hiện tại
    public string IssueType { get; set; } = null!;
    public string? Description { get; set; }
    public string? MediaUrls { get; set; } // JSON string array of image URLs
}

/// <summary>
/// DTO để cập nhật trạng thái yêu cầu
/// </summary>
public class UpdateYeuCauSuaChuaDto
{
    public string? Status { get; set; } // Chờ xử lý, Đang xử lý, Hoàn thành, Từ chối
    public string? AdminNote { get; set; }
    public string? CompletionImageUrl { get; set; }
}

/// <summary>
/// DTO để đóng yêu cầu
/// </summary>
public class CloseYeuCauSuaChuaDto
{
    public string Status { get; set; } = "Đã đóng"; // Đã đóng (hài lòng) hoặc Chờ xử lý (yêu cầu sửa lại)
    public string? AdminNote { get; set; }
    public string? CompletionImageUrl { get; set; }
}
