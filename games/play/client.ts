module Play {
    "use strict";
    export interface IConnection {
        send(msg: any): void;
    }

    export class LocalConnection implements IConnection {

        public messageHandler: (msg:IMessage) => void;

        send(msg: any):void {
            this.messageHandler(msg);
        }
    }

    export class Peer2PeerConnection implements IConnection {

        public peerConnection:RTCPeerConnection;
        public dataChannel:RTCDataChannel;
        public messageHandler: (msg:IMessage) => void;

        send(msg: any):void {
            this.dataChannel.send(JSON.stringify(msg))
        }
    }

    export class Client {
        public id:string;
        public name:string;
        public team:number;
        public connection:IConnection;


        send(msg: any):void {
            this.connection.send(msg);
        }

    }
}