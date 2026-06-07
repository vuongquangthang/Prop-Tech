using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/post-messages")]
[Authorize]
public class PostMessagesController : ControllerBase
{
    private readonly IPostMessageService _postMessageService;

    public PostMessagesController(IPostMessageService postMessageService)
    {
        _postMessageService = postMessageService;
    }

    [HttpGet("conversations")]
    [Authorize(Roles = "Admin,QuanLy,CuDan")]
    public async Task<ActionResult<List<PostConversationDto>>> GetConversations()
    {
        try
        {
            return Ok(await _postMessageService.GetConversationsAsync(User.GetAuthenticatedUserId(), User.GetOwnerUserId()));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    [HttpGet("conversations/{conversationId}")]
    [Authorize(Roles = "Admin,QuanLy,CuDan")]
    public async Task<ActionResult<PostConversationDetailDto>> GetConversationDetail(string conversationId)
    {
        try
        {
            return Ok(await _postMessageService.GetConversationDetailAsync(conversationId, User.GetAuthenticatedUserId(), User.GetOwnerUserId()));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin,QuanLy,CuDan")]
    public async Task<ActionResult<PostMessageDto>> Send([FromBody] SendPostMessageDto dto)
    {
        try
        {
            return Ok(await _postMessageService.SendAsync(User.GetAuthenticatedUserId(), User.GetOwnerUserId(), dto));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    [HttpPost("conversations/{conversationId}/read")]
    [Authorize(Roles = "Admin,QuanLy,CuDan")]
    public async Task<ActionResult<object>> MarkRead(string conversationId)
    {
        try
        {
            await _postMessageService.MarkConversationReadAsync(conversationId, User.GetAuthenticatedUserId(), User.GetOwnerUserId());
            return Ok(new { success = true });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }
}
