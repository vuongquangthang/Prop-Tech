using System.Security.Claims;
using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/posts")]
[Authorize]
public class PostsController : ControllerBase
{
    private readonly IPostService _postService;

    public PostsController(IPostService postService)
    {
        _postService = postService;
    }

    private int GetUserId()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdClaim, out var userId) || userId <= 0)
        {
            throw new InvalidOperationException("Không thể xác thực người dùng");
        }
        return userId;
    }

    private int GetOwnerUserId()
    {
        return User.GetOwnerUserId();
    }

    [HttpGet]
    [Authorize(Roles = "Admin,QuanLy")]
    public async Task<ActionResult<List<PostDto>>> GetAll()
    {
        try
        {
            var posts = await _postService.GetAllAsync(GetOwnerUserId());
            return Ok(posts);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Admin,QuanLy")]
    public async Task<ActionResult<PostDto>> GetById(int id)
    {
        try
        {
            var post = await _postService.GetByIdAsync(id, GetOwnerUserId());
            if (post == null)
            {
                return NotFound(new { message = "Bài đăng không tồn tại" });
            }

            return Ok(post);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    [HttpGet("my")]
    [Authorize(Roles = "CuDan")]
    public async Task<ActionResult<PostDto>> GetMy()
    {
        try
        {
            var userId = GetUserId();
            var post = await _postService.GetByUserIdAsync(userId);
            if (post == null)
            {
                return NotFound(new { message = "Bạn chưa có bài đăng nào" });
            }

            return Ok(post);
        }
        catch (InvalidOperationException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin,QuanLy,CuDan")]
    public async Task<ActionResult<PostDto>> Create([FromBody] CreatePostDto dto)
    {
        try
        {
            var createdByUserId = GetUserId();

            var post = await _postService.CreateAsync(dto, createdByUserId, GetOwnerUserId());
            return CreatedAtAction(nameof(GetById), new { id = post.Id }, post);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("xác thực"))
        {
            return Unauthorized(new { message = ex.Message });
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

    [HttpPatch("{id}/lock")]
    [Authorize(Roles = "Admin,QuanLy,CuDan")]
    public async Task<ActionResult<PostDto>> UpdateLock(int id, [FromBody] UpdatePostLockDto dto)
    {
        try
        {
            if (User.IsInRole("CuDan"))
            {
                var userId = GetUserId();
                var existing = await _postService.GetByIdAsync(id);
                if (existing == null)
                {
                    return NotFound(new { message = "Bài đăng không tồn tại" });
                }
                if (existing.CreatedByUserId != userId)
                {
                    return Forbid();
                }
                var residentUpdatedPost = await _postService.UpdateLockAsync(id, dto.IsLocked, userId);
                return Ok(residentUpdatedPost);
            }

            var adminId = GetUserId();
            var adminUpdatedPost = await _postService.UpdateLockAsync(id, dto.IsLocked, adminId, GetOwnerUserId());
            return Ok(adminUpdatedPost);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("xác thực"))
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,QuanLy,CuDan")]
    public async Task<ActionResult<PostDto>> Update(int id, [FromBody] UpdatePostDto dto)
    {
        try
        {
            if (User.IsInRole("CuDan"))
            {
                var userId = GetUserId();
                var existing = await _postService.GetByIdAsync(id);
                if (existing == null)
                {
                    return NotFound(new { message = "Bài đăng không tồn tại" });
                }
                if (existing.CreatedByUserId != userId)
                {
                    return Forbid();
                }
                var residentUpdatedPost = await _postService.UpdateAsync(id, dto, userId);
                return Ok(residentUpdatedPost);
            }

            var adminId = GetUserId();
            var adminUpdatedPost = await _postService.UpdateAsync(id, dto, adminId, GetOwnerUserId());
            return Ok(adminUpdatedPost);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("xác thực"))
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,QuanLy,CuDan")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            if (User.IsInRole("CuDan"))
            {
                var userId = GetUserId();
                var existing = await _postService.GetByIdAsync(id);
                if (existing == null)
                {
                    return NotFound(new { message = "Bài đăng không tồn tại" });
                }

                if (existing.CreatedByUserId != userId)
                {
                    return Forbid();
                }

                await _postService.DeleteAsync(id, userId);
                return NoContent();
            }

            await _postService.DeleteAsync(id, GetOwnerUserId());
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    [HttpGet("{id}/history")]
    [Authorize(Roles = "Admin,QuanLy,CuDan")]
    public async Task<ActionResult<List<PostEditHistoryDto>>> GetHistory(int id, [FromQuery] int limit = 20)
    {
        try
        {
            if (User.IsInRole("CuDan"))
            {
                var userId = GetUserId();
                var existing = await _postService.GetByIdAsync(id);
                if (existing == null)
                {
                    return NotFound(new { message = "Bài đăng không tồn tại" });
                }

                if (existing.CreatedByUserId != userId)
                {
                    return Forbid();
                }
            }

            var ownerUserId = User.IsInRole("CuDan") ? null : (int?)GetOwnerUserId();
            var history = await _postService.GetHistoryAsync(id, limit, ownerUserId);
            return Ok(history);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }
}
