using backend.Data;
using backend.DTOs;
using backend.Models;
using backend.Repositories;
using Microsoft.EntityFrameworkCore;
using BC = BCrypt.Net.BCrypt;

namespace backend.Services
{
    public interface IUserService
    {
        Task<IEnumerable<UserDto>> GetAllAsync();
        Task<IEnumerable<UserDto>> GetAllAsync(int ownerUserId);
        Task<UserDto?> GetByIdAsync(int id);
        Task<UserDto?> GetByIdAsync(int id, int ownerUserId);
        Task<IEnumerable<UserDto>> GetByRoleAsync(string role);
        Task<IEnumerable<UserDto>> GetByRoleAsync(string role, int ownerUserId);
        Task<UserDto> CreateAsync(CreateUserDto dto);
        Task<UserDto> CreateAsync(CreateUserDto dto, int ownerUserId);
        Task<UserDto> UpdateAsync(int id, UpdateUserDto dto);
        Task<UserDto> UpdateAsync(int id, UpdateUserDto dto, int ownerUserId);
        Task<bool> LockUserAsync(int id);
        Task<bool> LockUserAsync(int id, int ownerUserId);
        Task<bool> UnlockUserAsync(int id);
        Task<bool> UnlockUserAsync(int id, int ownerUserId);
        Task<bool> ResetPasswordAsync(int id, string newPassword);
        Task<bool> ResetPasswordAsync(int id, string newPassword, int ownerUserId);
        Task<bool> DeleteAsync(int id);
        Task<bool> DeleteAsync(int id, int ownerUserId);
    }

    public class UserService : IUserService
    {
        private readonly IUserRepository _userRepository;
        private readonly IResidentRepository _residentRepository;
        private readonly ApplicationDbContext _context;

        public UserService(
            IUserRepository userRepository,
            IResidentRepository residentRepository,
            ApplicationDbContext context)
        {
            _userRepository = userRepository;
            _residentRepository = residentRepository;
            _context = context;
        }

        public async Task<IEnumerable<UserDto>> GetAllAsync()
        {
            var users = await _userRepository.GetAllAsync();
            return users.Select(MapToDto);
        }

        public async Task<IEnumerable<UserDto>> GetAllAsync(int ownerUserId)
        {
            var users = await UsersForOwner(ownerUserId).ToListAsync();
            return users.Select(MapToDto);
        }

        public async Task<UserDto?> GetByIdAsync(int id)
        {
            var user = await _userRepository.GetWithResidentAsync(id);
            return user == null ? null : MapToDto(user);
        }

        public async Task<UserDto?> GetByIdAsync(int id, int ownerUserId)
        {
            var user = await UserForOwner(id, ownerUserId);
            return user == null ? null : MapToDto(user);
        }

        public async Task<IEnumerable<UserDto>> GetByRoleAsync(string role)
        {
            var users = await _userRepository.GetByRoleAsync(role);
            return users.Select(MapToDto);
        }

        public async Task<IEnumerable<UserDto>> GetByRoleAsync(string role, int ownerUserId)
        {
            var users = await UsersForOwner(ownerUserId)
                .Where(u => u.Role == role)
                .ToListAsync();
            return users.Select(MapToDto);
        }

        public Task<UserDto> CreateAsync(CreateUserDto dto)
        {
            return CreateAsync(dto, null);
        }

        public Task<UserDto> CreateAsync(CreateUserDto dto, int ownerUserId)
        {
            return CreateAsync(dto, (int?)ownerUserId);
        }

        private async Task<UserDto> CreateAsync(CreateUserDto dto, int? ownerUserId)
        {
            if (await _userRepository.ExistsByPhoneAsync(dto.PhoneNumber))
            {
                throw new Exception($"So dien thoai '{dto.PhoneNumber}' da duoc su dung");
            }

            if (string.Equals(dto.Role, "CuDan", StringComparison.OrdinalIgnoreCase) && !dto.ResidentId.HasValue)
            {
                throw new Exception("Tai khoan cu dan phai lien ket voi cu dan");
            }

            int? assignedOwnerUserId = ownerUserId;

            if (dto.ResidentId.HasValue)
            {
                var resident = await _context.Residents
                    .FirstOrDefaultAsync(r => r.Id == dto.ResidentId.Value);
                if (resident == null)
                {
                    throw new Exception("Cu dan khong ton tai");
                }

                if (ownerUserId.HasValue && !await ResidentBelongsToOwner(dto.ResidentId.Value, ownerUserId.Value))
                {
                    throw new Exception("Cu dan khong thuoc chu nha dang dang nhap");
                }

                assignedOwnerUserId ??= resident.OwnerUserId;
            }

            var user = new User
            {
                PhoneNumber = dto.PhoneNumber,
                PasswordHash = BC.HashPassword(dto.Password),
                Role = dto.Role,
                ResidentId = dto.ResidentId,
                OwnerUserId = assignedOwnerUserId,
                IsLocked = false,
                MustChangePassword = true
            };

            await _userRepository.AddAsync(user);
            await _userRepository.SaveChangesAsync();

            if (!user.OwnerUserId.HasValue && IsSystemAccount(user.Role))
            {
                user.OwnerUserId = user.Id;
                _userRepository.Update(user);
                await _userRepository.SaveChangesAsync();
            }

            var created = await _userRepository.GetWithResidentAsync(user.Id);
            return MapToDto(created!);
        }

        public async Task<UserDto> UpdateAsync(int id, UpdateUserDto dto)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null)
            {
                throw new Exception("Nguoi dung khong ton tai");
            }

            return await UpdateUser(user, dto, null);
        }

        public async Task<UserDto> UpdateAsync(int id, UpdateUserDto dto, int ownerUserId)
        {
            var user = await UserForOwner(id, ownerUserId);
            if (user == null)
            {
                throw new Exception("Nguoi dung khong ton tai trong pham vi chu nha nay");
            }

            return await UpdateUser(user, dto, ownerUserId);
        }

        private async Task<UserDto> UpdateUser(User user, UpdateUserDto dto, int? ownerUserId)
        {
            if (!string.IsNullOrEmpty(dto.Role))
            {
                user.Role = dto.Role;
            }

            if (dto.ResidentId.HasValue)
            {
                var resident = await _context.Residents.FirstOrDefaultAsync(r => r.Id == dto.ResidentId.Value);
                if (resident == null)
                {
                    throw new Exception("Cu dan khong ton tai");
                }

                if (ownerUserId.HasValue && !await ResidentBelongsToOwner(dto.ResidentId.Value, ownerUserId.Value))
                {
                    throw new Exception("Cu dan khong thuoc chu nha dang dang nhap");
                }

                user.ResidentId = dto.ResidentId;
                user.OwnerUserId = ownerUserId ?? resident.OwnerUserId ?? user.OwnerUserId;
            }

            if (dto.IsLocked.HasValue)
            {
                user.IsLocked = dto.IsLocked.Value;
            }

            _userRepository.Update(user);
            await _userRepository.SaveChangesAsync();

            var updated = await _userRepository.GetWithResidentAsync(user.Id);
            return MapToDto(updated!);
        }

        public Task<bool> LockUserAsync(int id)
        {
            return SetLockState(id, true, null);
        }

        public Task<bool> LockUserAsync(int id, int ownerUserId)
        {
            return SetLockState(id, true, ownerUserId);
        }

        public Task<bool> UnlockUserAsync(int id)
        {
            return SetLockState(id, false, null);
        }

        public Task<bool> UnlockUserAsync(int id, int ownerUserId)
        {
            return SetLockState(id, false, ownerUserId);
        }

        private async Task<bool> SetLockState(int id, bool isLocked, int? ownerUserId)
        {
            var user = ownerUserId.HasValue
                ? await UserForOwner(id, ownerUserId.Value)
                : await _userRepository.GetByIdAsync(id);
            if (user == null) return false;

            user.IsLocked = isLocked;
            _userRepository.Update(user);
            await _userRepository.SaveChangesAsync();
            return true;
        }

        public Task<bool> ResetPasswordAsync(int id, string newPassword)
        {
            return ResetPasswordAsync(id, newPassword, null);
        }

        public Task<bool> ResetPasswordAsync(int id, string newPassword, int ownerUserId)
        {
            return ResetPasswordAsync(id, newPassword, (int?)ownerUserId);
        }

        private async Task<bool> ResetPasswordAsync(int id, string newPassword, int? ownerUserId)
        {
            var user = ownerUserId.HasValue
                ? await UserForOwner(id, ownerUserId.Value)
                : await _userRepository.GetByIdAsync(id);
            if (user == null) return false;

            user.PasswordHash = BC.HashPassword(newPassword);
            user.MustChangePassword = true;
            _userRepository.Update(user);
            await _userRepository.SaveChangesAsync();
            return true;
        }

        public Task<bool> DeleteAsync(int id)
        {
            return DeleteAsync(id, null);
        }

        public Task<bool> DeleteAsync(int id, int ownerUserId)
        {
            return DeleteAsync(id, (int?)ownerUserId);
        }

        private async Task<bool> DeleteAsync(int id, int? ownerUserId)
        {
            var user = ownerUserId.HasValue
                ? await UserForOwner(id, ownerUserId.Value)
                : await _userRepository.GetByIdAsync(id);
            if (user == null) return false;

            var hasAuditLogs = await _context.AuditLogs.AnyAsync(log => log.UserId == id);
            if (hasAuditLogs)
            {
                throw new InvalidOperationException("Không thể xóa tài khoản đã có lịch sử thao tác. Hãy khóa tài khoản để bảo toàn nhật ký kiểm toán.");
            }

            _userRepository.Remove(user);
            await _userRepository.SaveChangesAsync();
            return true;
        }

        private IQueryable<User> UsersForOwner(int ownerUserId)
        {
            return _context.Users
                .Include(u => u.Resident)
                .Where(u =>
                    u.Id == ownerUserId ||
                    u.OwnerUserId == ownerUserId ||
                    (u.Resident != null && (
                        u.Resident.OwnerUserId == ownerUserId ||
                        u.Resident.ChiTietOs.Any(ct =>
                            ct.HopDong.Room.Floor.Building.OwnerUserId == ownerUserId))))
                .OrderBy(u => u.Role == "Admin" ? 0 : u.Role == "QuanLy" ? 1 : 2)
                .ThenBy(u => u.Id);
        }

        private Task<User?> UserForOwner(int userId, int ownerUserId)
        {
            return UsersForOwner(ownerUserId)
                .FirstOrDefaultAsync(u => u.Id == userId);
        }

        private Task<bool> ResidentBelongsToOwner(int residentId, int ownerUserId)
        {
            return _context.Residents.AnyAsync(r =>
                r.Id == residentId &&
                (r.OwnerUserId == ownerUserId ||
                 r.ChiTietOs.Any(ct => ct.HopDong.Room.Floor.Building.OwnerUserId == ownerUserId)));
        }

        private static bool IsSystemAccount(string role)
        {
            return role is "Admin" or "QuanLy" or "KeToan" or "NhanVien";
        }

        private UserDto MapToDto(User user)
        {
            return new UserDto
            {
                Id = user.Id,
                PhoneNumber = user.PhoneNumber,
                Role = user.Role,
                ResidentId = user.ResidentId,
                OwnerUserId = user.OwnerUserId,
                FullName = user.DisplayName ?? user.Resident?.FullName,
                DisplayName = user.DisplayName,
                ResidentName = user.Resident?.FullName,
                IsLocked = user.IsLocked,
                MustChangePassword = user.MustChangePassword,
                LastLoginAt = user.LastLoginAt,
                Email = user.Email,
                Address = user.Address,
                AvatarUrl = user.AvatarUrl
            };
        }
    }
}
