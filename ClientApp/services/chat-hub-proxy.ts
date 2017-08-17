import { SignalRHub } from 'rxjs-signalr';
import { Observable } from "rxjs/Observable";
import 'rxjs/add/operator/map';

export class Message {
    constructor(public senderName: string, public text: string) {
    }
}

export class ChatHubProxy {

    private hub: SignalRHub;
    private hubName: string = 'chat';
    private messageReceivedEvent: string = 'messageReceived';
    private messageReceivedObservable: Observable<Message>;
    private isOnline: boolean;

    constructor() {
        this.hub = new SignalRHub(this.hubName);
        this.messageReceivedObservable = this.hub
            .on(this.messageReceivedEvent)
            .map((data: any) => {
                return new Message(data.senderName, data.text);
            });

        this.hub.start();
    }

    public get messageReceived(): Observable<Message> {
        return this.messageReceivedObservable;
    }

    public send(message: Message) {
        this.sendWithRetries(message, 2);
    }

    private sendWithRetries(message: Message, retries: number) {
        try {
            console.log("sendMessage", message, retries);
            this.hub.send('sendMessage', message);
        } catch (error) {
            console.log("sendMessage", error);
            if (retries > 0) {
                setTimeout(() => {
                    this.sendWithRetries(message, --retries);
                }, 1000);
            }
        }
    }
}