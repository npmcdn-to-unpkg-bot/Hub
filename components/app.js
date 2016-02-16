"use strict";
var LobbyService = Play.FirebaseLobbyService;
var FirebaseLobbyService = Play.FirebaseLobbyService;
window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;
window.RTCIceCandidate = window.mozRTCIceCandidate || window.RTCIceCandidate;
var games = [
    {
        id: "minesweeper",
        name: "Minesweeper on Steroids",
        configurations: [
            {
                id: "default",
                name: "Play 1v1 now!",
                maxPlayers: 2,
                width: 10,
                height: 10,
                mines: 1
            },
            {
                id: "friend",
                name: "Play with friend",
                maxPlayers: 2,
                width: 10,
                height: 10,
                mines: 1
            }
        ]
    },
    {
        id: "chess",
        name: "Chess on Steroids",
        configurations: []
    }
];
class App extends React.Component {
    render() {
        return (React.createElement("div", {"className": "container"}, React.createElement(Header, null), this.props.children));
    }
}
ReactDOM.render((React.createElement(ReactRouter.Router, {"history": ReactRouter.hashHistory}, React.createElement(ReactRouter.Route, {"path": "/", "component": App}, React.createElement(ReactRouter.IndexRoute, {"component": GameList}), React.createElement(ReactRouter.Route, {"path": "/games", "component": GameList}), React.createElement(ReactRouter.Route, {"path": "/minesweeper", "component": MinesweeperApp}), React.createElement(ReactRouter.Route, {"path": "/lobby/:lobbyId", "component": LobbyComponent}), React.createElement(ReactRouter.Route, {"path": "*", "component": NoMatch})))), document.getElementById('content'));
//# sourceMappingURL=app.js.map