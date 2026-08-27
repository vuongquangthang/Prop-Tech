using System.Security.Claims;

namespace backend.Controllers;

internal static class ControllerClaimsExtensions
{
    /// <summary>
    /// Khoa cach ly tenant. CHI doc claim OwnerUserId - khong duoc suy ra tu id
    /// cua chinh nguoi dung.
    ///
    /// Truoc day ham nay fallback sang NameIdentifier / UserId / id. Vi USER_ID
    /// va OWNER_USER_ID dung chung mot dai so, mot tai khoan chua gan chu ma
    /// tinh co co USER_ID trung OWNER_USER_ID cua nguoi khac se doc va ghi
    /// vao dung kho tri thuc cua nguoi do. Thieu claim thi phai bao loi.
    /// </summary>
    public static int GetOwnerUserId(this ClaimsPrincipal user)
    {
        var claim = user.FindFirstValue("OwnerUserId")
            ?? user.FindFirstValue("ownerUserId");

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
