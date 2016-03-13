var Minesweeper;
(function (Minesweeper) {
    var Client;
    (function (Client) {
        "use strict";
        var Camera = Play.Client.Camera;
        var Game = Play.Client.Game;
        var Mouse = Play.Client.Mouse;
        var Sprite = Play.Client.Sprite;
        const TILE_SIZE = 30;
        class MinesweeperAssets {
        }
        Client.MinesweeperAssets = MinesweeperAssets;
        class MinesweeperGame extends Game {
            constructor(lobby) {
                super(lobby);
                this.remainingMines = this.variant.mines;
                for (let player of this.players) {
                    player.gameData = {
                        flags: 0,
                        mines: 0,
                        score: 0,
                    };
                }
                this.minefield = new Minesweeper.Minefield(this.variant.width, this.variant.height);
                for (let i = 0; i < this.minefield.width * this.minefield.height; i++) {
                    let field = new Minesweeper.Field();
                    field.hasMine = false;
                    field.owner = null;
                    this.minefield.fields.push(field);
                }
                this.load();
                this.on(Minesweeper.MessageId.SMSG_REVEAL, this.onReveal.bind(this));
                this.on(Minesweeper.MessageId.SMSG_FLAG, this.onFlag.bind(this));
                this.on(Minesweeper.MessageId.SMSG_SCORE, this.onScore.bind(this));
                this.sprites = [];
            }
            initialize() {
                super.initialize();
                this.canvas.width = this.minefield.width * TILE_SIZE + TILE_SIZE * 2;
                this.canvas.height = this.minefield.height * TILE_SIZE + TILE_SIZE * 2;
                this.context.imageSmoothingEnabled = false;
                this.canvas.style.cursor = "pointer";
                this.camera = new Camera(this.canvas);
                this.camera.translateX = TILE_SIZE;
                this.camera.translateY = TILE_SIZE;
                this.emitChange();
                this.playSound(this.assets.start);
            }
            onMouseDown(e) {
                if (Mouse.button == 2) {
                    let position = this.camera.unproject(e.offsetX, e.offsetY);
                    let x = Math.floor(position.x / TILE_SIZE);
                    let y = Math.floor(position.y / TILE_SIZE);
                    if (x >= 0 && y >= 0 && x < this.minefield.width && y < this.minefield.height) {
                        this.flag(x, y);
                    }
                }
            }
            onMouseUp(e) {
                if (Mouse.button == 1 || Mouse.button == 3) {
                    let position = this.camera.unproject(e.offsetX, e.offsetY);
                    let x = Math.floor(position.x / TILE_SIZE);
                    let y = Math.floor(position.y / TILE_SIZE);
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
            update(delta) {
                this.camera.update(delta);
                for (let sprite of this.sprites) {
                    sprite.update(delta);
                }
                this.sprites = this.sprites.filter(s => !s.isFinished);
            }
            draw(delta) {
                let ctx = this.context;
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                ctx.setTransform(this.camera.scaleX, 0, 0, this.camera.scaleY, this.camera.translateX, this.camera.translateY);
                for (let y = 0; y < this.minefield.height; y++) {
                    for (let x = 0; x < this.minefield.width; x++) {
                        let field = this.minefield.get(x + y * this.minefield.width);
                        if (field.isRevealed) {
                            this.drawTile(ctx, this.assets.reveal[field.owner.team], x, y);
                            if (field.hasMine) {
                                this.drawTile(ctx, this.assets.mines[field.owner.team], x, y);
                            }
                            else {
                                if (field.adjacentMines > 0) {
                                    this.drawTile(ctx, this.assets.numbers[field.adjacentMines - 1], x, y);
                                }
                            }
                        }
                        else {
                            let mousePosition = this.camera.unproject(Mouse.x, Mouse.y);
                            if (field.hasFlag) {
                                this.drawTile(ctx, this.assets.hidden, x, y);
                                this.drawTile(ctx, this.assets.flags[field.owner.team], x, y);
                            }
                            else {
                                if (x == Math.floor(mousePosition.x / TILE_SIZE) && y == Math.floor(mousePosition.y / TILE_SIZE)) {
                                    if (Mouse.button == 1) {
                                        this.drawTile(ctx, this.assets.reveal[this.localPlayer.team], x, y);
                                    }
                                    else {
                                        this.drawTile(ctx, this.assets.over, x, y);
                                    }
                                }
                                else {
                                    this.drawTile(ctx, this.assets.hidden, x, y);
                                }
                            }
                        }
                    }
                }
                for (let sprite of this.sprites) {
                    sprite.draw(ctx, delta);
                }
            }
            flag(x, y) {
                let field = this.minefield.get(x + y * this.minefield.width);
                if (field.isRevealed) {
                    return;
                }
                if (field.owner != null) {
                    if (field.owner.id == this.localPlayer.id) {
                        this.send(new Minesweeper.FlagRequestMessage(x + y * this.minefield.width, false));
                    }
                }
                else {
                    this.send(new Minesweeper.FlagRequestMessage(x + y * this.minefield.width, true));
                }
            }
            massReveal(x, y) {
                let fieldId = x + y * this.minefield.width;
                let field = this.minefield.get(fieldId);
                if (!field.isRevealed) {
                    return;
                }
                let flags = 0;
                let unknownFields = 0;
                this.minefield.forAdjacent(fieldId, (id) => {
                    let adjacentField = this.minefield.get(id);
                    if (adjacentField.hasFlag || (adjacentField.isRevealed && adjacentField.hasMine)) {
                        flags++;
                    }
                    if (!adjacentField.isRevealed && !adjacentField.hasFlag) {
                        unknownFields++;
                    }
                });
                if (flags == field.adjacentMines && unknownFields > 0) {
                    this.send(new Minesweeper.MassRevealRequestMessage(x + y * this.minefield.width));
                }
                else {
                    this.playSound(this.assets.invalidmove);
                }
            }
            reveal(x, y) {
                let field = this.minefield.get(x + y * this.minefield.width);
                if (field.isRevealed) {
                    return;
                }
                if (field.hasFlag && field.owner.team == this.localPlayer.team) {
                    return;
                }
                let doubt = field.hasFlag;
                this.send(new Minesweeper.RevealRequestMessage(x + y * this.minefield.width, doubt));
            }
            onScore(msg) {
                let player = this.players.find(p => p.id == msg.playerId);
                player.gameData.score += msg.score;
                this.emitChange();
            }
            onFlag(msg) {
                let field = this.minefield.get(msg.fieldId);
                let player = this.players.find(p => p.id == msg.playerId);
                if (msg.flag) {
                    player.gameData.flags++;
                }
                else {
                    player.gameData.flags--;
                }
                if (msg.flag) {
                    field.owner = player;
                    field.hasFlag = true;
                }
                else {
                    field.owner = null;
                    field.hasFlag = false;
                }
                this.emitChange();
            }
            onReveal(msg) {
                let field = this.minefield.get(msg.fieldId);
                let player = this.players.find(p => p.id == msg.playerId);
                field.isRevealed = true;
                let oldOwner = field.owner;
                field.owner = player;
                field.adjacentMines = msg.adjacentMines;
                field.hasMine = msg.hasMine;
                field.hasFlag = false;
                if (oldOwner != null) {
                    oldOwner.gameData.flags--;
                    this.emitChange();
                }
                if (field.hasMine) {
                    this.playSound(this.assets.boom);
                    const boomDuration = 500;
                    this.camera.shake(2, boomDuration / 2);
                    let x = Math.floor(msg.fieldId % this.minefield.width);
                    let y = Math.floor(msg.fieldId / this.minefield.width);
                    this.sprites.push(new Sprite(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, this.assets.explosion, 64, boomDuration));
                    this.remainingMines--;
                    player.gameData.mines++;
                    this.emitChange();
                }
                else {
                    this.playSound(this.assets.tilesingle);
                }
            }
            load() {
                this.assets = new MinesweeperAssets();
                let root = "app/games/minesweeper/assets/";
                this.assets.hidden = new Image();
                this.assets.hidden.src = root + "images/hidden.png";
                this.assets.over = new Image();
                this.assets.over.src = root + "images/over.png";
                this.assets.reveal = [];
                this.assets.mines = [];
                this.assets.flags = [];
                for (let i = 0; i < 4; i++) {
                    this.assets.reveal[i] = new Image();
                    this.assets.reveal[i].src = root + `images/empty-${i}.png`;
                    this.assets.mines[i] = new Image();
                    this.assets.mines[i].src = root + `images/mine-${i}.png`;
                    this.assets.flags[i] = new Image();
                    this.assets.flags[i].src = root + `images/flag-${i}.png`;
                }
                this.assets.numbers = [];
                for (let i = 0; i < 8; i++) {
                    this.assets.numbers[i] = new Image();
                    this.assets.numbers[i].src = `${root}images/${(i + 1)}.png`;
                }
                this.assets.explosion = new Image();
                this.assets.explosion.src = root + "images/explosion.png";
                this.assets.boom = new Audio(root + "sounds/boom.ogg");
                this.assets.tilesingle = new Audio(root + "sounds/tilesingle.ogg");
                this.assets.tilemultiple = new Audio(root + "sounds/tilemultiple.ogg");
                this.assets.start = new Audio(root + "sounds/start.ogg");
                this.assets.invalidmove = new Audio(root + "sounds/invalidmove.ogg");
            }
            drawTile(ctx, image, x, y) {
                ctx.drawImage(image, 0, 0, image.width, image.height, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }
        Client.MinesweeperGame = MinesweeperGame;
    })(Client = Minesweeper.Client || (Minesweeper.Client = {}));
})(Minesweeper || (Minesweeper = {}));
