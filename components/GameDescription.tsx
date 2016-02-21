"use strict";

class GameDescription extends React.Component<any, any> {

    constructor() {
        super();
        this.startGame = this.startGame.bind(this);
    }

    static resolveClass(name: string) {
        let result: any = window;
        for (let part of name.split(".")) {
            result = result[part];
        }
        if (result == null) {
            throw `Class: ${name} not found`;
        }
        return result;
    }


    //TODO: DEBUG ONLY
    componentDidMount() {
        if (this.props.game.id == "chess") {
        //   this.startGame(this.props.game.variants[1]);
        }
    }

    startGame(variant: any) {
        console.log("GameDescription.startGame", variant);

        let lobbyConfiguration = new Play.LobbyConfiguration();
        lobbyConfiguration.maxPlayers = variant.maxPlayers;
        lobbyConfiguration.gameConfiguration = variant;
        lobbyConfiguration.gameId = this.props.game.id;
        lobbyConfiguration.appClass = GameDescription.resolveClass(this.props.game.appClass);
        lobbyConfiguration.gameClass = GameDescription.resolveClass(this.props.game.gameClass);
        lobbyConfiguration.serviceClass = GameDescription.resolveClass(this.props.game.serviceClass);


        let lobbyService:Play.ILobbyService = new Play.FirebaseLobbyService();
        lobbyService.findLobby(lobbyConfiguration).then((lobby) => {
            Play.Client.ClientLobby.current = lobby;

            ReactRouter.hashHistory.pushState(null, `/lobby/${lobby.lobbyId}`);
        });
    }

    render() {
        return (
            <div>
                <h3>{this.props.game.name}</h3>
                <div>
                    <p>{this.props.game.description}</p>
                    <span>Currently playing: ? games</span>
                </div>
                <div className="btn-group-vertical" role="group">
                    { this.props.game.variants.map( (variant: any) => (
                    <button key={variant.id} type="button"
                            className={variant.id == "default" ? "btn btn-primary" : "btn btn-default"}
                            onClick={this.startGame.bind(this, variant)}>
                        {variant.name}
                    </button>)) }
                </div>
            </div>
        );
    }
}
