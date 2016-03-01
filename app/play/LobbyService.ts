namespace Play {
    "use strict";

    import Client = Play.Server.Client;
    import ServerLobby = Play.Server.ServerLobby;
    import LocalServerConnection = Play.Server.LocalServerConnection;
    import LocalClientConnection = Play.Server.LocalClientConnection;


    export interface ILobbyService {
        findLobby(gameConfiguration: LobbyConfiguration): Promise<ClientLobby>;
        onClientJoined(lobby: ServerLobby, client: Client): void;
    }

    export interface ILobbyDescription {
        playerCount: number;
        maxPlayers: number;
        gameId: string;
        createdAt: Date;
        gameVariant: string;
    }

    export class FirebaseLobbyService implements ILobbyService {

        public onClientJoined(lobby: ServerLobby, client: Client): void {

            let firebase = new Firebase(config.get(environment).firebaseURL);
            let lobbyRef = firebase.child("lobby").child(lobby.lobbyId);

            lobbyRef.transaction((data) => {
                if (data != null) {
                    data.playerCount += 1;
                }
                return data;
            }, (error, commited, snapshot) => {
                if (error != null) {
                    console.error(error);
                }
            }, true);
        }

        public getLobbyList(): Promise<ILobbyDescription[]> {
            return new Promise<ILobbyDescription[]>((resolve, reject) => {
                let lobbiesRef = new Firebase(config.get(environment).firebaseURL).child("lobby");
                lobbiesRef.once("value", (snapshot) => {
                    let result: ILobbyDescription[] = [];
                    snapshot.forEach( (lobbySnapshot) => {
                        result.push(lobbySnapshot.val());
                    });
                    resolve(result);
                });
            });
        }

        public findLobby(configuration: LobbyConfiguration): Promise<ClientLobby> {
            return new Promise<ClientLobby>((resolve, reject) => {
                let lobbiesRef = new Firebase(config.get(environment).firebaseURL).child("lobby");

                // no desired game
                if (configuration.lobbyId == null) {

                    // try to find relevant games
                    lobbiesRef.once("value", (snapshot) => {
                        let lobbyRef: Firebase = null;
                        let found = snapshot.forEach((lobbySnapshot) => {
                            let value = lobbySnapshot.val();
                            if (value.playerCount < value.maxPlayers && value.gameId == configuration.gameConfiguration.id && value.gameVariant == configuration.variant.id) {
                                lobbyRef = lobbySnapshot.ref();
                                return true;
                            }
                        });
                        if (!found) {

                            let lobbyDescription = {
                                playerCount: 0,
                                maxPlayers: configuration.variant.maxPlayers,
                                gameId: configuration.gameConfiguration.id,
                                createdAt: new Date(),
                                gameVariant: configuration.variant.id,
                            };

                            let lobbyRef = lobbiesRef.push();
                            lobbyRef.set(lobbyDescription, () => {
                                lobbyRef.onDisconnect().remove()

                                let lobbyId = lobbyRef.key();

                                let clientLobby = new ClientLobby(lobbyId, configuration);
                                clientLobby.clientGUID = Guid.generate();

                                let localClient = new Client();
                                localClient.id = clientLobby.clientGUID;
                                localClient.name = "server";
                                localClient.team = 0;


                                let serverLobby = new ServerLobby(lobbyId, configuration);

                                let signalingService = new SignalingService();
                                let ref = new Firebase(config.get(environment).firebaseURL).child("lobby").child(serverLobby.lobbyId).child("sdp");
                                signalingService.createSignalingServer(serverLobby, new FirebaseSignalingChannel(ref));


                                let localServerConnection = new LocalServerConnection(localClient);
                                localServerConnection.messageHandler = (client: Client, msg: Message) => {
                                    serverLobby.onMessage(localClient, <any>msg);
                                };
                                clientLobby.serverConnection = localServerConnection;


                                let localClientConnection = new LocalClientConnection();
                                localClientConnection.messageHandler = (msg) => {
                                    clientLobby.onMessage(<any>msg);
                                };
                                localClient.connection = localClientConnection;


                                serverLobby.clients.push(localClient);
                                clientLobby.join();

                                resolve(clientLobby);
                            });
                        } else {
                            let lobbyId = lobbyRef.key();
                            let lobby = new ClientLobby(lobbyId, configuration);
                            lobby.clientGUID = Guid.generate();

                            let signalingService = new SignalingService();
                            let ref = new Firebase(config.get(environment).firebaseURL).child("lobby").child(lobby.lobbyId).child("sdp");
                            signalingService.createSignalingClient(lobby, new FirebaseSignalingChannel(ref));

                            resolve(lobby);
                        }
                    });

                } else {
                    // let lobbyRef = lobbies.child(configuration.lobbyId);
                    throw "Not implemented";
                }
            });
        }

    }

}