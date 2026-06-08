namespace backend.DTOs;

/// <summary>
/// DTO cho đăng nhập
/// </summary>
public class LoginRequestDto
{
    public string PhoneNumber { get; set; } = null!;
    public string Password { get; set; } = null!;
}

/// <summary>
/// DTO response sau khi đăng nhập thành công
/// </summary>
public class LoginResponseDto
{
    public string AccessToken { get; set; } = null!;
    public string RefreshToken { get; set; } = null!;
    public string TokenType { get; set; } = "Bearer";
    public int ExpiresIn { get; set; } // seconds
    public UserDto User { get; set; } = null!;
}

/// <summary>
/// DTO cho đăng ký
/// </summary>
public class RegisterRequestDto
{
    public string PhoneNumber { get; set; } = null!;
    public string Password { get; set; } = null!;
    public string FullName { get; set; } = null!;
    public string? IdCardNumber { get; set; }
    public string? Hometown { get; set; }
}

/// <summary>
/// DTO cho refresh token
/// </summary>
public class RefreshTokenRequestDto
{
    public string RefreshToken { get; set; } = null!;
}

/// <summary>
/// DTO cho đổi mật khẩu
/// </summary>
public class ChangePasswordRequestDto
{
    public string OldPassword { get; set; } = null!;
    public string NewPassword { get; set; } = null!;
}

public class ForgotPasswordRequestDto
{
    public string PhoneNumberOrEmail { get; set; } = null!;
}

