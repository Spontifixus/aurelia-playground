# SignalR for ASP.NET Core 2.0 with Aurelia and Webpack 

Just today (September 15, 2017) Microsoft announced the [first alpha version of **SignalR for ASP.NET Core 2.0**][1]. Now these are great news! So I immediately had to try this out with my favorite way of building web apps: The [Aurelia framework][2]. And I can already say: It works like a charm. But lets start from the beginning.

## Setting up a simple application

I used a skeleton I once created to have an easy starting point with Aurelia. Initially the skeleton was created using the Aurelia template coming with the the [ASP.NET Core SPA templates][4]. I upgraded Bootstrap to the shiny new version 4 but that's basically all I changed. Feel free to use this template as a starting point for your projects!

For this tutorial I am going to use this skeleton as a baseline. So go ahead and clone [https://github.com/Spontifixus/aurelia-playground.git][3] to get started!

## SignalR on the server

This section covers the server-side components needed to power out chat application.

### Installing the nuget package

To install the new SignalR everything you need to to is to open a console and run

````bash
dotnet add package Microsoft.AspNetCore.SignalR --version 1.0.0-alpha1-final
```` 

That installs the required packages and dependencies to enable your web service to facilitate the powers of SignalR.

### Creating a ChatHub

The center of all SignalR activities are so called Hubs. Hubs handle connections, provide methods the clients can invoke and have the ability to send events to the clients. So we need to create a `ChatHub` that provides the functionality for our application: Providing a method to send a chat message and distribute that message as an event to connected clients.

Let's create a folder named "SignalR" and add a file named "ChatHub.cs" to it:

````csharp
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
````
As you can see, the method `SendMessage` takes a message and distributes it to all clients. Of course the definition of the `Message`-class is still missing, so let's add that quickly. Add a file named "Message.cs" to the SignalR-folder:

````csharp
namespace AureliaPlayground.SignalR
{
    public class Message
    {
        public string SenderName { get; set; }
        public string Text { get; set; }
    }
}
````

Obviously this is a very simple implementation and should be expanded to for example have a proper error handling, but for now this will do.

### Configuring our Application

Now that our chat hub class was implemented we need to make the hub known to the system. We do this by registering the SignalR components to the dependency injection container and configuring a route to the chat hub. Adding SignalR to the container can be achieve by adding the following line to the `ConfigureServices`-method of the `Startup`-class of your application:

````csharp
services.AddSignalR();
````

And don't forget to add the using directive (`using Microsoft.AspNetCore.SignalR;`)!

With the new SignalR for ASP.NET Core 2.0 configuring the routes is as easy as we know it from ASP.NET Core MVC and it works very much the same way. Just add the following snippet to the `Configure`-method of the `Startup`-class:

````csharp
app.UseSignalR(routes =>
{
    routes.MapHub<ChatHub>("chat");
});
````

Again, don't forget to add the using directive for the `ChatHub` class. This code configures SignalR to publish the chat hub under the `/chat` URL.

This is all you need to do to get things running on the server side!

## SignalR on the client

This sections explains how to setup the client-side components of our application.

### Installing the client

Microsoft built an entirely new SignalR client for JavaScript or TypeScript. The new client has a much simpler interface than those of the older versions and thus can be configured and used much more intuitively.

First things first: To be able to use SignalR on the client side install the npm package by opening a command line and running

````csharp
npm install @aspnet/signalr-client --save
````

Our little application uses webpack as a bundler, and to bundle the client into our vendor bundle we need to modify the relevant config file. So add `@aspnet/signalr-client` to the list of packages in the webpack.config.vendor.js file:

````javascript
vendor: [
    'aurelia-event-aggregator',
    'aurelia-fetch-client',
    'aurelia-framework',
    'aurelia-history-browser',
    'aurelia-logging-console',
    'aurelia-pal-browser',
    'aurelia-polyfills',
    'aurelia-route-recognizer',
    'aurelia-router',
    'aurelia-templating-binding',
    'aurelia-templating-resources',
    'aurelia-templating-router',
    'bootstrap',
    'bootstrap/dist/css/bootstrap.css',
    'jquery',
    'popper.js',
    '@aspnet/signalr-client'
]
````

Then open a console and run webpack to rebundle the vendor.js file:

````bash
webpack --config webpack.config.vendor.js
````

Note that although jQuery is still included in our build it is only used by bootstrap, but no longer by SignalR!

### Create an Aurelia component

All we need now is a page in our application that we can use to chat. For this create a new folder named "chat" in the "ClientApp/components"-folder of our application. Then add a component named "chat.ts" to this folder:

````typescript
export class Chat {
}
````

To establish a connection to the chat hub we need to set up a hub connection. The SignalR client provides a class taking care of this. Let's create a private field and a constructor to create and instance of the `HubConnection`:

````typescript
private chatHubConnection: HubConnection;

constructor() {
    this.chatHubConnection = new HubConnection('/chat');
}
````

Note that in a real-life application you usually would encapsulate the connectivity to the chat hub in a chat service that you then can resolve using dependency injection.

Before we listen for incoming messages we need to add a field to store them so we can access them from the template:

````typescript
chatLog: Message[] = [];
````

Now we can register to the `IncomingMessageEvent` in the constructor:

````typescript
this.chatHubConnection.on('incomingMessageEvent', (incomingMessage: Message) => {
    this.chatLog.push(incomingMessage);
});
````

You might note that we use a class named "Message" here, so add a new class below the `Chat`-class:

````typescript
export class ChatMessage {
    SenderName: string;
    Text: string;
}
````

To actually listen to new events we need to start the hub connection. Starting a hub connection returns a promise that gets resolved once the connection is established. We will store the promise in a private field so we can access it lateron to ensure a working connection. To start the connection when our component gets activated we implement the `activate`-method:

````typescript
private connectionPromise?: Promise<void>;

activate() {
    this.connectionPromise = this.chatHubConnection.start();
}
````

Also we implement the `deactivate`-method to stop the connection once we navigate away from the chat:

````typescript
deactivate() {
    this.connectionPromise = undefined;
    this.chatHubConnection.stop();        
}
````

Now we need a method to send a new message to the chat. For this we add a field containing an empty message that we can bind to from the template and a method actually sending the message. We use the connection promise to ensure that the hub is connected before sending the message:

````typescript
async sendMessage(): Promise<void> {
    if (!connectionPromise) {
        console.warning('Chat: No connection to the server.')
    }
    await connectionPromise;
    this.chatHubConnection.invoke('sendMessage', this.currentMessage);
    this.currentMessage.Text = '';
}
````

Finally we need a template for our component. So add a file named "chat.html" to the chat folder:

````html
<template>
    <h1>Chat</h1>
    <p>This is a simple example of a SignalR Chat application. Every message you type here will be displayed at all other clients.</p>
    <form>
        <div class="form-row">
            <div class="col">
                <input type="text" class="form-control" placeholder="Your name..." value.two-way="currentMessage.SenderName">
            </div>
            <div class="col-7">
                <input type="text" class="form-control" placeholder="Your message..." value.two-way="currentMessage.Text">
            </div>
            <div class="col">
                <button type="submit" class="btn btn-primary" click.delegate="sendMessage()">Send</button>
            </div>
        </div>
    </form>
    <p>
        <ul>
            <li repeat.for = "message of chatLog"><strong>${message.SenderName}:</strong> ${message.Text}</li>
        </ul>
    </p>
</template>
````

This template provides a simple form where we can enter a name and the message and click a button to send it. Incoming messages are just listed below the form.

### Add the navigation item

Open the file "ClientApp/components/app/app.ts" and add our component to the navigation menu:

````typescript
{
    route: 'chat',
    name: 'chat',
    settings: { icon: 'th-list' },
    moduleId: PLATFORM.moduleName('../chat/chat'),
    nav: true,
    title: 'Chat'
}
````

## Build and run the application

To run the application open a console and run

````bash
webpack --config webpack.config.vendor.js
webpack
dotnet restore
dotnet build
dotnet run
````

## Summary

The first impression is that the first alpha of SignalR for ASP.NET Core 2.0 already works really well and is fun to use. I literally put this together in about half an hour (writing this up took a bit longer of course...).

I am really pleased where this is going and how well this works together with Aurelia and Webpack. What are your experiences with this?











  [1]: https://blogs.msdn.microsoft.com/webdev/2017/09/14/announcing-signalr-for-asp-net-core-2-0/
  [2]: https://aurelia.io
  [3]: https://github.com/Spontifixus/aurelia-playground.git
  [4]: https://github.com/Spontifixus/aurelia-playground
  [5]: https://blogs.msdn.microsoft.com/webdev/2017/02/14/building-single-page-applications-on-asp-net-core-with-javascriptservices/