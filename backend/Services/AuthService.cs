using backend.DTOs;
using backend.Models;
using backend.Repositories;

namespace backend.Services;

public interface IAuthService
{
    Task<LoginResponseDto> RegisterAsync(RegisterRequestDto request);
    Task<LoginResponseDto> LoginAsync(LoginRequestDto request);
    Task<LoginResponseDto> RefreshTokenAsync(RefreshTokenRequestDto request);
    Task ChangePasswordAsync(long userId, ChangePasswordRequestDto request);
    Task<UserDto> GetUserByIdAsync(long userId);
}

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IUserSessionRepository _sessionRepository;
    private readonly IJwtService _jwtService;
    private readonly IConfiguration _configuration;
    private readonly int _refreshTokenExpirationDays;

    public AuthService(
        IUserRepository userRepository,
        IUserSessionRepository sessionRepository,
        IJwtService jwtService,
        IConfiguration configuration)
    {
        _userRepository = userRepository;
        _sessionRepository = sessionRepository;
        _jwtService = jwtService;
        _configuration = configuration;
        _refreshTokenExpirationDays = int.Parse(configuration["Jwt:RefreshTokenExpirationDays"] ?? "30");
    }

    public async Task<LoginResponseDto> RegisterAsync(RegisterRequestDto request)
    {
        // Check if phone number already exists
        if (await _userRepository.PhoneNumberExistsAsync(request.PhoneNumber))
        {
            throw new InvalidOperationException("Số điện thoại đã được đăng ký");
        }

        // Create new user
        var user = new User
        {
            PhoneNumber = request.PhoneNumber,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = request.Role ?? "resident",
            Status = "active",
            FullName = request.FullName,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _userRepository.AddAsync(user);
        await _userRepository.SaveChangesAsync();

        // Generate tokens
        return await CreateLoginResponseAsync(user);
    }

    public async Task<LoginResponseDto> LoginAsync(LoginRequestDto request)
    {
        // Find user by phone number
        var user = await _userRepository.GetByPhoneNumberAsync(request.PhoneNumber);
        
        if (user == null)
        {
            throw new UnauthorizedAccessException("Số điện thoại hoặc mật khẩu không đúng");
        }

        // Verify password
        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Số điện thoại hoặc mật khẩu không đúng");
        }

        // Check if user is active
        if (user.Status.ToUpper() != "ACTIVE")
        {
            throw new UnauthorizedAccessException("Tài khoản đã bị khóa");
        }

        // Update last modified time
        user.UpdatedAt = DateTime.UtcNow;
        _userRepository.Update(user);
        await _userRepository.SaveChangesAsync();

        // Generate tokens
        return await CreateLoginResponseAsync(user);
    }

    public async Task<LoginResponseDto> RefreshTokenAsync(RefreshTokenRequestDto request)
    {
        // Validate refresh token
        var session = await _sessionRepository.GetByRefreshTokenAsync(request.RefreshToken);
        
        if (session == null)
        {
            throw new UnauthorizedAccessException("Refresh token không hợp lệ");
        }

        if (session.ExpiresAt <= DateTime.UtcNow)
        {
            throw new UnauthorizedAccessException("Refresh token đã hết hạn");
        }

        // Revoke old session
        session.RevokedAt = DateTime.UtcNow;
        _sessionRepository.Update(session);
        await _sessionRepository.SaveChangesAsync();

        // Generate new tokens
        return await CreateLoginResponseAsync(session.User!);
    }

    public async Task ChangePasswordAsync(long userId, ChangePasswordRequestDto request)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        
        if (user == null)
        {
            throw new InvalidOperationException("Không tìm thấy người dùng");
        }

        // Verify current password
        if (!BCrypt.Net.BCrypt.Verify(request.OldPassword, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Mật khẩu hiện tại không đúng");
        }

        // Update password
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;
        _userRepository.Update(user);

        // Invalidate all existing sessions
        await _sessionRepository.InvalidateUserSessionsAsync(userId);
        
        await _userRepository.SaveChangesAsync();
    }

    public async Task<UserDto> GetUserByIdAsync(long userId)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        
        if (user == null)
        {
            throw new InvalidOperationException("Không tìm thấy người dùng");
        }

        return new UserDto
        {
            Id = user.Id,
            PhoneNumber = user.PhoneNumber,
            Role = user.Role,
            Status = user.Status,
            FullName = user.FullName,
            CreatedAt = user.CreatedAt
        };
    }

    private async Task<LoginResponseDto> CreateLoginResponseAsync(User user)
    {
        // Generate tokens
        var accessToken = _jwtService.GenerateAccessToken(user);
        var refreshToken = _jwtService.GenerateRefreshToken();

        // Create session
        var session = new UserSession
        {
            UserId = user.Id,
            RefreshToken = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(_refreshTokenExpirationDays),
            CreatedAt = DateTime.UtcNow
        };

        await _sessionRepository.AddAsync(session);
        await _sessionRepository.SaveChangesAsync();

        return new LoginResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            TokenType = "Bearer",
            ExpiresIn = int.Parse(_configuration["Jwt:AccessTokenExpirationMinutes"] ?? "60") * 60,
            User = new UserDto
            {
                Id = user.Id,
                PhoneNumber = user.PhoneNumber,
                Role = user.Role,
                Status = user.Status,
                FullName = user.FullName,
                CreatedAt = user.CreatedAt
            }
        };
    }
}
