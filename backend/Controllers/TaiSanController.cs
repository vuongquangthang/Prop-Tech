using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TaiSanController : ControllerBase
    {
        private readonly ITaiSanService _taiSanService;

        public TaiSanController(ITaiSanService taiSanService)
        {
            _taiSanService = taiSanService;
        }

        [HttpGet]
        [Authorize(Roles = "Admin,QuanLy")]
        public async Task<ActionResult<IEnumerable<TaiSanDto>>> GetAll()
        {
            var taiSans = await _taiSanService.GetAllAsync();
            return Ok(taiSans);
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,QuanLy")]
        public async Task<ActionResult<TaiSanDto>> GetById(int id)
        {
            var taiSan = await _taiSanService.GetByIdAsync(id);
            if (taiSan == null)
            {
                return NotFound(new { message = "Tài sản không tồn tại" });
            }
            return Ok(taiSan);
        }

        [HttpGet("code/{assetCode}")]
        [Authorize(Roles = "Admin,QuanLy")]
        public async Task<ActionResult<TaiSanDto>> GetByCode(string assetCode)
        {
            var taiSan = await _taiSanService.GetByCodeAsync(assetCode);
            if (taiSan == null)
            {
                return NotFound(new { message = "Tài sản không tồn tại" });
            }
            return Ok(taiSan);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,QuanLy")]
        public async Task<ActionResult<TaiSanDto>> Create([FromBody] CreateTaiSanDto dto)
        {
            try
            {
                var taiSan = await _taiSanService.CreateAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = taiSan.Id }, taiSan);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,QuanLy")]
        public async Task<ActionResult<TaiSanDto>> Update(int id, [FromBody] UpdateTaiSanDto dto)
        {
            try
            {
                var taiSan = await _taiSanService.UpdateAsync(id, dto);
                return Ok(taiSan);
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
            var success = await _taiSanService.DeleteAsync(id);
            if (!success)
            {
                return NotFound(new { message = "Tài sản không tồn tại" });
            }
            return NoContent();
        }
    }
}
