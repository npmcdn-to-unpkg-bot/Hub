module Play.Client {
    "use strict";

    export class PlayerInfo {
        public id:string;
        public name:string;
        public team:number;
        public isReady: boolean;
        public gameData: any;
    }
}