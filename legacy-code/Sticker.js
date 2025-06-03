

class Sticker {
    /**
     * 
     * @param {string} color white, orange, green, red, blue, yellow (or gray/transparent)
     * @param {number[]} position 3d position of face normal
     * @param {string} orientation x, y, z which direction the face points to
     */
    constructor(color = "gray", position = [0,0,0], orientation = "x") {
        self.color = color;
        self.position = position;
        self.vertices = null;
    }

    _createVertices(orientation) {
        const [x, y, z] = this.position;
        if (orientation.toLowerCase() === 'x') {
            return [-1, 1].flatMap(b => [1, -1].map(c => [x, y + b, z + c]));
        }

        throw new Error("Orientation must be either 'x', 'y', or 'z'");
    }
}