import ClientLobby = Play.ClientLobby;
"use strict";
class MinesweeperScore extends React.Component<any, any> {

}

class MinesweeperGameOver extends React.Component<any, any> {

    backToLobby() {
        console.log("again");
    }

    render() {
        var overlayStyle = {
                position: "absolute",
                right: 0,
                bottom: 0,
                left: 0,
                top: 0,
                background: "rgba(1,1,1,0.4)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                color: "white",
                textShadow: "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000",
                textAlign: "center"
            };
        return (
            <div style={overlayStyle}>
                <div>
                <h2>GAME OVER</h2>
                <br/>
                <button className="btn btn-default" type="submit" onClick={this.backToLobby}>Back to Lobby</button>
                </div>
            </div>
        )
    }
}
class MinesweeperApp extends React.Component<any, any> {

    constructor() {
        super();

        this.state = {isGameOver: false};
    }

    componentDidMount() {
        ClientLobby.current.game = new Minesweeper.Game.MinesweeperGame(ClientLobby.current, ClientLobby.current.configuration);
        ClientLobby.current.game.start();
        ClientLobby.current.game.onGameOverCallback = () => {
            this.setState({isGameOver: true});
        }
    }

    render() {
        var gameStyle = {position: "relative", textAlign: "center"};
        return (
            <div style={gameStyle}>
                <h3>Minesweeper</h3>
                <canvas id="game-canvas"/>
                { this.state.isGameOver ? <MinesweeperGameOver /> : null }
            </div>
        );
    }
}