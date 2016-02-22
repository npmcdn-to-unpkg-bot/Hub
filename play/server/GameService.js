var Play;
(function (Play) {
    var Server;
    (function (Server) {
        "use strict";
        class GameService extends Server.Service {
            constructor(lobby) {
                super(lobby);
                this.tick = this.tick.bind(this);
                this.lastFrame = performance.now();
            }
            start() {
            }
            get players() {
                return this.lobby.clients;
            }
            on(id, handler) {
                this.lobby.on(Play.ServiceType.Game, id, handler);
            }
            broadcast(msg) {
                this.lobby.broadcast(msg);
            }
            sendTo(client, msg) {
                client.connection.send(msg);
            }
            update(delta) {
            }
            tick(time) {
                let delta = time - this.lastFrame;
                this.update(delta);
                this.lastFrame = time;
                window.requestAnimationFrame(this.tick);
            }
        }
        Server.GameService = GameService;
    })(Server = Play.Server || (Play.Server = {}));
})(Play || (Play = {}));
//# sourceMappingURL=GameService.js.map