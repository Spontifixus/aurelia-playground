using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;

namespace AureliaPlayground.SignalR
{
    public class ChatHub : Hub
    {
        public Task SendMessage(Message message)
        {
            return this.Clients.All.InvokeAsync("IncomingMessageEvent", message);
        }
    }
}