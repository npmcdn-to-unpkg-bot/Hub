module Play {
    "use strict";

    interface Point2D {
        x: number;
        y: number;
    }

    export class Camera {
        public scale:Point2D = {x: 1, y: 1};
        public translate:Point2D = {x: 20, y: 20};

        unproject(x:number, y:number):Point2D {
            return {x: (x - this.translate.x) / this.scale.x, y: (y - this.translate.y) / this.scale.y};
        }
    }

    export class Mouse {
        public static button:number = 0;
        public static x:number = 0;
        public static y:number = 0;
    }


    export class Game {
        protected lobby:ClientLobby;
        protected canvas:HTMLCanvasElement;
        protected context:CanvasRenderingContext2D;

        constructor(lobby:ClientLobby) {
            this.lobby = lobby;
            this.canvas = <HTMLCanvasElement>document.getElementById("game-canvas");
            this.context = this.canvas.getContext("2d");
            this.canvas.onmousemove = (e) => {
                Mouse.x = e.offsetX;
                Mouse.y = e.offsetY;
                Mouse.button = e.buttons;
            };
            this.canvas.onmouseup = (e) => {
                Mouse.x = e.offsetX;
                Mouse.y = e.offsetY;
                this.onMouseUp(e);
                Mouse.button = e.buttons;
            };
            this.canvas.onmousedown = (e) => {
                Mouse.x = e.offsetX;
                Mouse.y = e.offsetY;
                Mouse.button = e.buttons;
                this.onMouseDown(e);
            };
            this.canvas.oncontextmenu = (e) => {
                return false;
            };
            this.canvas.onselectstart = (e) => {
                return false;
            };

            this.tick = this.tick.bind(this);
            window.requestAnimationFrame(this.tick);
        }



        tick(time:number) {
            if (this.lobby.state != LobbyState.GAME_RUNNING) {
                return;
            }

            this.draw(time);
            this.update(time);

            window.requestAnimationFrame(this.tick);
        }

        draw(time:number) {
        }

        update(time:number) {
        }

        onMouseUp(e:MouseEvent) {
        }

        onMouseDown(e:MouseEvent) {
        }

        on<T extends GameMessage>(id:number, handler:(message:T) => void):void {
            this.lobby.on(ServiceType.Game, id, (message:IMessage) => {
                handler(<any>message);
            });
        }

        send<T extends GameMessage>(msg:T):void {
            (<any>msg).service = ServiceType.Game;
            this.lobby.sendToServer((<any>msg));
        }
    }
}