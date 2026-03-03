using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ChiTietTaiSanPhongController : ControllerBase
    {
        private readonly IChiTietTaiSanPhongService _detailService;

        public ChiTietTaiSanPhongController(IChiTietTaiSanPhongService detailService)
        {
            _detailService = detailService;
        }

        [HttpGet]
        [Authorize(Roles = "Admin,QuanLy")]
        public async Task<ActionResult<IEnumerable<ChiTietTaiSanPhongDto>>> GetAll()
        {
            var details = await _detailService.GetAllAsync();
            return Ok(details);
        }

        [HttpGet("room/{roomId}")]
        [Authorize(Roles = "Admin,QuanLy")]
        public async Task<ActionResult<IEnumerable<ChiTietTaiSanPhongDto>>> GetByRoom(int roomId)
        {
            var details = await _detailService.GetByRoomIdAsync(roomId);
            return Ok(details);
        }

        [HttpGet("asset/{assetId}")]
        [Authorize(Roles = "Admin,QuanLy")]
        public async Task<ActionResult<IEnumerable<ChiTietTaiSanPhongDto>>> GetByAsset(int assetId)
        {
            var details = await _detailService.GetByAssetIdAsync(assetId);
            return Ok(details);
        }

        [HttpGet("room/{roomId}/asset/{assetId}")]
        [Authorize(Roles = "Admin,QuanLy")]
        public async Task<ActionResult<ChiTietTaiSanPhongDto>> GetByRoomAndAsset(int roomId, int assetId)
        {
            var detail = await _detailService.GetByRoomAndAssetAsync(roomId, assetId);
            if (detail == null)
            {
                return NotFound(new { message = "Tài sản phòng không tồn tại" });
            }
            return Ok(detail);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,QuanLy")]
        public async Task<ActionResult<ChiTietTaiSanPhongDto>> Create([FromBody] CreateChiTietTaiSanPhongDto dto)
        {
            try
            {
                var detail = await _detailService.CreateAsync(dto);
                return CreatedAtAction(
                    nameof(GetByRoomAndAsset),
                    new { roomId = detail.RoomId, assetId = detail.AssetId },
                    detail);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("room/{roomId}/asset/{assetId}")]
        [Authorize(Roles = "Admin,QuanLy")]
        public async Task<ActionResult<ChiTietTaiSanPhongDto>> Update(
            int roomId,
            int assetId,
            [FromBody] UpdateChiTietTaiSanPhongDto dto)
        {
            try
            {
                var detail = await _detailService.UpdateAsync(roomId, assetId, dto);
                return Ok(detail);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("room/{roomId}/asset/{assetId}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> Delete(int roomId, int assetId)
        {
            var success = await _detailService.DeleteAsync(roomId, assetId);
            if (!success)
            {
                return NotFound(new { message = "Tài sản phòng không tồn tại" });
            }
            return NoContent();
        }
    }
}
