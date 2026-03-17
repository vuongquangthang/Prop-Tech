using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Security.Claims;
using backend.Services;

namespace backend.Filters;

/// <summary>
/// Global action filter: tự động ghi nhật ký hoạt động cho mọi thao tác POST/PUT/PATCH/DELETE thành công
/// </summary>
public class AuditLogActionFilter : IAsyncActionFilter
{
    private readonly IAuditLogService _auditLogService;

    public AuditLogActionFilter(IAuditLogService auditLogService)
    {
        _auditLogService = auditLogService;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var executed = await next();

        var httpMethod = context.HttpContext.Request.Method;
        if (httpMethod is not ("POST" or "PUT" or "PATCH" or "DELETE"))
            return;

        // Only log successful responses (2xx)
        var statusCode = (executed.Result as IStatusCodeActionResult)?.StatusCode;
        if (statusCode is not null && (statusCode < 200 || statusCode >= 300))
            return;

        // Don't log if there was an unhandled exception
        if (executed.Exception != null && !executed.ExceptionHandled)
            return;

        context.ActionDescriptor.RouteValues.TryGetValue("controller", out var controllerName);
        context.ActionDescriptor.RouteValues.TryGetValue("action", out var actionName);
        controllerName ??= "Unknown";
        actionName ??= "";

        // Skip the audit log controller itself and Auth controller (handled manually)
        if (controllerName.Equals("AuditLogs", StringComparison.OrdinalIgnoreCase) ||
            controllerName.Equals("Auth", StringComparison.OrdinalIgnoreCase))
            return;

        // Map HTTP method to audit action
        string auditAction = httpMethod switch
        {
            "POST" => "CREATE",
            "PUT" or "PATCH" => "UPDATE",
            "DELETE" => "DELETE",
            _ => "OTHER"
        };

        // Extract entity ID from route if available
        int? entityId = null;
        if (context.RouteData.Values.TryGetValue("id", out var idVal) &&
            int.TryParse(idVal?.ToString(), out int parsedId))
            entityId = parsedId;

        // Extract userId from JWT claims
        int? userId = null;
        var userIdClaim = context.HttpContext.User.FindFirst("id")?.Value
            ?? context.HttpContext.User.FindFirst("UserId")?.Value
            ?? context.HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out int parsedUserId))
            userId = parsedUserId;

        var ipAddress = context.HttpContext.Connection.RemoteIpAddress?.ToString();
        var userAgent = context.HttpContext.Request.Headers["User-Agent"].FirstOrDefault();
        var details = $"{auditAction} {controllerName}{(entityId.HasValue ? $" #{entityId}" : "")}";

        await _auditLogService.LogAsync(userId, auditAction, controllerName, entityId, details, ipAddress, userAgent);
    }
}
