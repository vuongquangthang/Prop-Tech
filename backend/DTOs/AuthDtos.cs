namespace backend.DTOs;

// Auth DTOs
public class LoginRequestDto
{
    public string PhoneNumber { get; set; } = null!;
    public string Password { get; set; } = null!;
}

public class LoginResponseDto
{
    public string AccessToken { get; set; } = null!;
    public string RefreshToken { get; set; } = null!;
    public string TokenType { get; set; } = "Bearer";
    public int ExpiresIn { get; set; } // seconds
    public UserDto User { get; set; } = null!;
}

public class RegisterRequestDto
{
    public string PhoneNumber { get; set; } = null!;
    public string Password { get; set; } = null!;
    public string FullName { get; set; } = null!;
    public string Role { get; set; } = "RESIDENT";
}

public class RefreshTokenRequestDto
{
    public string RefreshToken { get; set; } = null!;
}

public class ChangePasswordRequestDto
{
    public string OldPassword { get; set; } = null!;
    public string NewPassword { get; set; } = null!;
}

// User DTOs
public class UserDto
{
    public long Id { get; set; }
    public string PhoneNumber { get; set; } = null!;
    public string Role { get; set; } = null!;
    public string Status { get; set; } = null!;
    public string? FullName { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateUserRequestDto
{
    public string PhoneNumber { get; set; } = null!;
    public string Password { get; set; } = null!;
    public string FullName { get; set; } = null!;
    public string Role { get; set; } = "RESIDENT";
}

public class UpdateUserStatusRequestDto
{
    public string Status { get; set; } = null!;
}

public class ResetPasswordRequestDto
{
    public string NewPassword { get; set; } = null!;
}
