using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace backend.Hubs;

[Authorize]
public class NotificationHub : Hub
{
    private readonly ILogger<NotificationHub> _logger;

    public NotificationHub(ILogger<NotificationHub> logger)
    {
        _logger = logger;
    }

    public static string UserGroup(int userId) => $"user_{userId}";
    public static string OwnerGroup(int ownerUserId) => $"owner_{ownerUserId}";

    public override async Task OnConnectedAsync()
    {
        var userId = GetCurrentUserId();
        var ownerUserId = GetCurrentOwnerUserId();

        if (userId.HasValue)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, UserGroup(userId.Value));
            _logger.LogInformation($"User {userId} connected to NotificationHub. ConnectionId: {Context.ConnectionId}");
        }

        if (ownerUserId.HasValue)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, OwnerGroup(ownerUserId.Value));
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = GetCurrentUserId();
        var ownerUserId = GetCurrentOwnerUserId();

        if (userId.HasValue)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, UserGroup(userId.Value));
            _logger.LogInformation($"User {userId} disconnected from NotificationHub. ConnectionId: {Context.ConnectionId}");
        }

        if (ownerUserId.HasValue)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, OwnerGroup(ownerUserId.Value));
        }

        await base.OnDisconnectedAsync(exception);
    }

    private int? GetCurrentUserId()
    {
        var claim = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? Context.User?.FindFirstValue("UserId")
            ?? Context.User?.FindFirstValue("id")
            ?? Context.User?.FindFirstValue("sub")
            ?? Context.User?.Identity?.Name;

        return int.TryParse(claim, out var userId) ? userId : null;
    }

    private int? GetCurrentOwnerUserId()
    {
        var claim = Context.User?.FindFirstValue("OwnerUserId")
            ?? Context.User?.FindFirstValue("ownerUserId");

        return int.TryParse(claim, out var ownerUserId)
            ? ownerUserId
            : GetCurrentUserId();
    }

    // Client can send test message
    public async Task SendTestMessage(string message)
    {
        await Clients.Caller.SendAsync("ReceiveTestMessage", $"Echo: {message}");
    }

    // Server methods to broadcast updates (called from controllers/services)
    public static class Notifications
    {
        public static async Task SendNotificationToUser(
            IHubContext<NotificationHub> hubContext,
            string userId,
            object notification)
        {
            await hubContext.Clients.Group($"user_{userId}")
                .SendAsync("ReceiveNotification", notification);
        }

        public static async Task SendMaintenanceUpdate(
            IHubContext<NotificationHub> hubContext,
            int ownerUserId,
            object maintenance)
        {
            await hubContext.Clients.Group(OwnerGroup(ownerUserId))
                .SendAsync("MaintenanceUpdated", maintenance);
        }

        public static async Task SendInvoiceUpdate(
            IHubContext<NotificationHub> hubContext,
            string userId,
            object invoice)
        {
            await hubContext.Clients.Group($"user_{userId}")
                .SendAsync("InvoiceUpdated", invoice);
        }

        public static async Task SendBroadcast(
            IHubContext<NotificationHub> hubContext,
            int ownerUserId,
            string eventName,
            object data)
        {
            await hubContext.Clients.Group(OwnerGroup(ownerUserId))
                .SendAsync(eventName, data);
        }
    }
}
