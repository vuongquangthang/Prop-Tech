using System.Security.Claims;
using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/posts")]
[Authorize(Roles = "Admin,QuanLy")]
public class PostsController : ControllerBase
{
    private readonly IPostService _postService;

    public PostsController(IPostService postService)
    {
        _postService = postService;
    }

    [HttpGet]
    public async Task<ActionResult<List<PostDto>>> GetAll()
    {
        try
        {
            var posts = await _postService.GetAllAsync();
            return Ok(posts);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<PostDto>> GetById(int id)
    {
        try
        {
            var post = await _postService.GetByIdAsync(id);
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

    [HttpPost]
    public async Task<ActionResult<PostDto>> Create([FromBody] CreatePostDto dto)
    {
        try
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var createdByUserId = int.TryParse(userIdClaim, out var userId) ? userId : (int?)null;

            var post = await _postService.CreateAsync(dto, createdByUserId);
            return CreatedAtAction(nameof(GetById), new { id = post.Id }, post);
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
    public async Task<ActionResult<PostDto>> UpdateLock(int id, [FromBody] UpdatePostLockDto dto)
    {
        try
        {
            var post = await _postService.UpdateLockAsync(id, dto.IsLocked);
            return Ok(post);
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
    public async Task<ActionResult<PostDto>> Update(int id, [FromBody] UpdatePostDto dto)
    {
        try
        {
            var post = await _postService.UpdateAsync(id, dto);
            return Ok(post);
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
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await _postService.DeleteAsync(id);
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
}