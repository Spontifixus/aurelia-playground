import { SignalRHub } from 'rxjs-signalr';

class Message {
    public senderName: string;
    public text: string;
}

export class Chat {

    public senderName: string;
    public message: string;
    public incomingMessages: Message[] = [];
    private hub: SignalRHub;

    constructor() {
        this.hub = new SignalRHub('chat');
        this.hub.on('broadcastMessage').subscribe(data => {
            this.handleIncomingMessage(data);
        });
        this.hub.start();
    }

    private handleIncomingMessage(data: any) {
        var message = new Message();
        message.senderName = data.senderName;
        message.text = data.text;
        this.incomingMessages.push(message);
    }

    public sendMessage() {
        var message = new Message();
        message.senderName = this.senderName;
        message.text = this.message;
        this.hub.send('sendMessage', message);
        this.message = '';
    }
}
