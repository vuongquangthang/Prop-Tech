using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

/// <summary>
/// Endpoint health nhe (khong query DB) - dung cho UptimeRobot ping giu Render khong ngu.
/// Tra JSON tinh nen thuc day nhanh, khong bi timeout nhu endpoint co query DB.
/// </summary>
[ApiController]
public class HealthController : ControllerBase
{
    [HttpGet("/api/health")]
    [AllowAnonymous]
    public IActionResult Health()
    {
        return Ok(new
        {
            status = "ok",
            service = "prop-tech-api",
            timestamp = DateTime.UtcNow.ToString("o")
        });
    }
}
