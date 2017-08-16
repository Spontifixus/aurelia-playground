using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Hubs;

namespace AureliaPlayground.Hubs
{
    [HubName("chat")]
    public class ChatHub : Hub
    {
        public void SendMessage(string senderName, string message)
        {
            this.Clients.All.broadcastMessage(new { senderName, message });
        }
    }
}
