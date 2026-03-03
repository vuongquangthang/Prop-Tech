namespace backend.DTOs;

/// <summary>
/// DTO cho user
/// </summary>
public class UserDto
{
    public int Id { get; set; }
    public string PhoneNumber { get; set; } = null!;
    public string Role { get; set; } = null!;
    public int? ResidentId { get; set; }
    public string? ResidentName { get; set; }
    public bool IsLocked { get; set; }
    public DateTime? LastLoginAt { get; set; }
}

/// <summary>
/// DTO để tạo user mới (admin use)
/// </summary>
public class CreateUserDto
{
    public string PhoneNumber { get; set; } = null!;
    public string Password { get; set; } = null!;
    public string Role { get; set; } = "CuDan"; // Admin, QuanLy, CuDan, KeToan
    public int? ResidentId { get; set; }
}

/// <summary>
/// DTO để cập nhật user
/// </summary>
public class UpdateUserDto
{
    public string? Role { get; set; }
    public int? ResidentId { get; set; }
    public bool? IsLocked { get; set; }
}

/// <summary>
/// DTO để đổi mật khẩu
/// </summary>
public class ChangePasswordDto
{
    public string OldPassword { get; set; } = null!;
    public string NewPassword { get; set; } = null!;
}
