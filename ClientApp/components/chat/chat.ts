import { ChatHubProxy, Message } from "../../services/chat-hub-proxy";
import { Subscription } from 'rxjs';
import { autoinject } from 'aurelia-framework';

@autoinject
export class Chat {

    public senderName: string;
    public text: string;
    public incomingMessages: Message[] = [];

    private subscription: Subscription;

    constructor(private chatHubProxy: ChatHubProxy) {
    }

    public activate(): void {
        this.subscription = this.chatHubProxy.messageReceived.subscribe(message => {
            this.incomingMessages.push(message);
        });
    }

    public decativate(): void {
        this.subscription.unsubscribe();
    }

    public sendMessage() {
        var message = new Message(this.senderName, this.text);
        this.chatHubProxy.send(message);
        this.text = '';
    }
}
