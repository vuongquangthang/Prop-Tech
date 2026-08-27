using backend.DTOs;
using backend.Hubs;
using backend.Models;
using backend.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using System.Text.RegularExpressions;

namespace backend.Services;

public interface IAuthService
{
    Task<LoginResponseDto> LoginAsync(LoginRequestDto request);
    Task<LoginResponseDto> RegisterAsync(RegisterRequestDto request);
    Task<LoginResponseDto> RefreshTokenAsync(string refreshToken);
    Task<UserDto> RequestPasswordResetAsync(ForgotPasswordRequestDto request);
    /// <summary>Quen mat khau qua OTP email: tim user, gui OTP neu co email. Tra ve email da che.</summary>
    Task<string> RequestPasswordResetOtpAsync(ForgotPasswordRequestDto request);
    /// <summary>Verify OTP + dat mat khau moi.</summary>
    Task ResetPasswordWithOtpAsync(ResetPasswordWithOtpDto request);
    Task ChangePasswordAsync(int userId, ChangePasswordRequestDto request);
    Task<UserDto?> GetUserByIdAsync(int userId);
    Task<UserDto> UpdateProfileAsync(int userId, UpdateProfileDto dto);
}

public class TemporaryAccountLockedException : UnauthorizedAccessException
{
    public TemporaryAccountLockedException(string message) : base(message)
    {
    }
}

public class AuthService : IAuthService
{
    private const int MaxFailedLoginAttempts = 5;
    private static readonly TimeSpan TemporaryLockDuration = TimeSpan.FromMinutes(15);
    private const string TemporaryLockMessage = "Tài khoản bị khóa tạm thời 15 phút do nhập sai quá 5 lần";

    private readonly IUserRepository _userRepository;
    private readonly IResidentRepository _residentRepository;
    private readonly IJwtService _jwtService;
    private readonly IPasswordResetOtpService _otpService;
    private readonly IHubContext<NotificationHub> _hubContext;

    public AuthService(
        IUserRepository userRepository,
        IResidentRepository residentRepository,
        IJwtService jwtService,
        IPasswordResetOtpService otpService,
        IHubContext<NotificationHub> hubContext)
    {
        _userRepository = userRepository;
        _residentRepository = residentRepository;
        _jwtService = jwtService;
        _otpService = otpService;
        _hubContext = hubContext;
    }

    public async Task<LoginResponseDto> LoginAsync(LoginRequestDto request)
    {
        var identity = request.PhoneNumber?.Trim().ToLowerInvariant() ?? string.Empty;
        var isEmail = identity.Contains('@');
        if (!isEmail && !Regex.IsMatch(identity, @"^0\d{9}$"))
        {
            throw new ArgumentException("Số điện thoại không hợp lệ");
        }

        var user = await _userRepository.GetByPhoneOrEmailAsync(identity);
        
        if (user == null)
        {
            throw new UnauthorizedAccessException("Số điện thoại hoặc mật khẩu không đúng");
        }

        var now = DateTime.UtcNow;
        if (user.TempLockedUntil.HasValue)
        {
            if (user.TempLockedUntil.Value > now)
            {
                throw new TemporaryAccountLockedException(TemporaryLockMessage);
            }

            user.TempLockedUntil = null;
            user.FailedLoginAttempts = 0;
            _userRepository.Update(user);
            await _userRepository.SaveChangesAsync();
        }

        if (user.FailedLoginAttempts >= MaxFailedLoginAttempts)
        {
            user.TempLockedUntil = now.Add(TemporaryLockDuration);
            _userRepository.Update(user);
            await _userRepository.SaveChangesAsync();
            throw new TemporaryAccountLockedException(TemporaryLockMessage);
        }

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            user.FailedLoginAttempts += 1;
            _userRepository.Update(user);
            await _userRepository.SaveChangesAsync();
            throw new UnauthorizedAccessException("Số điện thoại hoặc mật khẩu không đúng");
        }

        if (user.IsLocked)
        {
            throw new UnauthorizedAccessException("Tài khoản đã bị khóa");
        }

        var previousSessionId = user.ActiveSessionId;
        var newSessionId = Guid.NewGuid().ToString("N");

        // Update last login
        user.LastLoginAt = now;
        user.FailedLoginAttempts = 0;
        user.TempLockedUntil = null;
        user.ActiveSessionId = newSessionId;
        _userRepository.Update(user);
        await _userRepository.SaveChangesAsync();

        await NotifyPreviousSessionsRevokedAsync(user.Id, previousSessionId);

        var accessToken = _jwtService.GenerateAccessToken(user);
        var refreshToken = _jwtService.GenerateRefreshToken();

        // Save refresh token to user
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = now.AddDays(7);
        _userRepository.Update(user);
        await _userRepository.SaveChangesAsync();

        var userDto = await MapToUserDto(user);

        return new LoginResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            TokenType = "Bearer",
            ExpiresIn = 3600, // 1 hour in seconds
            User = userDto
        };
    }

    public async Task<LoginResponseDto> RegisterAsync(RegisterRequestDto request)
    {
        // Check if phone number already exists
        var existingUser = await _userRepository.GetByPhoneNumberAsync(request.PhoneNumber);
        if (existingUser != null)
        {
            throw new InvalidOperationException("Số điện thoại đã được đăng ký");
        }

        // Create resident first
        var resident = new Resident
        {
            FullName = request.FullName,
            PhoneNumber = request.PhoneNumber,
            IdCardNumber = request.IdCardNumber,
            Hometown = request.Hometown
        };
        await _residentRepository.AddAsync(resident);

        // Create user account
        var user = new User
        {
            PhoneNumber = request.PhoneNumber,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = "CuDan",
            ResidentId = resident.Id,
            // Ke thua chu nha tu ban ghi cu dan. Truoc day de trong, va JWT bu
            // bang fallback `?? user.Id` - nghia la cu dan nao vo tinh co
            // USER_ID trung OWNER_USER_ID cua mot chu nha se doc dung kho tri
            // thuc cua chu nha do. Gan dung tu dau thay vi doan.
            OwnerUserId = resident.OwnerUserId,
            DisplayName = request.FullName,
            ActiveSessionId = Guid.NewGuid().ToString("N"),
            IsLocked = false
        };
        await _userRepository.AddAsync(user);

        // Generate tokens
        var accessToken = _jwtService.GenerateAccessToken(user);
        var refreshToken = _jwtService.GenerateRefreshToken();

        // Save refresh token
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        _userRepository.Update(user);
        await _userRepository.SaveChangesAsync();

        var userDto = await MapToUserDto(user);

        return new LoginResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            TokenType = "Bearer",
            ExpiresIn = 3600,
            User = userDto
        };
    }

    public async Task<LoginResponseDto> RefreshTokenAsync(string refreshToken)
    {
        var user = await _userRepository.GetByRefreshTokenAsync(refreshToken);
        
        if (user == null || user.RefreshTokenExpiryTime <= DateTime.UtcNow)
        {
            throw new UnauthorizedAccessException("Refresh token không hợp lệ hoặc đã hết hạn");
        }

        var accessToken = _jwtService.GenerateAccessToken(user);
        var newRefreshToken = _jwtService.GenerateRefreshToken();

        user.RefreshToken = newRefreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        _userRepository.Update(user);
        await _userRepository.SaveChangesAsync();

        var userDto = await MapToUserDto(user);

        return new LoginResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = newRefreshToken,
            TokenType = "Bearer",
            ExpiresIn = 3600,
            User = userDto
        };
    }

    public async Task<UserDto> RequestPasswordResetAsync(ForgotPasswordRequestDto request)
    {
        var identity = request.PhoneNumberOrEmail?.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(identity))
        {
            throw new InvalidOperationException("Vui lòng nhập số điện thoại hoặc email");
        }

        var user = await _userRepository.GetByPhoneOrEmailAsync(identity);
        if (user == null)
        {
            throw new InvalidOperationException("Không tìm thấy tài khoản phù hợp");
        }

        if (user.IsLocked)
        {
            throw new InvalidOperationException("Tài khoản đang bị khóa. Vui lòng liên hệ quản trị viên");
        }

        return await MapToUserDto(user);
    }

    public async Task<string> RequestPasswordResetOtpAsync(ForgotPasswordRequestDto request)
    {
        var identity = request.PhoneNumberOrEmail?.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(identity))
        {
            throw new InvalidOperationException("Vui lòng nhập số điện thoại hoặc email");
        }

        var user = await _userRepository.GetByPhoneOrEmailAsync(identity);
        if (user == null)
        {
            throw new InvalidOperationException("Không tìm thấy tài khoản phù hợp");
        }

        if (user.IsLocked)
        {
            throw new InvalidOperationException("Tài khoản đang bị khóa. Vui lòng liên hệ quản trị viên");
        }

        if (string.IsNullOrWhiteSpace(user.Email))
        {
            throw new InvalidOperationException(
                "Tài khoản chưa có email. Vui lòng liên hệ quản trị viên để đặt lại mật khẩu.");
        }

        await _otpService.IssueAsync(user.Email);
        return MaskEmail(user.Email);
    }

    public async Task ResetPasswordWithOtpAsync(ResetPasswordWithOtpDto request)
    {
        var email = request.Email?.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(email))
        {
            throw new InvalidOperationException("Thiếu email");
        }
        if (string.IsNullOrWhiteSpace(request.Otp))
        {
            throw new InvalidOperationException("Vui lòng nhập mã OTP");
        }
        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 6)
        {
            throw new InvalidOperationException("Mật khẩu mới phải có ít nhất 6 ký tự");
        }

        var user = await _userRepository.GetByPhoneOrEmailAsync(email);
        if (user == null || string.IsNullOrWhiteSpace(user.Email))
        {
            throw new InvalidOperationException("Không tìm thấy tài khoản phù hợp");
        }

        // Verify OTP (nem loi neu sai/het han/qua so lan).
        await _otpService.VerifyAsync(user.Email, request.Otp);

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.MustChangePassword = false;
        _userRepository.Update(user);
        await _userRepository.SaveChangesAsync();
    }

    /// <summary>Che email: abc@gmail.com -> a***@gmail.com (khong lo email day du).</summary>
    private static string MaskEmail(string email)
    {
        var at = email.IndexOf('@');
        if (at <= 1) return email;
        return $"{email[0]}***{email[at..]}";
    }

    public async Task ChangePasswordAsync(int userId, ChangePasswordRequestDto request)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        
        if (user == null)
        {
            throw new InvalidOperationException("Người dùng không tồn tại");
        }

        // Nếu user phải đổi mật khẩu (lần đầu) thì không cần verify mật khẩu cũ
        if (!user.MustChangePassword)
        {
            if (!BCrypt.Net.BCrypt.Verify(request.OldPassword, user.PasswordHash))
            {
                throw new UnauthorizedAccessException("Mật khẩu cũ không đúng");
            }
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.MustChangePassword = false;
        _userRepository.Update(user);
        await _userRepository.SaveChangesAsync();
    }

    public async Task<UserDto?> GetUserByIdAsync(int userId)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null) return null;

        return await MapToUserDto(user);
    }

    public async Task<UserDto> UpdateProfileAsync(int userId, UpdateProfileDto dto)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null) throw new InvalidOperationException("Người dùng không tồn tại");

        user.Email = dto.Email;
        user.Address = dto.Address;
        user.AvatarUrl = dto.AvatarUrl;
        if (!string.IsNullOrWhiteSpace(dto.FullName))
        {
            user.DisplayName = dto.FullName.Trim();
        }
        _userRepository.Update(user);
        await _userRepository.SaveChangesAsync();

        return await MapToUserDto(user);
    }

    private async Task<UserDto> MapToUserDto(User user)
    {
        string? residentName = null;
        if (user.ResidentId.HasValue)
        {
            var resident = await _residentRepository.GetByIdAsync(user.ResidentId.Value);
            residentName = resident?.FullName;
        }

        return new UserDto
        {
            Id = user.Id,
            PhoneNumber = user.PhoneNumber,
            Role = MapRoleToEnglish(user.Role),
            ResidentId = user.ResidentId,
            OwnerUserId = user.OwnerUserId,
            FullName = user.DisplayName ?? residentName,
            DisplayName = user.DisplayName,
            ResidentName = residentName,
            IsLocked = user.IsLocked,
            MustChangePassword = user.MustChangePassword,
            LastLoginAt = user.LastLoginAt,
            Email = user.Email,
            Address = user.Address,
            AvatarUrl = user.AvatarUrl
        };
    }

    /// <summary>
    /// Map Vietnamese role names from database to English role names for frontend
    /// </summary>
    private string MapRoleToEnglish(string vietnameseRole)
    {
        return vietnameseRole switch
        {
            "Admin" => "Admin",
            "QuanLy" => "Manager",
            "KeToan" => "Accountant",
            "NhanVien" => "Staff",
            "CuDan" => "Resident",
            _ => vietnameseRole // Return as-is if not recognized
        };
    }

    private async Task NotifyPreviousSessionsRevokedAsync(int userId, string? previousSessionId)
    {
        try
        {
            var payload = new
            {
                message = "Tài khoản của bạn vừa đăng nhập ở một thiết bị khác"
            };

            if (!string.IsNullOrWhiteSpace(previousSessionId))
            {
                await _hubContext.Clients.Group(NotificationHub.SessionGroup(previousSessionId))
                    .SendAsync("SessionRevoked", payload);
                return;
            }

            await _hubContext.Clients.Group(NotificationHub.UserGroup(userId))
                .SendAsync("SessionRevoked", payload);
        }
        catch
        {
            // SignalR failure must not block login. Stale tokens are still rejected by JWT validation.
        }
    }
}
