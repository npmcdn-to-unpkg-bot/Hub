var Minesweeper;
(function (Minesweeper) {
    var Game;
    (function (Game_1) {
        "use strict";
        var Camera = Play.Camera;
        var Game = Play.Game;
        var Mouse = Play.Mouse;
        const TILE_SIZE = 20;
        class MinesweeperGame extends Game {
            constructor(lobby, configuration) {
                super(lobby);
                this.minefield = new Game_1.Minefield(configuration.width, configuration.height);
                this.canvas.width = this.minefield.width * TILE_SIZE + TILE_SIZE * 2;
                this.canvas.height = this.minefield.height * TILE_SIZE + TILE_SIZE * 2;
                this.load();
                this.on(Minesweeper.MessageId.SMSG_REVEAL, this.onReveal.bind(this));
                this.on(Minesweeper.MessageId.SMSG_FLAG, this.onFlag.bind(this));
                this.on(Minesweeper.MessageId.SMSG_GAME_OVER, this.onGameOver.bind(this));
                this.canvas.style.cursor = "pointer";
                this.camera = new Camera();
            }
            flag(x, y) {
                let field = this.minefield.get(x + y * this.minefield.width);
                if (field.isRevealed) {
                    return;
                }
                if (field.owner != null) {
                    if (field.owner.id == this.lobby.localClient.id) {
                        this.send({
                            id: Minesweeper.MessageId.CMSG_FLAG_REQUEST,
                            fieldId: x + y * this.minefield.width,
                            flag: false
                        });
                    }
                }
                else {
                    this.send({
                        id: Minesweeper.MessageId.CMSG_FLAG_REQUEST,
                        fieldId: x + y * this.minefield.width,
                        flag: true
                    });
                }
            }
            massReveal(x, y) {
                let fieldId = x + y * this.minefield.width;
                let field = this.minefield.get(fieldId);
                if (!field.isRevealed) {
                    return;
                }
                let flags = 0;
                this.minefield.forAdjecent(fieldId, (fieldId) => {
                    let field = this.minefield.get(fieldId);
                    if (field.hasFlag || (field.isRevealed && field.hasMine)) {
                        flags++;
                    }
                });
                if (flags == field.adjecentMines) {
                    this.send({
                        id: Minesweeper.MessageId.CMSG_MASS_REVEAL_REQUEST,
                        fieldId: x + y * this.minefield.width
                    });
                }
            }
            reveal(x, y) {
                let field = this.minefield.get(x + y * this.minefield.width);
                if (field.isRevealed) {
                    return;
                }
                if (field.hasFlag && field.owner.team == this.lobby.localClient.team) {
                    return;
                }
                let doubt = field.hasFlag;
                this.send({
                    id: Minesweeper.MessageId.CMSG_REVEAL_REQUEST,
                    fieldId: x + y * this.minefield.width,
                    doubt: doubt
                });
            }
            onFlag(msg) {
                let field = this.minefield.get(msg.fieldId);
                field.owner = this.lobby.clients.find(c => c.id == msg.playerId);
                field.hasFlag = msg.flag;
            }
            onReveal(msg) {
                let field = this.minefield.get(msg.fieldId);
                field.isRevealed = true;
                field.owner = this.lobby.clients.find(c => c.id == msg.playerId);
                field.adjecentMines = msg.adjacentMines;
                field.hasMine = msg.hasMine;
                field.hasFlag = false;
                if (field.hasMine) {
                }
            }
            onGameOver(msg) {
                this.isGameOver = true;
                if (this.onGameOverCallback != null) {
                    this.onGameOverCallback();
                }
            }
            load() {
                this.assets = {};
                let root = "games/minesweeper/assets/";
                this.assets.hidden = new Image();
                this.assets.hidden.src = root + "images/hidden.png";
                this.assets.over = new Image();
                this.assets.over.src = root + "images/over.png";
                this.assets.reveal = [];
                this.assets.mines = [];
                this.assets.flags = [];
                this.assets.reveal[0] = new Image();
                this.assets.reveal[0].src = root + "images/empty-red.png";
                this.assets.mines[0] = new Image();
                this.assets.mines[0].src = root + "images/mine-red.png";
                this.assets.flags[0] = new Image();
                this.assets.flags[0].src = root + "images/flag-red.png";
                this.assets.reveal[1] = new Image();
                this.assets.reveal[1].src = root + "images/empty-blue.png";
                this.assets.mines[1] = new Image();
                this.assets.mines[1].src = root + "images/mine-blue.png";
                this.assets.flags[1] = new Image();
                this.assets.flags[1].src = root + "images/flag-blue.png";
                this.assets.numbers = [];
                for (let i = 0; i < 8; i++) {
                    this.assets.numbers[i] = new Image();
                    this.assets.numbers[i].src = root + "images/" + (i + 1) + ".png";
                }
            }
            draw() {
                var ctx = this.context;
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                ctx.setTransform(this.camera.scale.x, 0, 0, this.camera.scale.y, this.camera.translate.x, this.camera.translate.y);
                for (let y = 0; y < this.minefield.height; y++) {
                    for (let x = 0; x < this.minefield.width; x++) {
                        let field = this.minefield.get(x + y * this.minefield.width);
                        if (field.isRevealed) {
                            ctx.drawImage(this.assets.reveal[field.owner.team], x * TILE_SIZE, y * TILE_SIZE);
                            if (field.hasMine) {
                                ctx.drawImage(this.assets.mines[field.owner.team], x * TILE_SIZE, y * TILE_SIZE);
                            }
                            else {
                                if (field.adjecentMines > 0) {
                                    ctx.drawImage(this.assets.numbers[field.adjecentMines - 1], x * TILE_SIZE, y * TILE_SIZE);
                                }
                            }
                        }
                        else {
                            let mousePosition = this.camera.unproject(Mouse.x, Mouse.y);
                            if (field.hasFlag) {
                                ctx.drawImage(this.assets.hidden, x * TILE_SIZE, y * TILE_SIZE);
                                ctx.drawImage(this.assets.flags[field.owner.team], x * TILE_SIZE, y * TILE_SIZE - TILE_SIZE / 3);
                            }
                            else {
                                if (x == ((mousePosition.x / TILE_SIZE) | 0) && y == ((mousePosition.y / TILE_SIZE) | 0)) {
                                    if (Mouse.button == 1) {
                                        ctx.drawImage(this.assets.reveal[this.lobby.localClient.team], x * TILE_SIZE, y * TILE_SIZE);
                                    }
                                    else {
                                        ctx.drawImage(this.assets.over, x * TILE_SIZE, y * TILE_SIZE);
                                    }
                                }
                                else {
                                    ctx.drawImage(this.assets.hidden, x * TILE_SIZE, y * TILE_SIZE);
                                }
                            }
                        }
                    }
                }
            }
            onMouseDown(e) {
                if (Mouse.button == 2) {
                    let position = this.camera.unproject(e.offsetX, e.offsetY);
                    let x = (position.x / TILE_SIZE) | 0;
                    let y = (position.y / TILE_SIZE) | 0;
                    if (x >= 0 && y >= 0 && x < this.minefield.width && y < this.minefield.height) {
                        this.flag(x, y);
                    }
                }
            }
            onMouseUp(e) {
                if (Mouse.button == 1 || Mouse.button == 3) {
                    let position = this.camera.unproject(e.offsetX, e.offsetY);
                    let x = (position.x / TILE_SIZE) | 0;
                    let y = (position.y / TILE_SIZE) | 0;
                    if (x >= 0 && y >= 0 && x < this.minefield.width && y < this.minefield.height) {
                        if (Mouse.button == 3) {
                            this.massReveal(x, y);
                        }
                        else {
                            this.reveal(x, y);
                        }
                    }
                }
            }
        }
        Game_1.MinesweeperGame = MinesweeperGame;
    })(Game = Minesweeper.Game || (Minesweeper.Game = {}));
})(Minesweeper || (Minesweeper = {}));
//# sourceMappingURL=game.js.map