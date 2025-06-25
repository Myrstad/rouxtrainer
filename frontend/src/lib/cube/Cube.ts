import { Sticker } from "./Sticker";

/**
 * Good to know information
 *  - position of stickers are given by (degree of cube, even number, even number) for odd cube degree ie. 3x3
 *  - stickers are considered 2x2 units in size.
 *  - position is also the average of the vertices
 * 
 * Positions:
 *  - +X: back
 *  - -X: front 
 *  - +Y: left
 *  - -Y: right 
 *  - +Z: up
 *  - -Z: down
 */
export class Cube {
    stickers: Sticker[] = [];
    dimention: number = 0;
    stickerWidth: number = 2;
    stickerHalfWidth: number = 1;

    public constructor(dimention: number = 3) {
        this.dimention = dimention;

        const offset = (dimention) // eg. center peice should be [0,3,0] with vertexes [±1,3,±1]

        // (non standard) Right hand coordinates:
        // index (x) back/front
        // long  (y) left/right
        // long  (z) up/down
        this.stickers.push(...this.createFace([ offset, 0, 0], "blue"));
        this.stickers.push(...this.createFace([-offset, 0, 0], "green"));
        this.stickers.push(...this.createFace([0,  offset, 0], "orange"));
        this.stickers.push(...this.createFace([0, -offset, 0], "red"));
        this.stickers.push(...this.createFace([0, 0,  offset], "white"));
        this.stickers.push(...this.createFace([0, 0, -offset], "yellow"));
    }

    public reset() : void {
        this.stickers = [];

        const offset = (this.dimention) // eg. center peice should be [0,3,0] with vertexes [±1,3,±1]

        this.stickers.push(...this.createFace([ offset, 0, 0], "blue"));
        this.stickers.push(...this.createFace([-offset, 0, 0], "green"));
        this.stickers.push(...this.createFace([0,  offset, 0], "orange"));
        this.stickers.push(...this.createFace([0, -offset, 0], "red"));
        this.stickers.push(...this.createFace([0, 0,  offset], "white"));
        this.stickers.push(...this.createFace([0, 0, -offset], "yellow"));
    }

    private createFace(facePosition: number[], color: string) : Sticker[] {
        const stickers: Sticker[] = [];

        const [fx, fy, fz] = facePosition;
        let faceNormal: number[] = [];

        const start = -this.dimention + 1;
        const end = this.dimention
        const step = 2;
        if (fx != 0) {
            faceNormal = [fx/Math.abs(fx),0,0];
            for (let y = start; y < end; y += step) {
                for (let z = start; z < end; z += step) {
                    stickers.push(new Sticker(color, [fx, y, z], "x", faceNormal))
                }
            }
        } else if (fy != 0) {
            faceNormal = [0,fy/Math.abs(fy),0];
            for (let x = start; x < end; x += step) {
                for (let z = start; z < end; z += step) {
                    stickers.push(new Sticker(color, [x, fy, z], "y", faceNormal))
                }
            }
        } else if (fz != 0) {
            faceNormal = [0,0,fz/Math.abs(fz)];
            for (let x = start; x < end; x += step) {
                for (let y = start; y < end; y += step) {
                    stickers.push(new Sticker(color, [x, y, fz], "z", faceNormal))
                }
            }
        } else {
            throw new Error("Invalid face oriantation provied!");
        }

        return stickers;
    }

    public getStickerFromPosition(position: number[]) : Sticker | undefined {
        for (const sticker of this.stickers) {
            if (sticker.position[0] === position[0] &&
                sticker.position[1] === position[1] &&
                sticker.position[2] === position[2])
            {
                return sticker
            }
        }

        return;
    }

    public getStickersFromMove(moveType: string) : Sticker[] {
        const affectedStickers: Sticker[] = [];
        
        switch (moveType) {
            // rotations
            case "x":
            case "y":
            case "z":
                affectedStickers.push(...this.stickers)
                break;

            case "M": // slice
                affectedStickers.push(...this.stickers.filter(sticker => sticker.position[1] === 0))
                break;
            case "E": // slice
                affectedStickers.push(...this.stickers.filter(sticker => sticker.position[2] === 0))
                break;
            case "S": //slice
                affectedStickers.push(...this.stickers.filter(sticker => sticker.position[0] === 0))
                break;
            
            // FRONT/BACK — X axis
            case "B": // normal
                affectedStickers.push(...this.stickers.filter(sticker => sticker.position[0] >= this.dimention - 1))
                break;
            case "b": // wide
                affectedStickers.push(...this.stickers.filter(sticker => sticker.position[0] >= this.dimention - 1 - 2))
                break;
            case "F": // normal
                affectedStickers.push(...this.stickers.filter(sticker => sticker.position[0] <= -(this.dimention - 1)))
                break;
            case "f": // wide
                affectedStickers.push(...this.stickers.filter(sticker => sticker.position[0] <= -(this.dimention - 1 - 2)))
                break;
            // LEFT/RIGHT — Y axis
            case "L": // normal
                affectedStickers.push(...this.stickers.filter(sticker => sticker.position[1] >= this.dimention - 1))
                break;
            case "l": // wide
                affectedStickers.push(...this.stickers.filter(sticker => sticker.position[1] >= this.dimention - 1 - 2))
                break;
            case "R": // normal
                affectedStickers.push(...this.stickers.filter(sticker => sticker.position[1] <= -(this.dimention - 1)))
                break;
            case "r": // wide
                affectedStickers.push(...this.stickers.filter(sticker => sticker.position[1] <= -(this.dimention - 1 - 2)))
                break;
            // UP/DOWN — Z axis
            case "U": // normal
                affectedStickers.push(...this.stickers.filter(sticker => sticker.position[2] >= this.dimention - 1))
                break;
            case "u": // wide
                affectedStickers.push(...this.stickers.filter(sticker => sticker.position[2] >= this.dimention - 1 - 2))
                break;
            case "D": // normal
                affectedStickers.push(...this.stickers.filter(sticker => sticker.position[2] <= -(this.dimention - 1)))
                break;
            case "d": // wide
                affectedStickers.push(...this.stickers.filter(sticker => sticker.position[2] <= -(this.dimention - 1 - 2)))
                break;
            
        
            default:
                console.warn(`Unknown or unsupported move type ${moveType}`)
                break;
        }


        return affectedStickers;
    }

    public paintStickers(stickers: Sticker[], color: string) : void {
        for (const sticker of stickers) {
            sticker.color = color;
        }
    }
    
    public turn(moveType: string, modifier?: "'"|"2"|"") : void {
        let angle: number = Math.PI / 2
        let axis: "x"|"y"|"z";
        let multiplier = 1;
        if (modifier === "'")
            multiplier = -1;
        if (modifier === "2")
            multiplier = 2;

        switch (moveType) {
            // positive axis
            case "U":
            case "u":
            case "y":
                axis = "z"
                angle = (-Math.PI / 2) * multiplier
                this.getStickersFromMove(moveType).forEach(sticker=>sticker.rotate(angle, axis))
                break;
            // negative axis
            case "D":
            case "d":
            case "E":
                axis = "z"
                angle = (Math.PI / 2) * multiplier
                this.getStickersFromMove(moveType).forEach(sticker=>sticker.rotate(angle, axis))
                break;
            // positive axis
            case "B":
            case "b":
                axis = "x"
                angle = (-Math.PI / 2) * multiplier
                this.getStickersFromMove(moveType).forEach(sticker=>sticker.rotate(angle, axis))
                break;
            // negative axis
            case "F":
            case "f":
            case "z":
            case "S":
                axis = "x"
                angle = (Math.PI / 2) * multiplier
                this.getStickersFromMove(moveType).forEach(sticker=>sticker.rotate(angle, axis))
                break;
            // positive axis
            case "L":
            case "l":
            case "M":
                axis = "y"
                angle = (Math.PI / 2) * multiplier
                this.getStickersFromMove(moveType).forEach(sticker=>sticker.rotate(angle, axis))
                break;
            // negative axis
            case "R":
            case "r":
            case "x":
                axis = "y"
                angle = (-Math.PI / 2) * multiplier
                this.getStickersFromMove(moveType).forEach(sticker=>sticker.rotate(angle, axis))
                break;
        
            default:
                console.log("Invalid move:", moveType);
                
                break;
        }
    }

    // Helper functions

    // Paints middle slice and top edges gray.
    // DO THIS AFTER ROTATING TO CORRECT ORIENTATION
    public paintRoux() : void {
        this.paintStickers(this.getStickersFromMove("M"), "gray")
        this.paintStickers([this.getStickerFromPosition([0,3,2]) ?? new Sticker("", [], "x")], "gray")
        this.paintStickers([this.getStickerFromPosition([0,2,3]) ?? new Sticker("", [], "x")], "gray")
        this.paintStickers([this.getStickerFromPosition([0,-2,3]) ?? new Sticker("", [], "x")], "gray")
        this.paintStickers([this.getStickerFromPosition([0,-3,2]) ?? new Sticker("", [], "x")], "gray")
    }

    // important: only do this after initialization / reset.
    public rotateToState(top: string, front: string) : void {
        const topColor = top[0].toLowerCase();
        const frontColor = front[0].toLowerCase();
        
        let currentTopColor = this.getStickerFromPosition([0,0,this.dimention])?.color[0];
        let currentFrontColor = this.getStickerFromPosition([-this.dimention,0,0])?.color[0];
        
        while (currentTopColor != topColor) {
            // Try X 4 times
            for (let i = 0; i < 4; i++) {
                this.turn("x");
                currentTopColor = this.getStickerFromPosition([0,0,this.dimention])?.color[0];
                if (currentTopColor == topColor) break;
            }
            if (currentTopColor == topColor) break;

            const currentLeftColor = this.getStickerFromPosition([0,this.dimention,0])?.color[0];
            if (currentLeftColor == topColor) {
                this.turn("z")
            } else {
                this.turn("z", "'")
            }
            break;
        }

        // Try y four times, if not invalid front color!
        for (let i = 0; i < 4; i++) {
            if (currentFrontColor == frontColor) {
                break
            }
            this.turn("y");
            currentFrontColor = this.getStickerFromPosition([-this.dimention,0,0])?.color[0];
        }
    }

    public getMovesFromAlgorithm(algorithm: string) : string[][] {
        // filter out '(' and ')' from string.
        let filteredString: string = algorithm.replace(/[()]/g, '');
        const rawMoves: string[] = filteredString.split(" ");
        const moves: string[][] = [];

        for (let index = 0; index < rawMoves.length; index++) {
            let baseMove = rawMoves[index];
            const lastChar: string = baseMove[baseMove.length - 1]
            let modifier = "";

            if (lastChar === "'" || lastChar === "2") {
                modifier = lastChar;
                baseMove = baseMove.slice(0, -1);
            }

            if (baseMove.search("2") !== -1) {
                baseMove = baseMove.slice(0, -1);
                modifier = "2";
            }

            if (baseMove.search("w") !== -1) {
                baseMove = baseMove[0].toLowerCase();
            }

            moves.push([baseMove, modifier])
        }

        return moves;
    }

    public reverseMoves(moves: string[][]) : string[][] {
        const reversedMoves: string[][] = [];
        for (let index = moves.length - 1; index >= 0; index--) {
            const move = moves[index];
            let modifier = "";

            // if no modifier (move[0]) or if modifier is empty "", "'" is reverse
            if (move.at(1) === undefined || move.at(1) === "")
                modifier = "'"
            // if modifier is "'", "" is reverse
            if (move.at(1) === "'")
                modifier = ""
            // if modifier is "2", "2" is reverse
            if (move.at(1) === "2")
                modifier = "2"

            reversedMoves.push([move[0], modifier])
        }
        return reversedMoves;
    }

    public applyMoves(moves: string[][]) : void {
        for (let index = 0; index < moves.length; index++) {
            const move = moves[index];
            let modifier: "'"|"2"|"";
            switch (move.at(1)) {
                case undefined:
                case "":
                    modifier = "";
                    break;
                case "'":
                    modifier = "'";
                    break
                case "2":
                    modifier = "2";
                    break;
                default:
                    modifier = "";
                    break;
            }
            this.turn(move[0], modifier)
        }
    }

    public movesToString(moves: string[][]) : string {
        let string = "";
        
        for (let index = 0; index < moves.length; index++) {
            const move = moves[index];
            string += move[0] + move[1] + " ";
        }

        return string;
    }
}