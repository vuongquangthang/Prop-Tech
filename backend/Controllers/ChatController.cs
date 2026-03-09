using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChatController : ControllerBase
{
    private readonly IChatService _chatService;

    public ChatController(IChatService chatService)
    {
        _chatService = chatService;
    }

    /// <summary>
    /// Lấy lịch sử chat của người dùng hiện tại
    /// </summary>
    [HttpGet("history")]
    public async Task<ActionResult<List<ChatMessageDto>>> GetHistory([FromQuery] int limit = 100)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Không xác định được người dùng" });
            }

            var history = await _chatService.GetChatHistoryAsync(userId, limit);
            return Ok(history);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy toàn bộ cuộc hội thoại của người dùng
    /// </summary>
    [HttpGet("conversation")]
    public async Task<ActionResult<ChatConversationDto>> GetConversation()
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Không xác định được người dùng" });
            }

            var conversation = await _chatService.GetConversationAsync(userId);
            return Ok(conversation);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// [Admin/QuanLy] Lấy toàn bộ lịch sử chat của tất cả cư dân
    /// </summary>
    [HttpGet("admin/all")]
    [Authorize(Roles = "Admin,QuanLy")]
    public async Task<ActionResult<List<ChatMessageDto>>> GetAllUsersHistory([FromQuery] int limit = 1000)
    {
        try
        {
            var history = await _chatService.GetAllUsersHistoryAsync(limit);
            return Ok(history);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Gửi tin nhắn đến chatbot
    /// </summary>
    [HttpPost("send")]
    public async Task<ActionResult<ChatMessageDto>> SendMessage([FromBody] SendChatMessageDto dto)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Không xác định được người dùng" });
            }

            if (string.IsNullOrWhiteSpace(dto.MessageText))
            {
                return BadRequest(new { message = "Nội dung tin nhắn không được để trống" });
            }

            var response = await _chatService.SendMessageAsync(userId, dto);
            return Ok(response);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }
}
