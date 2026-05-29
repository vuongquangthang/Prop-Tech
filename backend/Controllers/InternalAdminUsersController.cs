using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/internal/admin-users")]
[AllowAnonymous]
public class InternalAdminUsersController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly IConfiguration _configuration;

    public InternalAdminUsersController(ApplicationDbContext db, IConfiguration configuration)
    {
        _db = db;
        _configuration = configuration;
    }

    [HttpPost("sync")]
    public async Task<IActionResult> Sync([FromBody] SyncAdminUserRequest request)
    {
        if (!IsValidInternalKey())
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "Invalid internal API key" });
        }

        var phone = Normalize(request.PhoneNumber);
        if (string.IsNullOrWhiteSpace(phone))
        {
            return BadRequest(new { message = "PhoneNumber is required" });
        }

        var role = MapRole(request.Role);
        var user = await _db.Users.FirstOrDefaultAsync(item => item.PhoneNumber == phone);
        if (user == null)
        {
            if (string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new { message = "Password is required for new user" });
            }

            user = new User
            {
                PhoneNumber = phone,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                Role = role,
                Email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim(),
                DisplayName = FirstNonEmpty(request.DisplayName, request.FullName, request.Name),
                IsLocked = request.IsLocked,
                MustChangePassword = false
            };
            await _db.Users.AddAsync(user);
        }
        else
        {
            user.Role = role;
            user.Email = string.IsNullOrWhiteSpace(request.Email) ? user.Email : request.Email.Trim();
            var displayName = FirstNonEmpty(request.DisplayName, request.FullName, request.Name);
            if (!string.IsNullOrWhiteSpace(displayName))
            {
                user.DisplayName = displayName;
            }
            user.IsLocked = request.IsLocked;
            if (!user.OwnerUserId.HasValue && IsSystemAccount(role))
            {
                user.OwnerUserId = user.Id;
            }
            if (!string.IsNullOrWhiteSpace(request.Password))
            {
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
                user.MustChangePassword = false;
            }
        }

        await _db.SaveChangesAsync();
        if (!user.OwnerUserId.HasValue && IsSystemAccount(user.Role))
        {
            user.OwnerUserId = user.Id;
            await _db.SaveChangesAsync();
        }
        return Ok(new
        {
            id = user.Id,
            phoneNumber = user.PhoneNumber,
            email = user.Email,
            displayName = user.DisplayName,
            role = user.Role,
            isLocked = user.IsLocked
        });
    }

    private static bool IsSystemAccount(string role)
    {
        return role is "Admin" or "QuanLy" or "KeToan" or "NhanVien";
    }

    private bool IsValidInternalKey()
    {
        var configured = _configuration["InternalApiKey"] ?? "dev-internal-key";
        return Request.Headers.TryGetValue("X-Internal-Api-Key", out var apiKey)
            && apiKey == configured;
    }

    private static string MapRole(string role)
    {
        return role?.Trim().ToUpperInvariant() switch
        {
            "PROPTECH_ADMIN" => "Admin",
            "PROPTECH_RESIDENT" => "CuDan",
            "PROPTECH_MOBILE_STAFF" => "NhanVien",
            "SUPPORT_STAFF" => "NhanVien",
            _ => "Admin"
        };
    }

    private static string Normalize(string value)
    {
        return value.Trim().Replace(" ", "").Replace(".", "").Replace("-", "").ToLowerInvariant();
    }

    private static string? FirstNonEmpty(params string?[] values)
    {
        foreach (var value in values)
        {
            if (!string.IsNullOrWhiteSpace(value))
            {
                return value.Trim();
            }
        }

        return null;
    }

    public class SyncAdminUserRequest
    {
        public string PhoneNumber { get; set; } = "";
        public string? Email { get; set; }
        public string? Name { get; set; }
        public string? FullName { get; set; }
        public string? DisplayName { get; set; }
        public string Role { get; set; } = "PROPTECH_ADMIN";
        public string? Password { get; set; }
        public bool IsLocked { get; set; }
    }
}
