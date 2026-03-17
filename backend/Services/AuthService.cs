using backend.DTOs;
using backend.Models;
using backend.Repositories;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public interface IAuthService
{
    Task<LoginResponseDto> LoginAsync(LoginRequestDto request);
    Task<LoginResponseDto> RegisterAsync(RegisterRequestDto request);
    Task<LoginResponseDto> RefreshTokenAsync(string refreshToken);
    Task ChangePasswordAsync(int userId, ChangePasswordRequestDto request);
    Task<UserDto?> GetUserByIdAsync(int userId);
    Task<UserDto> UpdateProfileAsync(int userId, UpdateProfileDto dto);
}

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IResidentRepository _residentRepository;
    private readonly IJwtService _jwtService;

    public AuthService(
        IUserRepository userRepository,
        IResidentRepository residentRepository,
        IJwtService jwtService)
    {
        _userRepository = userRepository;
        _residentRepository = residentRepository;
        _jwtService = jwtService;
    }

    public async Task<LoginResponseDto> LoginAsync(LoginRequestDto request)
    {
        var user = await _userRepository.GetByPhoneNumberAsync(request.PhoneNumber);
        
        if (user == null)
        {
            throw new UnauthorizedAccessException("Số điện thoại hoặc mật khẩu không đúng");
        }

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Số điện thoại hoặc mật khẩu không đúng");
        }

        if (user.IsLocked)
        {
            throw new UnauthorizedAccessException("Tài khoản đã bị khóa");
        }

        // Update last login
        user.LastLoginAt = DateTime.UtcNow;
        _userRepository.Update(user);
        await _userRepository.SaveChangesAsync();

        var accessToken = _jwtService.GenerateAccessToken(user);
        var refreshToken = _jwtService.GenerateRefreshToken();

        // Save refresh token to user
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

    public async Task ChangePasswordAsync(int userId, ChangePasswordRequestDto request)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        
        if (user == null)
        {
            throw new InvalidOperationException("Người dùng không tồn tại");
        }

        if (!BCrypt.Net.BCrypt.Verify(request.OldPassword, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Mật khẩu cũ không đúng");
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
}
