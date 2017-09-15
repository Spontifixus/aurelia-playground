import { HubConnection } from '@aspnet/signalr-client';

export class Chat {

    private connectionPromise?: Promise<void>;
    private chatHubConnection: HubConnection;

    chatLog: Message[] = [];
    currentMessage: Message = new Message();

    constructor() {
        this.chatHubConnection = new HubConnection('/chat');
        this.chatHubConnection.on('incomingMessageEvent', (incomingMessage: Message) => {
            this.chatLog.push(incomingMessage);
        });
    }

    activate() {
        this.connectionPromise = this.chatHubConnection.start();
    }

    deactivate() {
        this.connectionPromise = undefined;
        this.chatHubConnection.stop();
    }

    async sendMessage(): Promise<void> {
        if (!this.connectionPromise) {
            console.warn('Chat: No connection to the server.')
        }
        await this.connectionPromise;
        this.chatHubConnection.invoke('sendMessage', this.currentMessage);
        this.currentMessage.Text = '';
    }
}

export class Message {
    SenderName: string;
    Text: string;
}
