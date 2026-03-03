using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;

namespace backend.Hubs;

[Authorize]
public class NotificationHub : Hub
{
    private readonly ILogger<NotificationHub> _logger;

    public NotificationHub(ILogger<NotificationHub> logger)
    {
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirst("sub")?.Value 
                     ?? Context.User?.FindFirst("id")?.Value
                     ?? Context.User?.Identity?.Name;

        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
            _logger.LogInformation($"User {userId} connected to NotificationHub. ConnectionId: {Context.ConnectionId}");
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User?.FindFirst("sub")?.Value 
                     ?? Context.User?.FindFirst("id")?.Value
                     ?? Context.User?.Identity?.Name;

        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId}");
            _logger.LogInformation($"User {userId} disconnected from NotificationHub. ConnectionId: {Context.ConnectionId}");
        }

        await base.OnDisconnectedAsync(exception);
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
            object maintenance)
        {
            await hubContext.Clients.All
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
            string eventName,
            object data)
        {
            await hubContext.Clients.All
                .SendAsync(eventName, data);
        }
    }
}
