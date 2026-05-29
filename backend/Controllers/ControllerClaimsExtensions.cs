using System.Security.Claims;

namespace backend.Controllers;

internal static class ControllerClaimsExtensions
{
    public static int GetOwnerUserId(this ClaimsPrincipal user)
    {
        var claim = user.FindFirstValue("OwnerUserId")
            ?? user.FindFirstValue("ownerUserId")
            ?? user.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? user.FindFirstValue("UserId")
            ?? user.FindFirstValue("id");

        if (!int.TryParse(claim, out var ownerUserId) || ownerUserId <= 0)
        {
            throw new InvalidOperationException("Khong the xac thuc chu nha");
        }

        return ownerUserId;
    }

    public static int GetAuthenticatedUserId(this ClaimsPrincipal user)
    {
        var claim = user.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? user.FindFirstValue("UserId")
            ?? user.FindFirstValue("id");

        if (!int.TryParse(claim, out var userId) || userId <= 0)
        {
            throw new InvalidOperationException("Khong the xac thuc nguoi dung");
        }

        return userId;
    }
}
