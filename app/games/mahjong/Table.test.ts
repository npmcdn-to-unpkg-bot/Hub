namespace Mahjong.Test {
    "use strict";

    describe("chi tests", () => {

        beforeEach(() => {
            //spyOn(hand, "someMethod").andCallThrough();
        });

        afterEach(() => {

        });

        it("man 123", () => {
            let table = new Table();
            let myHand = new Hand();
            myHand.tiles.push(TILE_MAP.get(TileId.Man1), TILE_MAP.get(TileId.Man2));
            let moves = table.getAvailableMovesOnYourTurn(TileId.Man1, myHand);
            expect(moves.length).toBe(1, "One available move expected");
            expect(moves[0].type).toBe(Mahjong.MoveType.Chi, "Move should be chi");
            expect(moves[0].tile[0]).toBe(TileId.Man1);
            expect(moves[0].tile[1]).toBe(TileId.Man2);
            expect(moves[0].tile[2]).toBe(TileId.Man3);
        });

    });
}