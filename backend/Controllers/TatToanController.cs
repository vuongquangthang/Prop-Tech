using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TatToanController : ControllerBase
    {
        private readonly ITatToanService _tatToanService;

        public TatToanController(ITatToanService tatToanService)
        {
            _tatToanService = tatToanService;
        }

        [HttpGet]
        [Authorize(Roles = "Admin,QuanLy,KeToan")]
        public async Task<ActionResult<IEnumerable<TatToanDto>>> GetAll()
        {
            var tatToans = await _tatToanService.GetAllAsync(User.GetOwnerUserId());
            return Ok(tatToans);
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,QuanLy,KeToan")]
        public async Task<ActionResult<TatToanDto>> GetById(int id)
        {
            var tatToan = await _tatToanService.GetByIdAsync(id, User.GetOwnerUserId());
            if (tatToan == null)
            {
                return NotFound(new { message = "Phiếu tất toán không tồn tại" });
            }
            return Ok(tatToan);
        }

        [HttpGet("residency/{residencyId}")]
        [Authorize(Roles = "Admin,QuanLy,KeToan")]
        public async Task<ActionResult<IEnumerable<TatToanDto>>> GetByResidency(int residencyId)
        {
            var tatToans = await _tatToanService.GetByResidencyIdAsync(residencyId, User.GetOwnerUserId());
            return Ok(tatToans);
        }

        [HttpGet("status/{status}")]
        [Authorize(Roles = "Admin,QuanLy,KeToan")]
        public async Task<ActionResult<IEnumerable<TatToanDto>>> GetByStatus(string status)
        {
            var tatToans = await _tatToanService.GetByStatusAsync(status, User.GetOwnerUserId());
            return Ok(tatToans);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,QuanLy,KeToan")]
        public async Task<ActionResult<TatToanDto>> Create([FromBody] CreateTatToanDto dto)
        {
            try
            {
                var tatToan = await _tatToanService.CreateAsync(dto, User.GetOwnerUserId());
                return CreatedAtAction(nameof(GetById), new { id = tatToan.Id }, tatToan);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,QuanLy,KeToan")]
        public async Task<ActionResult<TatToanDto>> Update(int id, [FromBody] UpdateTatToanDto dto)
        {
            try
            {
                var tatToan = await _tatToanService.UpdateAsync(id, dto, User.GetOwnerUserId());
                return Ok(tatToan);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> Delete(int id)
        {
            var success = await _tatToanService.DeleteAsync(id, User.GetOwnerUserId());
            if (!success)
            {
                return NotFound(new { message = "Phiếu tất toán không tồn tại" });
            }
            return NoContent();
        }
    }
}
