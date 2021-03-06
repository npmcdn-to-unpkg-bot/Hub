namespace Play.Server {
    "use strict";

    export enum LobbyState {
        IN_LOBBY,
        GAME_RUNNING,
        GAME_OVER
    }


    class ChatService extends Service {

    }


    export class ServerLobby {
        public static current: ServerLobby;

        public clients: Client<any>[] = [];

        public configuration: LobbyConfiguration;
        public state: LobbyState = LobbyState.IN_LOBBY;
        public gameService: GameService<IGameVariant, any>;

        private messageHandlers = new Map<ServiceType, Map<number, (client: Client<any>, msg: Message) => void>>([
            [ServiceType.Lobby, new Map<number, (client: Client<any>, msg: Message) => void>()],
            [ServiceType.Game, new Map<number, (client: Client<any>, msg: Message) => void>()]
        ]);

        constructor(configuration: LobbyConfiguration) {
            ServerLobby.current = this;
            this.configuration = configuration;

            this.on<JoinRequestMessage>(ServiceType.Lobby, LobbyMessageId.CMSG_JOIN_REQUEST, this.onJoinRequest.bind(this));
            this.on<ReadyMessage>(ServiceType.Lobby, LobbyMessageId.CMSG_READY, this.onReady.bind(this));
            this.on<ChatMessage>(ServiceType.Lobby, LobbyMessageId.CMSG_CHAT, this.onChat.bind(this));

        }


        public on<T extends Message>(service: ServiceType, messageId: number, callback: (client: Client<any>, msg: T) => void): void {
            this.messageHandlers.get(service).set(messageId, callback);
        }

        public destroy() {
            this.clients.forEach(c => c.connection.disconnect());
        }

        public onMessage(client: Client<any>, msg: Message): void {
            let handler = this.messageHandlers.get(msg.service).get(msg.id);
            if (handler != null) {
                handler(client, msg);
            }
        }

        /**
         * Broadcast message to all connected clients
         * @param msg Message to send
         */
        public broadcast(msg: Message): void {
            for (let client of this.clients) {
                client.connection.send(msg);
            }
        }


        public gameOver(): void {
            for (let client of this.clients) {
                client.isReady = false;
            }
            this.broadcast(new GameOverMessage());

            this.state = LobbyState.IN_LOBBY;
            this.messageHandlers.get(ServiceType.Game).clear();
        }


        public startGame(): void {
            this.gameService = new (ClassUtils.resolveClass<GameService<IGameVariant, any>>(this.configuration.gameConfiguration.serviceClass))(this);
            this.state = LobbyState.GAME_RUNNING;
            this.broadcast(new GameStartMessage());
            this.gameService.start();
        }


        private onChat(client: Client<any>, msg: ChatMessage): void {
            this.broadcast(new PlayerChatMessage(client.name, msg.text));
        }

        private onReady(client: Client<any>, msg: ReadyMessage): void {
            console.log("ServerLobby.onReady");
            if (this.state != LobbyState.IN_LOBBY) {
                return;
            }
            client.isReady = true;

            this.broadcast(new PlayerReadyMessage(client.id));

            let readyCount = 0;
            for (let c of this.clients) {
                if (c.isReady) {
                    readyCount++;
                }
            }

            if (readyCount == this.configuration.variant.maxPlayers) {
                this.startGame();
            }
        }


        private onDisconnect(client: Client<any>): void {
            if (client.isConnected) {
                client.isConnected = false;

                this.clients.splice(this.clients.indexOf(client), 1);
                this.broadcast(new PlayerLeftMessage(client.id));
                this.gameOver();
            }
        }

        private onJoinRequest(client: Client<any>, msg: JoinRequestMessage): void {
            console.log("ServerLobby.onJoinRequest", msg);
            // todo: if the game is already running, disconnect client

            client.connection.onDisconnect = this.onDisconnect.bind(this, client);

            client.name = msg.name;

            let teamCount = this.configuration.variant.teamCount;
            if (teamCount == null) {
                teamCount = this.configuration.variant.maxPlayers;
            }
            client.team = Math.floor(this.clients.indexOf(client) % teamCount);
            client.isConnected = true;

            for (let other of this.clients) {
                if (other.id == client.id) {
                    client.connection.send(new PlayerJoinedMessage(other.id, other.name, other.team, this.configuration.gameConfiguration, true));
                } else {
                    if (other.isConnected) {
                        // send other players to connecting player
                        client.connection.send(new PlayerJoinedMessage(other.id, other.name, other.team));

                        // send connecting player to other players
                        other.connection.send(new PlayerJoinedMessage(client.id, client.name, client.team));
                    }
                }
            }


            // todo: inject this
            new FirebaseLobbyService().onClientJoined(this, client);
        }
    }
}