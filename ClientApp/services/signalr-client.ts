import { $, SignalR } from 'ms-signalr-client-jquery-3';
import 'ms-signalr-client-jquery-3';
import * as jQuery from 'jquery'
import { LogManager } from 'aurelia-framework';

const log = LogManager.getLogger('SignalR');

export class SignalRClient {

    connection: SignalR.Hub.Connection;
    debug: Boolean = false;
    running: Boolean = false;
    deferred: JQueryPromise<any>;

    constructor() {
        this.createHub('chat');
    }

    private createHub(hubName) {
        if (!this.connection) {
            this.connection = jQuery.hubConnection('') as SignalR.Hub.Connection;
            //The following can be used to pass certain data to the hub on connection such as user id.
            //this.connection.qs = { UserId: '{SomeUserId}', Token: '{SomeUserToken}' };
        }
        hubName = hubName.toLocaleLowerCase();
        if (!this.connection.proxies[hubName]) {
            this.connection.createHubProxy(hubName);
            this.connection.proxies[hubName].events = {};
        }
    }

    async invoke(hubName, methodName: string, ...args: any[]): Promise<any> {
        if (!this.deferred) return null;
        await this.deferred;

        try {
            let result = await this.connection.proxies[hubName].invoke(methodName, ...args);
            log.debug(`${hubName}.${methodName}`, result);
            return result;
        } catch (error) {
            log.error(log.info(`Error invoking ${hubName}.${methodName}`, error));
            return null;
        }
    }

    async setCallback(hubName, eventName, callBack, cbNameOverride = null): Promise<any> {

        hubName = hubName.toLocaleLowerCase();
        if (!this.connection.proxies[hubName].events[eventName]) {
            this.connection.proxies[hubName].events[eventName] = {};
            this.connection.proxies[hubName].on(eventName, data => {
                for (var eventHandler of Object.keys(this.connection.proxies[hubName].events[eventName])) {
                    this.connection.proxies[hubName].events[eventName][eventHandler](data);
                }
            });
        }
        this.connection.proxies[hubName].events[eventName][cbNameOverride || callBack.name] = data => {
            callBack(data);
        };
    }

    start() {
        if (!this.deferred) {
            try {
                this.deferred = this.connection.start({ jsonp: true });
                log.info('Connection established.');
            } catch (error) {
                log.error('Connection failed.', error);
            }
        }
    }

    async stop(hubName, funcName, callBack, cbNameOverride = null) {
        if (!this.deferred) return null;
        await this.deferred;

        log.debug('Disconnecting...');
        if (this.connection.proxies[hubName]) {
            if (this.connection.proxies[hubName].events[funcName]) {
                delete this.connection.proxies[hubName].events[funcName][cbNameOverride || callBack.name];
            }

            if (Object.keys(this.connection.proxies[hubName].events[funcName]).length === 0)
                delete this.connection.proxies[hubName].events[funcName];

            if (Object.keys(this.connection.proxies[hubName].events).length === 0)
                delete this.connection.proxies[hubName];
        }

        if (Object.keys(this.connection.proxies).length === 0) {
            this.connection.stop();
            this.deferred = null;
        }
    }
}