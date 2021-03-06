namespace Minesweeper.Server {
    "use strict";

    import GameService = Play.Server.GameService;
    import ServerLobby = Play.Server.ServerLobby;
    import IPlayerInfo = Play.IPlayerInfo;


    export class MinesweeperService extends GameService<IMinesweeperVariant, IMinesweeperPlayer> {

        private static SCORE_INCORRECT_FLAG = -500;
        private static SCORE_CORRECT_FLAG = 250;
        private static SCORE_CORRECT_DOUBT = 750;
        private static SCORE_INCORRECT_DOUBT = -1000;
        private static SCORE_EXPLOSION = -750;

        private minefield: Minefield;
        private mines: number;
        private flaggedMines: number = 0;
        private generated = false;

        constructor(lobby: ServerLobby) {
            super(lobby);

            this.on(MessageId.CMSG_REVEAL_REQUEST, this.onRevealRequest.bind(this));
            this.on(MessageId.CMSG_FLAG_REQUEST, this.onFlagRequest.bind(this));
            this.on(MessageId.CMSG_MASS_REVEAL_REQUEST, this.onMassRevealRequest.bind(this));


            this.minefield = new Minefield(this.variant.width, this.variant.height);
            this.mines = this.variant.mines;

            for (let player of this.players) {
                player.gameData = {
                    score: 0,
                    mines: 0,
                    flags: 0,
                };
            }
        }

        private checkGameOver(): void {
            if (this.flaggedMines == this.mines) {
                this.gameOver();
            }
        }

        private gameOver(): void {
            for (let i = 0; i < this.minefield.width * this.minefield.height; i++) {
                let field = this.minefield.get(i);
                if (field.hasFlag) {
                    if (field.hasMine) {
                        this.score(field.owner, MinesweeperService.SCORE_CORRECT_FLAG);
                    } else {
                        this.score(field.owner, MinesweeperService.SCORE_INCORRECT_FLAG);
                    }
                }
            }
            this.lobby.gameOver();
        }


        private score(client: IPlayerInfo<IMinesweeperPlayer>, score: number): void {
            client.gameData.score += score;
            this.lobby.broadcast(new ScoreMessage(client.id, score));
        }


        private flag(client: IPlayerInfo<IMinesweeperPlayer>, fieldId: number, flag: boolean): void {
            let field = this.minefield.get(fieldId);
            if (field.isRevealed) {
                return;
            }

            field.hasFlag = flag;
            if (flag) {
                field.owner = client;
                this.lobby.broadcast(new FlagMessage(client.id, fieldId, true));
                if (field.hasMine) {
                    this.flaggedMines++;
                    this.checkGameOver();
                }
            } else {
                field.owner = null;
                this.lobby.broadcast(new FlagMessage(client.id, fieldId, false));
                if (field.hasMine) {
                    this.flaggedMines--;
                    this.checkGameOver();
                }
            }


        }

        private massReveal(client: IPlayerInfo<IMinesweeperPlayer>, fieldId: number): void {

            let field = this.minefield.get(fieldId);
            if (!field.isRevealed || field.adjacentMines == 0 || field.hasMine) {
                return;
            }


            let flags = 0;
            let unknownFields = 0;
            this.minefield.forAdjacent(fieldId, (id) => {
                let adjacentField = this.minefield.get(id);
                if (adjacentField.hasFlag || (adjacentField.isRevealed && adjacentField.hasMine)) {
                    flags++;
                }
                if (!adjacentField.isRevealed && !adjacentField.hasFlag) { // are there any unrevealed unflagged fields left?
                    unknownFields++;
                }
            });

            if (flags == field.adjacentMines && unknownFields > 0) {
                this.minefield.forAdjacent(fieldId, (id) => {
                    let adjacentField = this.minefield.get(id);
                    if (!adjacentField.isRevealed && !adjacentField.hasFlag) { // reveal all non flagged
                        this.reveal(client, id);
                    }
                });
            }

        }


        private reveal(player: IPlayerInfo<any>, fieldId: number, doubt?: boolean): void {

            let field = this.minefield.get(fieldId);
            if (field.isRevealed) {
                return;
            }
            if (field.hasFlag) {
                // can not reveal your own flags
                if (field.owner.team == player.team) {
                    return;
                }
                // can only doubt flags of other players
                if (!doubt) {
                    return;
                }
            }

            let oldOwner = field.owner;
            field.isRevealed = true;
            field.owner = player;
            field.hasFlag = false;

            this.lobby.broadcast(new RevealMessage(player.id, fieldId, field.adjacentMines, field.hasMine));

            if (field.hasFlag) {
                if (field.hasMine) { // doubt mine
                    this.score(oldOwner, MinesweeperService.SCORE_EXPLOSION);
                    this.score(field.owner, MinesweeperService.SCORE_CORRECT_DOUBT);
                    this.mines--;
                    this.checkGameOver();
                } else { // doubt empty field
                    this.score(oldOwner, MinesweeperService.SCORE_CORRECT_FLAG);
                    this.score(field.owner, MinesweeperService.SCORE_INCORRECT_DOUBT);
                }
            } else {
                if (field.hasMine) { // reveal mine
                    this.score(field.owner, MinesweeperService.SCORE_EXPLOSION);
                    this.mines--;
                    this.checkGameOver();
                } else { // reveal empty field
                    if (field.adjacentMines == 0) {
                        this.minefield.forAdjacent(fieldId, (id) => {
                            let adjacentField = this.minefield.get(id);
                            if (!adjacentField.hasMine && !adjacentField.isRevealed && !adjacentField.hasFlag) {
                                this.reveal(player, id);
                            }
                        });
                    }
                }
            }
        }

        private onFlagRequest(client: IPlayerInfo<IMinesweeperPlayer>, msg: FlagRequestMessage): void {
            this.flag(client, msg.fieldId, msg.flag);
        }

        private onMassRevealRequest(client: IPlayerInfo<IMinesweeperPlayer>, msg: MassRevealRequestMessage): void {

            this.massReveal(client, msg.fieldId);
        }

        private onRevealRequest(client: IPlayerInfo<IMinesweeperPlayer>, msg: RevealRequestMessage): void {
            // todo: sanitize input

            if (!this.generated) {
                this.generate(msg.fieldId);
            }

            this.reveal(client, msg.fieldId, msg.doubt);

        }

        private generate(safeFieldId: number): void {

            let result = this.minefield;

            for (let i = 0; i < result.width * result.height; i++) {
                let field: Field = new Field();
                field.hasMine = false;
                field.owner = null;

                result.fields.push(field);
            }

            let safePosition = {x: (safeFieldId % result.width) | 0, y: (safeFieldId / result.width) | 0};

            let minesRemaining = this.mines;
            while (minesRemaining > 0) {
                let fieldId = Math.floor(Math.random() * result.width * result.height);
                let x = Math.floor(fieldId % result.width);
                let y = Math.floor(fieldId / result.width);

                if (x >= safePosition.x - 1 && x <= safePosition.x + 1 && y >= safePosition.y - 1 && y <= safePosition.y + 1) {
                    continue;
                }

                if (!result.fields[fieldId].hasMine) {
                    result.fields[fieldId].hasMine = true;
                    minesRemaining--;
                }
            }


            for (let y = 0; y < result.height; y++) {
                for (let x = 0; x < result.width; x++) {
                    let fieldId = x + y * result.width;
                    let field = result.fields[fieldId];
                    field.adjacentMines = 0;
                    this.minefield.forAdjacent(fieldId, (_fieldId) => {
                        let _field = result.fields[_fieldId];
                        if (_fieldId != fieldId && _field.hasMine) {
                            field.adjacentMines++;
                        }
                    })
                }
            }

            this.generated = true;
        }
    }

}