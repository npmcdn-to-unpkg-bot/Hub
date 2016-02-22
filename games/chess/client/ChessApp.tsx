module Chess.Client {
    "use strict";

    import ClientLobby = Play.Client.ClientLobby;


    export class ChessApp extends React.Component<any, {players: PlayerInfo[]}> {
        private stateChangeToken: number;

        constructor() {
            super();

            // let game = ClientLobby.current.game as ChessGame;

            this.state = {
                players: ClientLobby.current.players,
            }
        }

        protected componentDidMount(): void {
            console.log("ChessApp.componentDidMount");

            let game = ClientLobby.current.game as ChessGame;
            game.initialize();

            this.stateChangeToken = game.changeListener.register((game: ChessGame) => {
                console.log("ChessApp.changeListener");
                this.setState({
                    players: ClientLobby.current.players
                })
            });
        }

        protected componentWillUnmount(): void {
            let game = ClientLobby.current.game as ChessGame;
            game.changeListener.unregister(this.stateChangeToken);
        }

        public render(): JSX.Element {
            return (
                <div style={{position: "relative", textAlign: "center"}}>
                    <div className="row">
                        <div className="col-xs-12 col-md-8">
                            <canvas id="game-canvas"/>
                        </div>
                        <div className="col-xs-12 col-md-4">
                            <Chess.Client.ChessScore players={this.state.players}/>
                        </div>
                        <div className="col-xs-12 col-md-4">
                            <Chat/>
                        </div>
                    </div>
                </div>
            );
        }
    }
}
