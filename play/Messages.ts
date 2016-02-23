namespace Play {
    "use strict";

    export class LobbyConfiguration {
        public lobbyId: string;
        public gameId: string;

        /**
         * Class representic react component for this game
         */
        public appClass: any;
        /**
         * Class containing client side game logic
         */
        public gameClass: any;
        /**
         * Class containing server side game logic
         */
        public serviceClass: any;

        public maxPlayers: number;

        /**
         * Configuration specific to this game and game variant
         */
        public gameConfiguration: any;
    }

    export enum ServiceType {
        Lobby = 1,
        Game = 2
    }

    export enum LobbyMessageId {
        CMSG_JOIN_REQUEST = 1,
        SMSG_PLAYER_JOINED = 2,
        SMSG_GAME_START = 3,
        SMSG_GAME_OVER = 4,
        CMSG_READY = 5,
        SMSG_PLAYER_READY = 6,
        CMSG_CHAT = 7,
        SMSG_PLAYER_CHAT = 8
    }


    export abstract class Message {
        constructor(public id: number, public service: ServiceType) {
        }
    }

    export abstract class GameMessage extends Message {
        constructor(public id: number) {
            super(id, ServiceType.Game);
        }
    }

    export abstract class LobbyMessage extends Message {
        constructor(public id: number) {
            super(id, ServiceType.Lobby);
        }
    }


    export class ChatMessage extends LobbyMessage {
        constructor(public text: string) {
            super(LobbyMessageId.CMSG_CHAT);
        }
    }

    export class PlayerChatMessage extends LobbyMessage {
        constructor(public playerId: string, public text: string) {
            super(LobbyMessageId.SMSG_PLAYER_CHAT);
        }
    }

    export class GameOverMessage extends LobbyMessage {
        constructor() {
            super(LobbyMessageId.SMSG_GAME_OVER);
        }
    }


    export class ReadyMessage extends LobbyMessage {
        constructor() {
            super(LobbyMessageId.CMSG_READY);
        }
    }

    export class PlayerReadyMessage extends LobbyMessage {
        constructor(public playerId: string) {
            super(LobbyMessageId.SMSG_PLAYER_READY);
        }
    }

    export class JoinRequestMessage extends LobbyMessage {
        constructor(public name: string, public team: number) {
            super(LobbyMessageId.CMSG_JOIN_REQUEST);
        }
    }

    export class PlayerJoinedMessage extends LobbyMessage {
        constructor(public playerId: string,
                    public name: string,
                    public team: number,
                    public configuration?: any,
                    public isYou?: boolean) {
            super(LobbyMessageId.SMSG_PLAYER_JOINED);
        }
    }

    export class GameStartMessage extends LobbyMessage {
        constructor() {
            super(LobbyMessageId.SMSG_GAME_START);
        }
    }
}