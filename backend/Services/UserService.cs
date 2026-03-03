using backend.DTOs;
using backend.Repositories;
using backend.Models;
using BC = BCrypt.Net.BCrypt;

namespace backend.Services
{
    public interface IUserService
    {
        Task<IEnumerable<UserDto>> GetAllAsync();
        Task<UserDto?> GetByIdAsync(int id);
        Task<IEnumerable<UserDto>> GetByRoleAsync(string role);
        Task<UserDto> CreateAsync(CreateUserDto dto);
        Task<UserDto> UpdateAsync(int id, UpdateUserDto dto);
        Task<bool> LockUserAsync(int id);
        Task<bool> UnlockUserAsync(int id);
        Task<bool> ResetPasswordAsync(int id, string newPassword);
        Task<bool> DeleteAsync(int id);
    }

    public class UserService : IUserService
    {
        private readonly IUserRepository _userRepository;
        private readonly IResidentRepository _residentRepository;

        public UserService(
            IUserRepository userRepository,
            IResidentRepository residentRepository)
        {
            _userRepository = userRepository;
            _residentRepository = residentRepository;
        }

        public async Task<IEnumerable<UserDto>> GetAllAsync()
        {
            var users = await _userRepository.GetAllAsync();
            return users.Select(MapToDto);
        }

        public async Task<UserDto?> GetByIdAsync(int id)
        {
            var user = await _userRepository.GetWithResidentAsync(id);
            return user == null ? null : MapToDto(user);
        }

        public async Task<IEnumerable<UserDto>> GetByRoleAsync(string role)
        {
            var users = await _userRepository.GetByRoleAsync(role);
            return users.Select(MapToDto);
        }

        public async Task<UserDto> CreateAsync(CreateUserDto dto)
        {
            // Check if phone number already exists
            if (await _userRepository.ExistsByPhoneAsync(dto.PhoneNumber))
            {
                throw new Exception($"Số điện thoại '{dto.PhoneNumber}' đã được sử dụng");
            }

            // Validate resident if provided
            if (dto.ResidentId.HasValue)
            {
                var resident = await _residentRepository.GetByIdAsync(dto.ResidentId.Value);
                if (resident == null)
                {
                    throw new Exception("Cư dân không tồn tại");
                }
            }

            // Hash password
            var passwordHash = BC.HashPassword(dto.Password);

            var user = new User
            {
                PhoneNumber = dto.PhoneNumber,
                PasswordHash = passwordHash,
                Role = dto.Role,
                ResidentId = dto.ResidentId,
                IsLocked = false
            };

            await _userRepository.AddAsync(user);
            await _userRepository.SaveChangesAsync();

            // Reload to get resident info
            var created = await _userRepository.GetWithResidentAsync(user.Id);
            return MapToDto(created!);
        }

        public async Task<UserDto> UpdateAsync(int id, UpdateUserDto dto)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null)
            {
                throw new Exception("Người dùng không tồn tại");
            }

            // Update fields
            if (!string.IsNullOrEmpty(dto.Role))
            {
                user.Role = dto.Role;
            }

            if (dto.ResidentId.HasValue)
            {
                // Validate resident
                var resident = await _residentRepository.GetByIdAsync(dto.ResidentId.Value);
                if (resident == null)
                {
                    throw new Exception("Cư dân không tồn tại");
                }
                user.ResidentId = dto.ResidentId;
            }

            if (dto.IsLocked.HasValue)
            {
                user.IsLocked = dto.IsLocked.Value;
            }

            _userRepository.Update(user);
            await _userRepository.SaveChangesAsync();

            // Reload to get resident info
            var updated = await _userRepository.GetWithResidentAsync(user.Id);
            return MapToDto(updated!);
        }

        public async Task<bool> LockUserAsync(int id)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null) return false;

            user.IsLocked = true;
            _userRepository.Update(user);
            await _userRepository.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UnlockUserAsync(int id)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null) return false;

            user.IsLocked = false;
            _userRepository.Update(user);
            await _userRepository.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ResetPasswordAsync(int id, string newPassword)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null) return false;

            user.PasswordHash = BC.HashPassword(newPassword);
            _userRepository.Update(user);
            await _userRepository.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null) return false;

            _userRepository.Remove(user);
            await _userRepository.SaveChangesAsync();
            return true;
        }

        private UserDto MapToDto(User user)
        {
            return new UserDto
            {
                Id = user.Id,
                PhoneNumber = user.PhoneNumber,
                Role = user.Role,
                ResidentId = user.ResidentId,
                ResidentName = user.Resident?.FullName,
                IsLocked = user.IsLocked,
                LastLoginAt = user.LastLoginAt
            };
        }
    }
}
