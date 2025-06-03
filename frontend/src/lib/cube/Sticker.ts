
/**
 * Worth noting that the cordinate systems follows the right hand rule
 * 
 * Note: fingers represent the POSITIVE direction of said axis:
 * 
 * x — index finger
 * y — long  finger
 * z — thumb
 */
export class Sticker {
    position: number[]   = [];
    normal: number[]     = [];
    vertices: number[][] = [];
    color: string        = "";
    initialAxis: "x"|"y"|"z" ;

    /**
     * 
     * @param color duh?
     * @param position center of sticker
     * @param orientation x,y, or z
     * @param normal normal vector of sticker, should follow face normal
     */
    public constructor(color: string, position: number[] , orientation: "x"|"y"|"z", normal?: number[]) {
        this.color = color;
        this.position = position;
        this.normal = normal ?? [0, 0, 0]
        this.vertices = this.createVertices(orientation);
        this.initialAxis = orientation;
    }

    /**
     * 
     * @param orientation needed for creating vertices around point
     * @returns array of vertices (array of numbers)
     */
    private createVertices(orientation: "x"|"y"|"z") : number[][] {
        const [x, y, z] = this.position;
        if (orientation === "x") {
            return [
                [x   , y - 1, z - 1],
                [x   , y - 1, z + 1],
                [x   , y + 1, z - 1],
                [x   , y + 1, z + 1]
            ]
        }
        if (orientation === "y") {
            return [
                [x - 1, y   , z - 1],
                [x - 1, y   , z + 1],
                [x + 1, y   , z - 1],
                [x + 1, y   , z + 1]
            ]
        }
        if (orientation === "z") {
            return [
                [x - 1, y - 1, z   ],
                [x - 1, y + 1, z   ],
                [x + 1, y - 1, z   ],
                [x + 1, y + 1, z   ]
            ]
        }
        
        throw new Error("non valid axis (x, y, or z");
    }

    private rotateAroundAxis(point: number[], angle: number, axis: "x"|"y"|"z") : number[] {
        const [x, y, z] = point;
        if (axis === "x") {
            let yp = Math.round(100 * (y * Math.cos(angle) - z * Math.sin(angle))) / 100;
            let zp = Math.round(100 * (z * Math.cos(angle) + y * Math.sin(angle))) / 100;
            return [x, yp, zp]
        }
        if (axis === "y") {
            let xp = Math.round(100 * (x * Math.cos(angle) - z * Math.sin(angle))) / 100;
            let zp = Math.round(100 * (z * Math.cos(angle) + x * Math.sin(angle))) / 100;
            return [xp, y, zp]
        }
        if (axis === "z") {
            let xp = Math.round(100 * (x * Math.cos(angle) - y * Math.sin(angle))) / 100;
            let yp = Math.round(100 * (y * Math.cos(angle) + x * Math.sin(angle))) / 100;
            return [xp, yp, z]
        }

        throw new Error("non valid axis (x, y, or z");
    }

    public rotate(angle: number, axis: "x"|"y"|"z") : void {
        this.position = this.rotateAroundAxis(this.position, angle, axis);
        this.normal = this.rotateAroundAxis(this.normal, angle, axis);
        this.vertices = this.vertices.map(vertex=>{
            return this.rotateAroundAxis(vertex, angle, axis);
        })
    }
}

const s = new Sticker("red", [10,0,0], "x", [1,0,0])