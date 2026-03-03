using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;

        public UsersController(IUserService userService)
        {
            _userService = userService;
        }

        /// <summary>
        /// Lấy danh sách tất cả người dùng (Admin only)
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetAll()
        {
            var users = await _userService.GetAllAsync();
            return Ok(users);
        }

        /// <summary>
        /// Lấy chi tiết người dùng theo ID (Admin only)
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<UserDto>> GetById(int id)
        {
            var user = await _userService.GetByIdAsync(id);
            if (user == null)
            {
                return NotFound(new { message = "Người dùng không tồn tại" });
            }
            return Ok(user);
        }

        /// <summary>
        /// Lấy danh sách người dùng theo vai trò (Admin only)
        /// </summary>
        [HttpGet("role/{role}")]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetByRole(string role)
        {
            var users = await _userService.GetByRoleAsync(role);
            return Ok(users);
        }

        /// <summary>
        /// Tạo người dùng mới (Admin only)
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<UserDto>> Create([FromBody] CreateUserDto dto)
        {
            try
            {
                var user = await _userService.CreateAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = user.Id }, user);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Cập nhật thông tin người dùng (Admin only)
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<UserDto>> Update(int id, [FromBody] UpdateUserDto dto)
        {
            try
            {
                var user = await _userService.UpdateAsync(id, dto);
                return Ok(user);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Khóa tài khoản người dùng (Admin only)
        /// </summary>
        [HttpPost("{id}/lock")]
        public async Task<ActionResult> Lock(int id)
        {
            var success = await _userService.LockUserAsync(id);
            if (!success)
            {
                return NotFound(new { message = "Người dùng không tồn tại" });
            }
            return Ok(new { message = "Đã khóa tài khoản" });
        }

        /// <summary>
        /// Mở khóa tài khoản người dùng (Admin only)
        /// </summary>
        [HttpPost("{id}/unlock")]
        public async Task<ActionResult> Unlock(int id)
        {
            var success = await _userService.UnlockUserAsync(id);
            if (!success)
            {
                return NotFound(new { message = "Người dùng không tồn tại" });
            }
            return Ok(new { message = "Đã mở khóa tài khoản" });
        }

        /// <summary>
        /// Reset mật khẩu người dùng (Admin only)
        /// </summary>
        [HttpPost("{id}/reset-password")]
        public async Task<ActionResult> ResetPassword(int id, [FromBody] ChangePasswordDto dto)
        {
            var success = await _userService.ResetPasswordAsync(id, dto.NewPassword);
            if (!success)
            {
                return NotFound(new { message = "Người dùng không tồn tại" });
            }
            return Ok(new { message = "Đã reset mật khẩu thành công" });
        }

        /// <summary>
        /// Xóa người dùng (Admin only)
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(int id)
        {
            var success = await _userService.DeleteAsync(id);
            if (!success)
            {
                return NotFound(new { message = "Người dùng không tồn tại" });
            }
            return NoContent();
        }
    }
}
