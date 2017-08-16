import { SignalRClient } from "../../services/signalr-client";
import { autoinject } from "aurelia-framework";

class Message {
    public senderName: string;
    public text: string;
}

@autoinject
export class Chat {

    public senderName: string;
    public message: string;
    public incomingMessages: Message[] = [];

    constructor(private signalr: SignalRClient) {
    }

    public activate() {
        this.signalr.setCallback('chat', 'broadcastMessage', data => this.handleIncomingMessage(data), 'cb');
        this.signalr.start();
    }

    private handleIncomingMessage(data: any) {
        var message = new Message();
        message.senderName = data.senderName;
        message.text = data.message;
        this.incomingMessages.push(message);
    }

    public deactivate() {
        this.signalr.stop('chat', 'broadcastMessage', this.handleIncomingMessage, 'cb');
    }

    public async sendMessage(): Promise<any> {
        await this.signalr.invoke('chat', 'sendMessage', this.senderName, this.message);
        this.message = '';
    }
}
