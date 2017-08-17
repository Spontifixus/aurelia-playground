using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Hubs;

namespace AureliaPlayground.Hubs
{
    [HubName("chat")]
    public class ChatHub : Hub
    {
        public void SendMessage(dynamic message)
        {
            this.Clients.All.broadcastMessage(new { message.senderName, message.text });
        }
    }
}
