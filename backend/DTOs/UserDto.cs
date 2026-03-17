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
    public bool MustChangePassword { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? AvatarUrl { get; set; }
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
/// DTO để cập nhật thông tin hồ sơ cá nhân (user tự cập nhật)
/// </summary>
public class UpdateProfileDto
{
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? AvatarUrl { get; set; }
    public string? FullName { get; set; }
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

/// <summary>
/// DTO để admin reset mật khẩu người dùng
/// </summary>
public class AdminResetPasswordDto
{
    public string NewPassword { get; set; } = null!;
}
